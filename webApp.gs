/**
 * Serves the HtmlService web application.
 *
 * SEC-OS-03 NOTE: Unauthenticated requests never reach this function - they are
 * rejected by Google's infrastructure before Apps Script executes, because this
 * app is deployed with "access": "DOMAIN". Authentication failure logging is
 * therefore handled by Google Workspace Admin audit logs, not application code.
 * See: https://workspace.google.com/audit-logs
 *
 * @param {Object=} event Apps Script GET event.
 * @returns {Object} HtmlService output or local fallback object.
 */
function doGet(event) {
  var payload;
  try {
    payload = getDashboardData();
  } catch (error) {
    payload = buildWebAppErrorPayload_(error);
  }

  if (typeof HtmlService === "undefined") {
    return {
      title: HRD.APP.NAME,
      event: event || null,
      payload: payload,
      message: "HtmlService is available only inside Apps Script."
    };
  }

  var template = HtmlService.createTemplateFromFile("Index");
  template.initialPayload = toSafeJsonForScript_(payload);

  return template
    .evaluate()
    .setTitle(HRD.APP.NAME);
}

/**
 * Includes an HTML partial in an HtmlService template.
 *
 * @param {string} filename HtmlService file name.
 * @returns {string} Partial content.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Returns dashboard data for the Web App.
 *
 * @returns {Object} Web App dashboard payload with shape { ok, appName, generatedAt, sections, model, filters, status }.
 */
function getDashboardData() {
  try {
    var config = loadConfig();
    var data = loadAllData(config);

    return buildWebAppDashboardPayload_(data, config);
  } catch (error) {
    return buildWebAppErrorPayload_(error);
  }
}

/**
 * Returns filtered employee rows for the Web App drill-down view.
 *
 * @param {Object=} filters Filter values.
 * @returns {EmployeeRecord[]} Filtered employee rows.
 */
function getFilteredEmployees(filters) {
  try {
    var config = loadConfig();
    var data = loadAllData(config);

    return getFilteredEmployeesFromData_(data, filters || getDefaultDrillDownFilters());
  } catch (error) {
    return buildWebAppErrorPayload_(error);
  }
}

/**
 * Returns the last known pipeline status for the Web App.
 *
 * @returns {Object} Pipeline status summary.
 */
function getLastPipelineStatus() {
  try {
    var spreadsheet = getActiveSpreadsheet_();
    if (!spreadsheet) {
      return buildPipelineStatusPayload_(null);
    }

    var sheet = getSheetByName_(spreadsheet, HRD.TABS.CHANGELOG);
    var values = getSheetValues_(sheet);
    if (values.length <= 1) {
      return buildPipelineStatusPayload_(null);
    }

    var row = values[values.length - 1];
    return buildPipelineStatusPayload_({
      ok: true,
      runId: row[0],
      timestamp: row[1],
      triggerSource: row[2],
      durationMs: row[3],
      warnings: [],
      errors: []
    });
  } catch (error) {
    return buildWebAppErrorPayload_(error);
  }
}

/**
 * Builds the sanitized Web App dashboard payload.
 *
 * @param {Object} data Normalized source data.
 * @param {Object} config Runtime configuration.
 * @returns {Object} Web App payload.
 */
function buildWebAppDashboardPayload_(data, config) {
  var model = buildDashboardModel(data, config);
  model.drillDownRows = getFilteredEmployeesFromData_(data, getDefaultDrillDownFilters());

  return {
    ok: true,
    appName: HRD.APP.NAME,
    generatedAt: formatDateForMessage_(new Date()),
    sections: [
      "KPIs",
      "Alerts",
      "Department Breakdown",
      "Quarterly Attrition",
      "Risk Register",
      "Org Chart",
      "HR Health Score",
      "Drill-Down"
    ],
    model: escapeForWebValue_(model),
    filters: getDefaultDrillDownFilters(),
    status: buildPipelineStatusPayload_(null)
  };
}

/**
 * Returns sanitized, public employee rows for Web App drill-down.
 *
 * @param {Object} data Normalized source data.
 * @param {Object=} filters Filter values.
 * @returns {Object[]} Public employee rows.
 */
function getFilteredEmployeesFromData_(data, filters) {
  return filterEmployeesForDrillDown(data.employees || [], filters || getDefaultDrillDownFilters())
    .map(sanitizeEmployeeForWeb_);
}

/**
 * Returns a public employee row safe for Web App rendering.
 *
 * @param {EmployeeRecord|Object} employee Employee record.
 * @returns {Object} Public employee row.
 */
function sanitizeEmployeeForWeb_(employee) {
  return escapeForWebValue_({
    employeeId: employee.employeeId,
    name: employee.name,
    region: employee.region,
    department: employee.department,
    designation: employee.designation,
    reportingManager: employee.reportingManager,
    skillset: employee.skillset,
    doj: employee.doj,
    employmentStatus: employee.employmentStatus,
    lwd: employee.lwd,
    productivityAverage: employee.productivityAverage,
    rmMonthValue: employee.rmMonthValue
  });
}

/**
 * Escapes strings recursively before returning data to HtmlService clients.
 *
 * @param {*} value Raw value.
 * @returns {*} Escaped value.
 */
function escapeForWebValue_(value) {
  if (value instanceof Date) {
    return formatDateForMessage_(value);
  }

  if (Array.isArray(value)) {
    return value.map(escapeForWebValue_);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce(function(result, key) {
      result[key] = escapeForWebValue_(value[key]);
      return result;
    }, {});
  }

  if (typeof value === "string") {
    return escapeHtml(value);
  }

  return value == null ? "" : value;
}

/**
 * Serializes JSON safely for inline script assignment.
 *
 * @param {*} value Value to serialize.
 * @returns {string} Safe JSON string.
 */
function toSafeJsonForScript_(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Builds a human-readable pipeline status payload.
 *
 * @param {PipelineResult|Object|null} result Pipeline result or changelog-derived object.
 * @returns {Object} Status payload.
 */
function buildPipelineStatusPayload_(result) {
  if (!result) {
    return {
      ok: true,
      runId: "",
      triggerSource: "",
      durationMs: 0,
      warnings: [],
      errors: [],
      message: "No pipeline run has been recorded yet."
    };
  }

  return {
    ok: Boolean(result.ok),
    runId: result.runId || "",
    timestamp: result.timestamp || "",
    triggerSource: result.triggerSource || "",
    durationMs: Number(result.durationMs) || 0,
    warnings: result.warnings || [],
    errors: result.errors || [],
    message: result.ok
      ? "Pipeline completed successfully."
      : "Pipeline completed with errors."
  };
}

/**
 * Builds a user-safe error payload.
 *
 * @param {*} error Error value.
 * @returns {Object} Error payload.
 */
function buildWebAppErrorPayload_(error) {
  return {
    ok: false,
    message: escapeHtml(getSafeErrorMessage_(error))
  };
}
