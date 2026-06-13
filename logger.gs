/**
 * Appends a log entry. Pass 2 replaces this console fallback with Sheet logging.
 *
 * @param {string} level One of HRD.LOG_LEVELS.
 * @param {string} message Human-readable log message.
 * @param {string=} userEmail Optional user email when Apps Script can identify it.
 * @returns {Object} Log entry metadata.
 */
function appendLog(level, message, userEmail) {
  var entry = {
    timestamp: "",
    user: userEmail || "",
    level: level || HRD.LOG_LEVELS.INFO,
    message: String(message || "")
  };

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
 * Appends a changelog summary. Pass 2 replaces this fallback with Sheet output.
 *
 * @param {PipelineResult|Object} result Pipeline summary.
 * @returns {Object} Changelog entry metadata.
 */
function appendChangelog(result) {
  var entry = {
    runId: result && result.runId ? result.runId : "",
    triggerSource: result && result.triggerSource ? result.triggerSource : HRD.TRIGGER_SOURCES.MANUAL,
    durationMs: result && typeof result.durationMs === "number" ? result.durationMs : 0
  };

  if (typeof console !== "undefined" && console.log) {
    console.log("[CHANGELOG] " + JSON.stringify(entry));
  }

  return entry;
}
