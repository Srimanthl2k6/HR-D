/**
 * Handles workflow action edits from source tabs.
 *
 * @param {Object} event Apps Script edit event.
 * @returns {Object} Workflow handling summary.
 */
function handleWorkflowAction(event) {
  if (!event || !event.range) {
    return { handled: false, executed: false, reason: "Missing edit range." };
  }

  var action = String(event.value || "").trim();
  if (!isWorkflowAction(action)) {
    return { handled: false, executed: false, reason: "Unsupported workflow action." };
  }

  var range = event.range;
  var sheet = range.getSheet();
  var rowNumber = range.getRow();
  var values = getSheetValues_(sheet);
  var headers = values[0] || [];
  ensureWorkflowColumnsForSheet_(sheet, headers);
  values = getSheetValues_(sheet);
  headers = values[0] || [];
  var headerMap = buildHeaderMap(headers, getWorkflowColumnAliases_());
  var row = values[rowNumber - 1] || [];
  var config = loadConfig();

  if (isWorkflowDuplicate_(row, headerMap, action)) {
    logInfo("Skipped duplicate workflow action " + action + " for row " + rowNumber + ".", getActiveUserEmail_());
    return { handled: true, executed: false, duplicate: true, action: action };
  }

  var payload = buildWorkflowEmailPayload_(row, headerMap, action, config);
  var emailResult = sendWorkflowEmail_(payload);
  var timestampColumn = headerMap.fields.workflowExecutedAt + 1;
  var resultColumn = headerMap.fields.workflowLastResult + 1;
  var timestamp = new Date();
  var resultMessage = emailResult.sent
    ? "Executed " + action
    : "Executed " + action + " with email warning: " + emailResult.reason;

  sheet.getRange(rowNumber, timestampColumn).setValue(timestamp);
  sheet.getRange(rowNumber, resultColumn).setValue(resultMessage);
  logInfo("Executed workflow action " + action + " for employee " + payload.employeeId + ".", getActiveUserEmail_());

  return {
    handled: true,
    executed: true,
    duplicate: false,
    action: action,
    email: emailResult
  };
}

/**
 * Returns the configured workflow action names.
 *
 * @returns {string[]} Workflow action names.
 */
function getWorkflowActionNames() {
  return [
    HRD.WORKFLOW_ACTIONS.START_OFFBOARDING,
    HRD.WORKFLOW_ACTIONS.SCHEDULE_PIP,
    HRD.WORKFLOW_ACTIONS.APPROVE_CONFIRMATION
  ];
}

/**
 * Determines whether a value is a supported workflow action.
 *
 * @param {string} value Candidate action value.
 * @returns {boolean} True when the action is supported.
 */
function isWorkflowAction(value) {
  return getWorkflowActionNames().indexOf(String(value || "").trim()) !== -1;
}

/**
 * Ensures workflow columns exist on a source sheet.
 *
 * @param {Object} sheet Sheet object.
 * @param {string[]} headers Existing headers.
 * @returns {void}
 */
function ensureWorkflowColumnsForSheet_(sheet, headers) {
  var currentHeaders = headers.slice();
  [
    HRD.WORKFLOW_COLUMNS.ACTION,
    HRD.WORKFLOW_COLUMNS.EXECUTED_AT,
    HRD.WORKFLOW_COLUMNS.LAST_RESULT
  ].forEach(function(header) {
    if (currentHeaders.indexOf(header) === -1) {
      currentHeaders.push(header);
    }
  });

  if (currentHeaders.length !== headers.length && sheet.getRange) {
    sheet.getRange(1, 1, 1, currentHeaders.length).setValues([currentHeaders]);
  }

  applyWorkflowActionValidation_(sheet, currentHeaders);
}

/**
 * Ensures workflow columns exist on source tabs that support HR actions.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @returns {void}
 */
function ensureWorkflowColumnsForSourceTabs_(spreadsheet) {
  [
    HRD.TABS.INDIA_EMPLOYEES,
    HRD.TABS.US_EMPLOYEES,
    HRD.TABS.RISK_REPORT
  ].forEach(function(tabName) {
    var sheet = ensureSheet_(spreadsheet, tabName);
    var headers = (getSheetValues_(sheet)[0] || []).map(function(header) {
      return String(header || "");
    });
    ensureWorkflowColumnsForSheet_(sheet, headers);
  });
}

/**
 * Applies workflow action dropdown validation when supported.
 *
 * @param {Object} sheet Sheet object.
 * @param {string[]} headers Header row.
 * @returns {void}
 */
function applyWorkflowActionValidation_(sheet, headers) {
  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.newDataValidation || !sheet.getRange) {
    return;
  }

  var actionIndex = headers.indexOf(HRD.WORKFLOW_COLUMNS.ACTION);
  if (actionIndex === -1) {
    return;
  }

  try {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList([""].concat(getWorkflowActionNames()), true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, actionIndex + 1, Math.max(sheet.getMaxRows ? sheet.getMaxRows() - 1 : 999, 1), 1)
      .setDataValidation(rule);
  } catch (error) {
    logWarn("Workflow dropdown validation could not be applied: " + getSafeErrorMessage_(error));
  }
}

/**
 * Returns aliases for workflow fields.
 *
 * @returns {Object} Workflow aliases.
 */
function getWorkflowColumnAliases_() {
  return {
    employeeId: ["Emp ID", "Employee ID", "EmpID"],
    name: ["Name", "Employee Name", "Full Name"],
    department: ["Department", "Dept"],
    workflowAction: [HRD.WORKFLOW_COLUMNS.ACTION],
    workflowExecutedAt: [HRD.WORKFLOW_COLUMNS.EXECUTED_AT],
    workflowLastResult: [HRD.WORKFLOW_COLUMNS.LAST_RESULT]
  };
}

/**
 * Detects duplicate workflow execution.
 *
 * @param {Array} row Source row.
 * @param {Object} headerMap Header map.
 * @param {string} action Workflow action.
 * @returns {boolean} True when duplicate.
 */
function isWorkflowDuplicate_(row, headerMap, action) {
  var executedAt = readMappedValue_(row, headerMap, "workflowExecutedAt");
  var existingAction = readMappedValue_(row, headerMap, "workflowAction");

  return Boolean(executedAt) && String(existingAction || "").trim() === action;
}

/**
 * Builds workflow email payload.
 *
 * @param {Array} row Source row.
 * @param {Object} headerMap Header map.
 * @param {string} action Workflow action.
 * @param {Object} config Runtime configuration.
 * @returns {Object} Workflow email payload.
 */
function buildWorkflowEmailPayload_(row, headerMap, action, config) {
  return {
    to: config.HR_ALERT_EMAIL,
    employeeId: readMappedValue_(row, headerMap, "employeeId"),
    name: readMappedValue_(row, headerMap, "name"),
    department: readMappedValue_(row, headerMap, "department"),
    action: action
  };
}

/**
 * Sends workflow notification email.
 *
 * @param {Object} payload Workflow email payload.
 * @returns {Object} Send result.
 */
function sendWorkflowEmail_(payload) {
  if (typeof MailApp === "undefined" || !MailApp.sendEmail) {
    return { sent: false, reason: "MailApp unavailable" };
  }

  try {
    MailApp.sendEmail({
      to: payload.to,
      subject: "HRD Workflow Action - " + payload.action,
      body: [
        "Workflow action executed.",
        "Action: " + payload.action,
        "Employee ID: " + payload.employeeId,
        "Name: " + payload.name,
        "Department: " + payload.department
      ].join("\n")
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: getSafeErrorMessage_(error) };
  }
}
