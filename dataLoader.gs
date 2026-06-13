/**
 * Loads every source tab into normalized records.
 *
 * @param {Object=} config Runtime configuration.
 * @param {Object=} sourceTables Optional test/source table values keyed by tab name.
 * @returns {Object} Normalized source data grouped by domain.
 */
function loadAllData(config, sourceTables) {
  var runtimeConfig = config || loadConfig();
  var context = createLoadContext_(runtimeConfig, sourceTables);
  var employees = loadEmployeeRows_(context);
  var finance = loadFinanceRows_(context);
  var rmData = loadRMRows_(context);
  var financeById = indexByEmployeeId_(finance);
  var rmById = indexByEmployeeId_(rmData);

  employees.forEach(function(employee) {
    var financeRecord = financeById[employee.employeeId];
    var rmRecord = rmById[employee.employeeId];

    if (financeRecord && financeRecord.productivityAverage !== null) {
      employee.productivityAverage = financeRecord.productivityAverage;
    }
    if (rmRecord) {
      employee.rmMonthValue = rmRecord.value;
    }
  });

  return {
    config: runtimeConfig,
    employees: employees,
    risks: loadRiskRows_(context),
    offboarded: loadOffboardRows_(context),
    finance: finance,
    rmData: rmData,
    schemaWarnings: context.schemaWarnings,
    validationWarnings: context.validationWarnings
  };
}

/**
 * Loads India and US employee source tabs.
 *
 * @param {Object=} config Runtime configuration.
 * @returns {EmployeeRecord[]} Normalized employee records.
 */
function loadEmployeeData(config) {
  return loadAllData(config).employees;
}

/**
 * Loads Risk Report records.
 *
 * @param {Object=} config Runtime configuration.
 * @returns {RiskRecord[]} Normalized risk records.
 */
function loadRiskReportData(config) {
  return loadAllData(config).risks;
}

/**
 * Loads Offboarded Resources records.
 *
 * @param {Object=} config Runtime configuration.
 * @returns {OffboardRecord[]} Normalized offboarded records.
 */
function loadOffboardedResourcesData(config) {
  return loadAllData(config).offboarded;
}

/**
 * Loads Finance-Productivity records.
 *
 * @param {Object=} config Runtime configuration.
 * @returns {FinanceRecord[]} Normalized finance records.
 */
function loadFinanceProductivityData(config) {
  return loadAllData(config).finance;
}

/**
 * Loads RM Data records for the discovered current month.
 *
 * @param {Object=} config Runtime configuration.
 * @returns {RMRecord[]} Normalized RM records.
 */
function loadRMData(config) {
  return loadAllData(config).rmData;
}

/**
 * Creates a placeholder header map. Pass 3 implements alias resolution.
 *
 * @param {string[]} headers Header row values.
 * @param {Object} aliases Canonical field alias mapping.
 * @returns {Object} Header map placeholder.
 */
function buildHeaderMap(headers, aliases) {
  var normalizedHeaders = (headers || []).map(function(header) {
    return normalizeHeaderName_(header);
  });
  var fields = {};
  var warnings = [];

  Object.keys(aliases || {}).forEach(function(field) {
    var fieldAliases = aliases[field] || [];
    var resolvedIndex = -1;

    for (var aliasIndex = 0; aliasIndex < fieldAliases.length; aliasIndex += 1) {
      var normalizedAlias = normalizeHeaderName_(fieldAliases[aliasIndex]);
      var headerIndex = normalizedHeaders.indexOf(normalizedAlias);
      if (headerIndex !== -1) {
        resolvedIndex = headerIndex;
        break;
      }
    }

    if (resolvedIndex === -1) {
      warnings.push("Missing required header for " + field + ". Expected one of: " + fieldAliases.join(", ") + ".");
    } else {
      fields[field] = resolvedIndex;
    }
  });

  return {
    headers: headers || [],
    aliases: aliases || {},
    fields: fields,
    warnings: warnings
  };
}

/**
 * Creates shared state for a loadAllData execution.
 *
 * @param {Object} config Runtime configuration.
 * @param {Object=} sourceTables Optional table values keyed by tab name.
 * @returns {Object} Load context.
 */
function createLoadContext_(config, sourceTables) {
  return {
    config: config,
    sourceTables: sourceTables || null,
    spreadsheet: sourceTables ? null : getActiveSpreadsheet_(),
    schemaWarnings: [],
    validationWarnings: []
  };
}

/**
 * Loads India and US employee records.
 *
 * @param {Object} context Load context.
 * @returns {EmployeeRecord[]} Employee records.
 */
function loadEmployeeRows_(context) {
  return loadEmployeeRowsForTab_(context, HRD.TABS.INDIA_EMPLOYEES, "INDIA_EMPLOYEES", HRD.REGIONS.INDIA)
    .concat(loadEmployeeRowsForTab_(context, HRD.TABS.US_EMPLOYEES, "US_EMPLOYEES", HRD.REGIONS.US));
}

/**
 * Loads employee records for one employee source tab.
 *
 * @param {Object} context Load context.
 * @param {string} tabName Sheet tab name.
 * @param {string} aliasKey Column alias key.
 * @param {string} region Employee region.
 * @returns {EmployeeRecord[]} Employee records.
 */
function loadEmployeeRowsForTab_(context, tabName, aliasKey, region) {
  var table = getSourceTable_(context, tabName);
  var headerMap = getHeaderMapForTable_(context, tabName, table, getColumnAliases(aliasKey));
  var employees = [];

  forEachDataRow_(table, function(row, rowNumber) {
    var employee = {
      employeeId: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "employeeId")),
      name: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "name")),
      region: region,
      department: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "department")),
      designation: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "designation")),
      reportingManager: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "reportingManager")),
      skillset: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "skillset")),
      doj: normalizeDateValue_(readMappedValue_(row, headerMap, "doj")),
      employmentStatus: normalizeEmploymentStatus(readMappedValue_(row, headerMap, "employmentStatus")),
      lwd: normalizeDateValue_(readMappedValue_(row, headerMap, "lwd")),
      allocationPercent: normalizeNumberValue_(readMappedValue_(row, headerMap, "allocationPercent")),
      ctc: normalizeNumberValue_(readMappedValue_(row, headerMap, "ctc")),
      productivityAverage: null,
      rmMonthValue: null
    };

    if (isEmptySourceRow_(row)) {
      return;
    }

    var validation = validateEmployeeRecord(employee, context.config);
    if (!validation.ok) {
      pushValidationWarnings_(context, tabName, rowNumber, validation.errors);
      return;
    }

    employees.push(employee);
  });

  return employees;
}

/**
 * Loads Finance-Productivity records.
 *
 * @param {Object} context Load context.
 * @returns {FinanceRecord[]} Finance records.
 */
function loadFinanceRows_(context) {
  var tabName = HRD.TABS.FINANCE_PRODUCTIVITY;
  var table = getSourceTable_(context, tabName);
  var headerMap = getHeaderMapForTable_(context, tabName, table, getColumnAliases("FINANCE_PRODUCTIVITY"));
  var records = [];

  forEachDataRow_(table, function(row) {
    if (isEmptySourceRow_(row)) {
      return;
    }

    records.push({
      employeeId: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "employeeId")),
      ctcInrAnnual: normalizeNumberValue_(readMappedValue_(row, headerMap, "ctcInrAnnual")),
      ctcInrMonthly: normalizeNumberValue_(readMappedValue_(row, headerMap, "ctcInrMonthly")),
      ctcUsdAnnual: normalizeNumberValue_(readMappedValue_(row, headerMap, "ctcUsdAnnual")),
      ctcUsdMonthly: normalizeNumberValue_(readMappedValue_(row, headerMap, "ctcUsdMonthly")),
      productivityAverage: normalizeNumberValue_(readMappedValue_(row, headerMap, "productivityAverage"))
    });
  });

  return records.filter(function(record) {
    return Boolean(record.employeeId);
  });
}

/**
 * Loads Risk Report records.
 *
 * @param {Object} context Load context.
 * @returns {RiskRecord[]} Risk records.
 */
function loadRiskRows_(context) {
  var tabName = HRD.TABS.RISK_REPORT;
  var table = getSourceTable_(context, tabName);
  var headerMap = getHeaderMapForTable_(context, tabName, table, getColumnAliases("RISK_REPORT"));
  var records = [];

  forEachDataRow_(table, function(row) {
    if (isEmptySourceRow_(row)) {
      return;
    }

    records.push({
      employeeId: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "employeeId")),
      name: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "name")),
      riskCategory: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "riskCategory")),
      riskLevel: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "riskLevel")),
      description: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "description")),
      dateRaised: normalizeDateValue_(readMappedValue_(row, headerMap, "dateRaised")),
      status: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "status"))
    });
  });

  return records.filter(function(record) {
    return Boolean(record.employeeId);
  });
}

/**
 * Loads Offboarded Resources records.
 *
 * @param {Object} context Load context.
 * @returns {OffboardRecord[]} Offboard records.
 */
function loadOffboardRows_(context) {
  var tabName = HRD.TABS.OFFBOARDED_RESOURCES;
  var table = getSourceTable_(context, tabName);
  var headerMap = getHeaderMapForTable_(context, tabName, table, getColumnAliases("OFFBOARDED_RESOURCES"));
  var records = [];

  forEachDataRow_(table, function(row) {
    if (isEmptySourceRow_(row)) {
      return;
    }

    records.push({
      employeeId: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "employeeId")),
      name: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "name")),
      department: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "department")),
      designation: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "designation")),
      lastWorkingDay: normalizeDateValue_(readMappedValue_(row, headerMap, "lastWorkingDay")),
      reason: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "reason")),
      exitQuarter: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "exitQuarter"))
    });
  });

  return records.filter(function(record) {
    return Boolean(record.employeeId);
  });
}

/**
 * Loads RM Data records using the discovered current-month column.
 *
 * @param {Object} context Load context.
 * @returns {RMRecord[]} RM records.
 */
function loadRMRows_(context) {
  var tabName = HRD.TABS.RM_DATA;
  var table = getSourceTable_(context, tabName);
  var headerMap = getHeaderMapForTable_(context, tabName, table, getColumnAliases("RM_DATA"));
  var headers = table.length ? table[0] : [];
  var monthInfo = discoverCurrentMonthColumn_(headers);
  var records = [];

  if (monthInfo.index === -1) {
    context.schemaWarnings.push("RM Data is missing a current-month column.");
    logWarn("RM Data is missing a current-month column.");
    return records;
  }

  forEachDataRow_(table, function(row) {
    if (isEmptySourceRow_(row)) {
      return;
    }

    records.push({
      employeeId: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "employeeId")),
      name: sanitizeForSheetOutput(readMappedValue_(row, headerMap, "name")),
      monthHeader: monthInfo.header,
      value: normalizeNumberValue_(row[monthInfo.index])
    });
  });

  return records.filter(function(record) {
    return Boolean(record.employeeId);
  });
}

/**
 * Gets table values from injected data or the live spreadsheet.
 *
 * @param {Object} context Load context.
 * @param {string} tabName Sheet tab name.
 * @returns {Array[]} Table values.
 */
function getSourceTable_(context, tabName) {
  if (context.sourceTables && context.sourceTables[tabName]) {
    return context.sourceTables[tabName];
  }

  if (!context.spreadsheet) {
    return [];
  }

  var sheet = getSheetByName_(context.spreadsheet, tabName);
  return getSheetValues_(sheet);
}

/**
 * Builds a header map and records schema warnings.
 *
 * @param {Object} context Load context.
 * @param {string} tabName Sheet tab name.
 * @param {Array[]} table Source table values.
 * @param {Object} aliases Field aliases.
 * @returns {Object} Header map.
 */
function getHeaderMapForTable_(context, tabName, table, aliases) {
  var headers = table.length ? table[0] : [];
  var headerMap = buildHeaderMap(headers, aliases);

  headerMap.warnings.forEach(function(warning) {
    var message = tabName + ": " + warning;
    context.schemaWarnings.push(message);
    logWarn(message);
  });

  return headerMap;
}

/**
 * Iterates data rows after the header row.
 *
 * @param {Array[]} table Source table values.
 * @param {Function} callback Callback with row and one-based row number.
 * @returns {void}
 */
function forEachDataRow_(table, callback) {
  for (var rowIndex = 1; rowIndex < (table || []).length; rowIndex += 1) {
    callback(table[rowIndex], rowIndex + 1);
  }
}

/**
 * Reads a value through a resolved header map.
 *
 * @param {Array} row Source row.
 * @param {Object} headerMap Header map.
 * @param {string} field Canonical field name.
 * @returns {*} Cell value.
 */
function readMappedValue_(row, headerMap, field) {
  if (!headerMap || !headerMap.fields || !Object.prototype.hasOwnProperty.call(headerMap.fields, field)) {
    return "";
  }

  return row[headerMap.fields[field]];
}

/**
 * Normalizes a header for alias comparison.
 *
 * @param {*} header Raw header.
 * @returns {string} Normalized header text.
 */
function normalizeHeaderName_(header) {
  return String(header || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Returns true when a source row has no meaningful values.
 *
 * @param {Array} row Source row.
 * @returns {boolean} True for empty rows.
 */
function isEmptySourceRow_(row) {
  return !(row || []).some(function(value) {
    return String(value == null ? "" : value).trim() !== "";
  });
}

/**
 * Pushes validation warnings with row context.
 *
 * @param {Object} context Load context.
 * @param {string} tabName Sheet tab name.
 * @param {number} rowNumber One-based row number.
 * @param {string[]} errors Validation errors.
 * @returns {void}
 */
function pushValidationWarnings_(context, tabName, rowNumber, errors) {
  (errors || []).forEach(function(error) {
    var message = tabName + " row " + rowNumber + ": " + error;
    context.validationWarnings.push(message);
    logWarn(message);
  });
}

/**
 * Normalizes a date-like value to Date or null.
 *
 * @param {*} value Raw value.
 * @returns {Date|null} Date value or null.
 */
function normalizeDateValue_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  if (value == null || value === "") {
    return null;
  }

  var parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/**
 * Normalizes a numeric value to number or null.
 *
 * @param {*} value Raw value.
 * @returns {number|null} Numeric value or null.
 */
function normalizeNumberValue_(value) {
  if (value == null || value === "") {
    return null;
  }

  var numberValue = Number(String(value).replace(/%$/, ""));
  return isFinite(numberValue) ? numberValue : null;
}

/**
 * Discovers the current-month column in RM Data.
 *
 * @param {Array} headers Header row.
 * @returns {Object} Column discovery result.
 */
function discoverCurrentMonthColumn_(headers) {
  var current = new Date();
  var currentYear = current.getFullYear();
  var currentMonth = current.getMonth();
  var best = { index: -1, header: "" };

  for (var index = 0; index < (headers || []).length; index += 1) {
    var header = headers[index];
    if (isCurrentMonthHeader_(header, currentYear, currentMonth)) {
      best = { index: index, header: String(header) };
      break;
    }
  }

  return best;
}

/**
 * Returns true when a header appears to represent the current month.
 *
 * @param {*} header Raw header.
 * @param {number} currentYear Current year.
 * @param {number} currentMonth Zero-based current month.
 * @returns {boolean} True when the header is current-month-like.
 */
function isCurrentMonthHeader_(header, currentYear, currentMonth) {
  var text = String(header || "").trim();
  var normalized = normalizeHeaderName_(text);

  if (normalized === "current month") {
    return true;
  }

  if (header instanceof Date && !isNaN(header.getTime())) {
    return header.getFullYear() === currentYear && header.getMonth() === currentMonth;
  }

  var parsed = new Date(text);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() === currentYear && parsed.getMonth() === currentMonth) {
    return true;
  }

  var monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ];
  var shortMonthNames = monthNames.map(function(month) {
    return month.slice(0, 3);
  });
  var currentNames = [monthNames[currentMonth], shortMonthNames[currentMonth]];
  var yearText = String(currentYear);

  return currentNames.some(function(monthName) {
    return normalized.indexOf(monthName) !== -1 && normalized.indexOf(yearText) !== -1;
  });
}

/**
 * Indexes records by employee ID.
 *
 * @param {Object[]} records Records with employeeId.
 * @returns {Object} Records keyed by employee ID.
 */
function indexByEmployeeId_(records) {
  return (records || []).reduce(function(index, record) {
    if (record.employeeId) {
      index[record.employeeId] = record;
    }
    return index;
  }, {});
}
