/**
 * Validates a normalized employee record. Pass 3 adds complete field checks.
 *
 * @param {EmployeeRecord|Object} employee Candidate employee record.
 * @param {Object=} config Runtime configuration.
 * @returns {Object} Validation result with ok and errors fields.
 */
function validateEmployeeRecord(employee, config) {
  return {
    ok: Boolean(employee),
    errors: employee ? [] : ["Employee record is empty."],
    config: config || {}
  };
}

/**
 * Normalizes an employment status value into the canonical status names.
 *
 * @param {string} value Raw status value from a source tab.
 * @returns {string} Canonical status value or the original trimmed value.
 */
function normalizeEmploymentStatus(value) {
  var raw = String(value || "").trim();
  var key = raw.toLowerCase();

  if (key === "confirmed") {
    return HRD.EMPLOYMENT_STATUSES.CONFIRMED;
  }

  if (key === "under probation" || key === "probation" || key === "probationer") {
    return HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION;
  }

  if (key === "intern") {
    return HRD.EMPLOYMENT_STATUSES.INTERN;
  }

  return raw;
}

/**
 * Prevents formula injection when writing text back into Sheets.
 *
 * @param {*} value Raw value.
 * @returns {*} Sanitized value.
 */
function sanitizeForSheetOutput(value) {
  if (typeof value !== "string") {
    return value;
  }

  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

/**
 * Escapes text before inserting Sheet-provided values into HtmlService output.
 *
 * @param {*} value Raw value.
 * @returns {string} HTML-escaped text.
 */
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
