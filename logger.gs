/**
 * Appends a log entry to the Logs tab when SpreadsheetApp is available.
 *
 * @param {string} level One of HRD.LOG_LEVELS.
 * @param {string} message Human-readable log message.
 * @param {string=} userEmail Optional user email when Apps Script can identify it.
 * @returns {Object} Log entry metadata.
 */
function appendLog(level, message, userEmail) {
  var timestamp = getCurrentTimestamp_();
  var entry = {
    timestamp: timestamp,
    user: userEmail || getActiveUserEmail_(),
    level: normalizeLogLevel_(level),
    message: toHumanMessage_(message)
  };

  var spreadsheet = getActiveSpreadsheet_();
  if (spreadsheet) {
    var sheet = ensureSheet_(spreadsheet, HRD.TABS.LOGS);
    ensureHeaderRow_(sheet, HRD.SHEET_HEADERS.LOGS);
    appendSheetRow_(sheet, [entry.timestamp, entry.user, entry.level, entry.message]);
    return entry;
  }

  if (typeof console !== "undefined" && console.log) {
    console.log("[" + entry.level + "] " + entry.message);
  }

  return entry;
}

/**
 * Logs an informational message.
 *
 * @param {string} message Human-readable message.
 * @param {string=} userEmail Optional user email.
 * @returns {Object} Log entry metadata.
 */
function logInfo(message, userEmail) {
  return appendLog(HRD.LOG_LEVELS.INFO, message, userEmail);
}

/**
 * Logs a warning message.
 *
 * @param {string} message Human-readable warning.
 * @param {string=} userEmail Optional user email.
 * @returns {Object} Log entry metadata.
 */
function logWarn(message, userEmail) {
  return appendLog(HRD.LOG_LEVELS.WARN, message, userEmail);
}

/**
 * Logs an error message.
 *
 * @param {string} message Human-readable error.
 * @param {string=} userEmail Optional user email.
 * @returns {Object} Log entry metadata.
 */
function logError(message, userEmail) {
  return appendLog(HRD.LOG_LEVELS.ERROR, message, userEmail);
}

/**
 * Appends a changelog summary to the Changelog tab when available.
 *
 * @param {PipelineResult|Object} result Pipeline summary.
 * @returns {Object} Changelog entry metadata.
 */
function appendChangelog(result) {
  var model = result && result.model ? result.model : null;
  var headcount = model && model.kpis ? model.kpis.totalHeadcount || 0 : 0;
  var lwdCount = model && model.lwdAlerts ? model.lwdAlerts.length : 0;
  var probationCount = model && model.probationAlerts ? model.probationAlerts.length : 0;
  var attritionRate = model && model.attrition ? model.attrition.rate || 0 : 0;
  var entry = {
    runId: result && result.runId ? result.runId : "",
    timestamp: getCurrentTimestamp_(),
    triggerSource: result && result.triggerSource ? result.triggerSource : HRD.TRIGGER_SOURCES.MANUAL,
    durationMs: result && typeof result.durationMs === "number" ? result.durationMs : 0,
    headcount: headcount,
    alertCount: lwdCount + probationCount,
    attritionRate: attritionRate
  };

  var spreadsheet = getActiveSpreadsheet_();
  if (spreadsheet) {
    var sheet = ensureSheet_(spreadsheet, HRD.TABS.CHANGELOG);
    ensureHeaderRow_(sheet, HRD.SHEET_HEADERS.CHANGELOG);
    appendSheetRow_(sheet, [
      entry.runId,
      entry.timestamp,
      entry.triggerSource,
      entry.durationMs,
      entry.headcount,
      entry.alertCount,
      entry.attritionRate
    ]);
    return entry;
  }

  if (typeof console !== "undefined" && console.log) {
    console.log("[CHANGELOG] " + JSON.stringify(entry));
  }

  return entry;
}

/**
 * Normalizes a log level.
 *
 * @param {string} level Candidate log level.
 * @returns {string} Known log level.
 */
function normalizeLogLevel_(level) {
  var value = String(level || "").toUpperCase();

  if (value === HRD.LOG_LEVELS.WARN || value === HRD.LOG_LEVELS.ERROR) {
    return value;
  }

  return HRD.LOG_LEVELS.INFO;
}

/**
 * Converts a message value into a plain-English log message.
 *
 * @param {*} message Raw message.
 * @returns {string} Safe message text.
 */
function toHumanMessage_(message) {
  if (message == null || message === "") {
    return "No details were provided.";
  }

  if (typeof message === "string") {
    return message;
  }

  if (message.message) {
    return String(message.message);
  }

  return JSON.stringify(message);
}

/**
 * Returns the current user email when Apps Script exposes it.
 *
 * @returns {string} User email or blank string.
 */
function getActiveUserEmail_() {
  try {
    if (typeof Session !== "undefined" && Session.getActiveUser) {
      return Session.getActiveUser().getEmail() || "";
    }
  } catch (error) {
    return "";
  }

  return "";
}

/**
 * Returns a current timestamp value.
 *
 * @returns {Date|string} Date in Apps Script, ISO text in local fallback.
 */
function getCurrentTimestamp_() {
  if (typeof Date !== "undefined") {
    return new Date();
  }

  return "";
}
