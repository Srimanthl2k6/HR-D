/**
 * Loads every source tab into normalized records. Pass 3 implements workbook reads.
 *
 * @param {Object=} config Runtime configuration.
 * @returns {Object} Normalized source data grouped by domain.
 */
function loadAllData(config) {
  return {
    config: config || getDefaultConfigValues(),
    employees: [],
    risks: [],
    offboarded: [],
    finance: [],
    rmData: [],
    schemaWarnings: [],
    validationWarnings: []
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
  return {
    headers: headers || [],
    aliases: aliases || {},
    fields: {},
    warnings: []
  };
}
