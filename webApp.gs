var AUTH_ALLOWED_DOMAIN = "techolution.com";

// TEMPORARY DEVELOPMENT BYPASS.
// IMPORTANT: Set AUTH_DEV_ALLOWLIST_ENABLED to false before final submission
// if strict Techolution-only access is required.
var AUTH_DEV_ALLOWLIST_ENABLED = false;
var AUTH_DEV_ALLOWED_EMAILS = [
  "srmt2k6@gmail.com"
];

/**
 * Serves the HtmlService web application.
 *
 * @param {Object=} event Apps Script GET event.
 * @returns {Object} HtmlService output or local fallback object.
 */
function doGet(event) {
  var access = getDashboardAccess_();
  var payload;

  if (!access.ok) {
    return createPlainAccessDeniedOutput_();
  }

  try {
    payload = buildAuthorizedDashboardPayload_(access);
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

  var template = HtmlService.createTemplateFromFile("index");
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
 * Builds the opaque response returned before HtmlService is created for denied users.
 *
 * @returns {Object|string} ContentService text output in Apps Script or local fallback.
 */
function createPlainAccessDeniedOutput_() {
  if (typeof ContentService !== "undefined" && ContentService.createTextOutput) {
    return ContentService
      .createTextOutput(getPlainAccessDeniedText_())
      .setMimeType(ContentService.MimeType.TEXT);
  }

  return {
    content: getPlainAccessDeniedText_(),
    mimeType: "text/plain"
  };
}

/**
 * Returns the exact opaque text for denied Web App GET requests.
 *
 * @returns {string} Access denied text.
 */
function getPlainAccessDeniedText_() {
  return "access-denied";
}

/**
 * Returns dashboard data for the Web App.
 *
 * @returns {Object} Web App dashboard payload with shape { ok, appName, generatedAt, sections, model, filters, status }.
 */
function getDashboardData() {
  var access = getDashboardAccess_();
  if (!access.ok) {
    return buildAccessDeniedPayload_(access);
  }

  try {
    return buildAuthorizedDashboardPayload_(access);
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
  var denied = assertDashboardAccess_();
  if (denied) {
    return denied;
  }

  try {
    return withWebAppReadOnlyLoggingSuppressed_(function() {
      var config = loadConfig();
      var data = loadAllData(config);

      return getFilteredEmployeesFromData_(data, filters || getDefaultDrillDownFilters());
    });
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
  var denied = assertDashboardAccess_();
  if (denied) {
    return denied;
  }

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
function buildWebAppDashboardPayload_(data, config, userEmail) {
  var model = buildDashboardModel(data, config);
  model.drillDownRows = getFilteredEmployeesFromData_(data, getDefaultDrillDownFilters());

  return {
    ok: true,
    appName: HRD.APP.NAME,
    generatedAt: formatDateForMessage_(new Date()),
    userEmail: userEmail || "",
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
 * Builds the dashboard payload for an already-authorized Web App request.
 *
 * @param {Object} access Access result from getDashboardAccess_().
 * @returns {Object} Dashboard payload.
 */
function buildAuthorizedDashboardPayload_(access) {
  return withWebAppReadOnlyLoggingSuppressed_(function() {
    var config = loadConfig();
    var data = loadAllData(config);

    return buildWebAppDashboardPayload_(data, config, access.userEmail);
  });
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

/**
 * Normalizes an email for access control checks.
 *
 * @param {*} email Email value.
 * @returns {string} Normalized email.
 */
function normalizeEmailForAccess_(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Returns true when an email may access the Web App dashboard.
 *
 * @param {*} email Email value.
 * @returns {boolean} True when allowed.
 */
function isAllowedDashboardEmail_(email) {
  var normalized = normalizeEmailForAccess_(email);
  var domainPattern = AUTH_ALLOWED_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (new RegExp("^[^@\\s]+@" + domainPattern + "$", "i").test(normalized)) {
    return true;
  }

  if (
    AUTH_DEV_ALLOWLIST_ENABLED
    && AUTH_DEV_ALLOWED_EMAILS.indexOf(normalized) !== -1
  ) {
    return true;
  }

  return false;
}

/**
 * Checks the active Apps Script user for dashboard access.
 *
 * @returns {Object} Access result.
 */
function getDashboardAccess_() {
  var email = "";

  try {
    if (typeof Session !== "undefined" && Session.getActiveUser) {
      email = normalizeEmailForAccess_(Session.getActiveUser().getEmail());
    }
  } catch (error) {
    email = "";
  }

  if (!email) {
    return {
      ok: false,
      accessDenied: true,
      userEmail: "",
      message: "Access denied. Google sign-in was detected, but the account email could not be verified. Please open this Web App using a Techolution Google Workspace account."
    };
  }

  if (!isAllowedDashboardEmail_(email)) {
    return {
      ok: false,
      accessDenied: true,
      userEmail: email,
      message: "Access denied. Please sign in using your Techolution Google Workspace account."
    };
  }

  return {
    ok: true,
    accessDenied: false,
    userEmail: email
  };
}

/**
 * Builds a safe access-denied payload for HtmlService clients.
 *
 * @param {Object=} access Access result.
 * @returns {Object} Access-denied payload.
 */
function buildAccessDeniedPayload_(access) {
  return {
    ok: false,
    accessDenied: true,
    generatedAt: new Date().toISOString(),
    userEmail: escapeHtml(access && access.userEmail ? access.userEmail : ""),
    message: escapeHtml(access && access.message ? access.message : "Access denied.")
  };
}

/**
 * Returns an access-denied payload when the active user is not allowed.
 *
 * @returns {Object|null} Access-denied payload or null.
 */
function assertDashboardAccess_() {
  var access = getDashboardAccess_();

  if (!access.ok) {
    return buildAccessDeniedPayload_(access);
  }

  return null;
}
