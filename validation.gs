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

/**
 * Returns the active spreadsheet when running inside Apps Script.
 *
 * @returns {Object|null} Active spreadsheet or null outside Apps Script.
 */
function getActiveSpreadsheet_() {
  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.getActiveSpreadsheet) {
    return null;
  }

  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Gets a sheet by name from a spreadsheet-like object.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @param {string} name Sheet name.
 * @returns {Object|null} Sheet object or null.
 */
function getSheetByName_(spreadsheet, name) {
  if (!spreadsheet || !spreadsheet.getSheetByName) {
    return null;
  }

  return spreadsheet.getSheetByName(name);
}

/**
 * Ensures a sheet exists.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @param {string} name Sheet name.
 * @returns {Object} Sheet object.
 */
function ensureSheet_(spreadsheet, name) {
  var sheet = getSheetByName_(spreadsheet, name);

  if (sheet) {
    return sheet;
  }

  return spreadsheet.insertSheet(name);
}

/**
 * Reads sheet values safely.
 *
 * @param {Object} sheet Sheet object.
 * @returns {Array[]} Sheet values.
 */
function getSheetValues_(sheet) {
  if (!sheet || !sheet.getDataRange) {
    return [];
  }

  var range = sheet.getDataRange();
  if (!range || !range.getValues) {
    return [];
  }

  return range.getValues();
}

/**
 * Ensures the first row of a sheet contains the expected headers.
 *
 * @param {Object} sheet Sheet object.
 * @param {string[]} headers Header labels.
 * @returns {void}
 */
function ensureHeaderRow_(sheet, headers) {
  if (!sheet || !headers || !headers.length || !sheet.getRange) {
    return;
  }

  var firstRowValues = getSheetValues_(sheet)[0] || [];
  var hasAnyHeader = firstRowValues.some(function(value) {
    return String(value || "").trim() !== "";
  });

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeaderRow_(sheet, headers.length);
  }
}

/**
 * Appends a row to a sheet.
 *
 * @param {Object} sheet Sheet object.
 * @param {Array} row Row values.
 * @returns {void}
 */
function appendSheetRow_(sheet, row) {
  if (!sheet || !sheet.appendRow) {
    return;
  }

  sheet.appendRow(row);
}

/**
 * Writes a table to a sheet from the top-left cell.
 *
 * @param {Object} sheet Sheet object.
 * @param {number} row One-based row.
 * @param {number} column One-based column.
 * @param {Array[]} values Table values.
 * @returns {void}
 */
function setSheetTable_(sheet, row, column, values) {
  if (!sheet || !values || !values.length || !values[0].length || !sheet.getRange) {
    return;
  }

  sheet.getRange(row, column, values.length, values[0].length).setValues(values);
}

/**
 * Applies basic header formatting when supported by the sheet object.
 *
 * @param {Object} sheet Sheet object.
 * @param {number} width Header width.
 * @returns {void}
 */
function formatHeaderRow_(sheet, width) {
  try {
    var range = sheet.getRange(1, 1, 1, width);
    if (range.setFontWeight) {
      range.setFontWeight("bold");
    }
    if (range.setBackground) {
      range.setBackground("#e9eef8");
    }
  } catch (error) {
    return;
  }
}

/**
 * Clears and rewrites the first rows of a sheet.
 *
 * @param {Object} sheet Sheet object.
 * @param {Array[]} values Values to write.
 * @returns {void}
 */
function rewriteSheet_(sheet, values) {
  if (!sheet || !values || !values.length) {
    return;
  }

  if (sheet.clear) {
    sheet.clear();
  }

  setSheetTable_(sheet, 1, 1, values);
  formatHeaderRow_(sheet, values[0].length);
}
