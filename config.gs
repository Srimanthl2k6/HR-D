/**
 * @typedef {Object} EmployeeRecord
 * @property {string} employeeId
 * @property {string} name
 * @property {string} region
 * @property {string} department
 * @property {string} designation
 * @property {string} reportingManager
 * @property {string} skillset
 * @property {Date|null} doj
 * @property {string} employmentStatus
 * @property {Date|null} lwd
 * @property {number|null} allocationPercent
 * @property {number|null} ctc
 * @property {number|null} productivityAverage
 * @property {number|null} rmMonthValue
 */

/**
 * @typedef {Object} RiskRecord
 * @property {string} employeeId
 * @property {string} name
 * @property {string} riskCategory
 * @property {string} riskLevel
 * @property {string} description
 * @property {Date|null} dateRaised
 * @property {string} status
 */

/**
 * @typedef {Object} OffboardRecord
 * @property {string} employeeId
 * @property {string} name
 * @property {string} department
 * @property {string} designation
 * @property {Date|null} lastWorkingDay
 * @property {string} reason
 * @property {string} exitQuarter
 */

/**
 * @typedef {Object} FinanceRecord
 * @property {string} employeeId
 * @property {number|null} ctcInrAnnual
 * @property {number|null} ctcInrMonthly
 * @property {number|null} ctcUsdAnnual
 * @property {number|null} ctcUsdMonthly
 * @property {number|null} productivityAverage
 */

/**
 * @typedef {Object} RMRecord
 * @property {string} employeeId
 * @property {string} name
 * @property {string} monthHeader
 * @property {number|null} value
 */

/**
 * @typedef {Object} AlertRecord
 * @property {string} type
 * @property {string} employeeId
 * @property {string} name
 * @property {string} department
 * @property {Date|null} relevantDate
 * @property {string} severity
 * @property {string} message
 */

/**
 * @typedef {Object} DashboardModel
 * @property {Object} kpis
 * @property {AlertRecord[]} lwdAlerts
 * @property {AlertRecord[]} probationAlerts
 * @property {Object[]} departmentBreakdown
 * @property {Object} attrition
 * @property {Object} riskSummary
 * @property {Object} orgChart
 * @property {Object[]} drillDownRows
 * @property {Object} healthScore
 */

/**
 * @typedef {Object} PipelineResult
 * @property {string} runId
 * @property {string} triggerSource
 * @property {number} durationMs
 * @property {boolean} ok
 * @property {string[]} warnings
 * @property {string[]} errors
 * @property {DashboardModel|null} model
 */

var HRD = {
  APP: Object.freeze({
    NAME: "Techolution HR Automation Dashboard",
    VERSION: "0.1.0"
  }),
  TABS: Object.freeze({
    INDIA_EMPLOYEES: "India Employee Database",
    US_EMPLOYEES: "US Employee Database",
    RM_DATA: "RM Data",
    FINANCE_PRODUCTIVITY: "Finance-Productivity",
    RISK_REPORT: "Risk Report",
    OFFBOARDED_RESOURCES: "Offboarded Resources",
    CONFIG: "_Config",
    DASHBOARD: "Dashboard",
    ORG_CHART: "OrgChart",
    DRILL_DOWN: "DrillDown",
    LOGS: "Logs",
    CHANGELOG: "Changelog"
  }),
  CONFIG_KEYS: Object.freeze({
    LWD_ALERT_DAYS: "LWD_ALERT_DAYS",
    PROBATION_ALERT_DAYS: "PROBATION_ALERT_DAYS",
    PROBATION_DURATION_DAYS: "PROBATION_DURATION_DAYS",
    PRODUCTIVITY_TARGET: "PRODUCTIVITY_TARGET",
    HR_ALERT_EMAIL: "HR_ALERT_EMAIL",
    ADMIN_ALERT_EMAIL: "ADMIN_ALERT_EMAIL",
    PIPELINE_TRIGGER_HOUR: "PIPELINE_TRIGGER_HOUR",
    LOG_RETENTION_DAYS: "LOG_RETENTION_DAYS",
    EMP_ID_PATTERN: "EMP_ID_PATTERN"
  }),
  DEFAULT_CONFIG: Object.freeze({
    LWD_ALERT_DAYS: 45,
    PROBATION_ALERT_DAYS: 30,
    PROBATION_DURATION_DAYS: 180,
    PRODUCTIVITY_TARGET: 80,
    HR_ALERT_EMAIL: "hr@techolution.com",
    ADMIN_ALERT_EMAIL: "admin@techolution.com",
    PIPELINE_TRIGGER_HOUR: 8,
    LOG_RETENTION_DAYS: 90,
    EMP_ID_PATTERN: "^[A-Za-z0-9_-]+$"
  }),
  CONFIG_DESCRIPTIONS: Object.freeze({
    LWD_ALERT_DAYS: "Days before or after an intern LWD to surface an alert.",
    PROBATION_ALERT_DAYS: "Days before confirmation date to surface a probation alert.",
    PROBATION_DURATION_DAYS: "Total probation period in calendar days.",
    PRODUCTIVITY_TARGET: "Productivity score below which an employee is flagged.",
    HR_ALERT_EMAIL: "Comma-separated HR recipients for active alert digests.",
    ADMIN_ALERT_EMAIL: "Admin recipient for system self-monitoring alerts.",
    PIPELINE_TRIGGER_HOUR: "UTC hour for the daily scheduled pipeline trigger.",
    LOG_RETENTION_DAYS: "Operational retention target for Logs before manual archive.",
    EMP_ID_PATTERN: "Regular expression used to validate employee IDs."
  }),
  CONFIG_VALIDATION: Object.freeze({
    LWD_ALERT_DAYS: Object.freeze({ type: "number", min: 1, max: 180 }),
    PROBATION_ALERT_DAYS: Object.freeze({ type: "number", min: 1, max: 90 }),
    PROBATION_DURATION_DAYS: Object.freeze({ type: "number", min: 60, max: 365 }),
    PRODUCTIVITY_TARGET: Object.freeze({ type: "number", min: 0, max: 100 }),
    HR_ALERT_EMAIL: Object.freeze({ type: "emailList" }),
    ADMIN_ALERT_EMAIL: Object.freeze({ type: "email" }),
    PIPELINE_TRIGGER_HOUR: Object.freeze({ type: "number", min: 0, max: 23 }),
    LOG_RETENTION_DAYS: Object.freeze({ type: "number", min: 1, max: 3650 }),
    EMP_ID_PATTERN: Object.freeze({ type: "regex" })
  }),
  LOG_LEVELS: Object.freeze({
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR"
  }),
  TRIGGER_SOURCES: Object.freeze({
    MANUAL: "manual",
    ON_EDIT: "onEdit",
    ON_CHANGE: "onChange",
    TIME_BASED: "time-based",
    WEB_APP: "web-app",
    TEST: "test"
  }),
  REGIONS: Object.freeze({
    INDIA: "India",
    US: "US",
    ALL: "All"
  }),
  EMPLOYMENT_STATUSES: Object.freeze({
    CONFIRMED: "Confirmed",
    UNDER_PROBATION: "Under Probation",
    INTERN: "Intern"
  }),
  WORKFLOW_ACTIONS: Object.freeze({
    START_OFFBOARDING: "Start Offboarding",
    SCHEDULE_PIP: "Schedule PIP",
    APPROVE_CONFIRMATION: "Approve Confirmation"
  }),
  WORKFLOW_COLUMNS: Object.freeze({
    ACTION: "Workflow Action",
    EXECUTED_AT: "Workflow Executed At",
    LAST_RESULT: "Workflow Last Result"
  }),
  SHEET_HEADERS: Object.freeze({
    LOGS: Object.freeze(["Timestamp", "User", "Level", "Message"]),
    CHANGELOG: Object.freeze([
      "Run ID",
      "Timestamp",
      "Trigger Source",
      "Duration (ms)",
      "Headcount",
      "Alert Count",
      "Attrition Rate"
    ]),
    CONFIG: Object.freeze(["Config Key", "Value", "Description"])
  }),
  SOURCE_HEADERS: Object.freeze({
    INDIA_EMPLOYEES: Object.freeze([
      "Emp ID",
      "Name",
      "Department",
      "Designation",
      "Reporting Manager",
      "Skillset",
      "Date of Joining (DOJ)",
      "Employment Status",
      "Last Working Day (LWD for interns)",
      "Workflow Action",
      "Workflow Executed At",
      "Workflow Last Result"
    ]),
    US_EMPLOYEES: Object.freeze([
      "Emp ID",
      "Name",
      "Department",
      "Designation",
      "Reporting Manager",
      "Skillset",
      "DOJ",
      "Employment Status",
      "Allocation %",
      "CTC",
      "Workflow Action",
      "Workflow Executed At",
      "Workflow Last Result"
    ]),
    RM_DATA: Object.freeze(["Emp ID", "Name"]),
    FINANCE_PRODUCTIVITY: Object.freeze([
      "Emp ID",
      "CTC INR Annual",
      "CTC INR Monthly",
      "CTC USD Annual",
      "CTC USD Monthly",
      "Productivity Average"
    ]),
    RISK_REPORT: Object.freeze([
      "Emp ID",
      "Name",
      "Risk Category",
      "Risk Level",
      "Description",
      "Date Raised",
      "Status",
      "Workflow Action",
      "Workflow Executed At",
      "Workflow Last Result"
    ]),
    OFFBOARDED_RESOURCES: Object.freeze([
      "Emp ID",
      "Name",
      "Department",
      "Designation",
      "Last Working Day",
      "Reason",
      "Exit Quarter"
    ])
  }),
  DRILL_DOWN: Object.freeze({
    FILTER_CELLS: Object.freeze({
      REGION: "B2",
      DEPARTMENT: "B3",
      REPORTING_MANAGER: "B4",
      EMPLOYMENT_STATUS: "B5"
    }),
    TABLE_START_CELL: "A8"
  }),
  COLUMN_ALIASES: Object.freeze({
    INDIA_EMPLOYEES: Object.freeze({
      employeeId: Object.freeze(["Emp ID", "Employee ID", "EmpID"]),
      name: Object.freeze(["Name", "Employee Name", "Full Name"]),
      department: Object.freeze(["Department", "Dept"]),
      designation: Object.freeze(["Designation", "Title", "Role"]),
      reportingManager: Object.freeze(["Reporting Manager", "Manager", "RM"]),
      skillset: Object.freeze(["Skillset", "Skills", "Skill Set"]),
      doj: Object.freeze(["Date of Joining (DOJ)", "DOJ", "Date of Joining"]),
      employmentStatus: Object.freeze(["Employment Status", "Status"]),
      lwd: Object.freeze(["Last Working Day (LWD for interns)", "LWD", "Last Working Day"])
    }),
    US_EMPLOYEES: Object.freeze({
      employeeId: Object.freeze(["Emp ID", "Employee ID", "EmpID"]),
      name: Object.freeze(["Name", "Employee Name", "Full Name"]),
      department: Object.freeze(["Department", "Dept"]),
      designation: Object.freeze(["Designation", "Title", "Role"]),
      reportingManager: Object.freeze(["Reporting Manager", "Manager", "RM"]),
      skillset: Object.freeze(["Skillset", "Skills", "Skill Set"]),
      doj: Object.freeze(["DOJ", "Date of Joining", "Date of Joining (DOJ)"]),
      employmentStatus: Object.freeze(["Employment Status", "Status"]),
      allocationPercent: Object.freeze(["Allocation %", "Allocation", "Allocation Percent"]),
      ctc: Object.freeze(["CTC", "Compensation", "Annual CTC"])
    }),
    RM_DATA: Object.freeze({
      employeeId: Object.freeze(["Emp ID", "Employee ID", "EmpID"]),
      name: Object.freeze(["Name", "Employee Name", "Full Name"])
    }),
    FINANCE_PRODUCTIVITY: Object.freeze({
      employeeId: Object.freeze(["Emp ID", "Employee ID", "EmpID"]),
      ctcInrAnnual: Object.freeze(["CTC INR Annual", "Annual CTC INR"]),
      ctcInrMonthly: Object.freeze(["CTC INR Monthly", "Monthly CTC INR"]),
      ctcUsdAnnual: Object.freeze(["CTC USD Annual", "Annual CTC USD"]),
      ctcUsdMonthly: Object.freeze(["CTC USD Monthly", "Monthly CTC USD"]),
      productivityAverage: Object.freeze(["Productivity Average", "Productivity Avg", "Average Productivity"])
    }),
    RISK_REPORT: Object.freeze({
      employeeId: Object.freeze(["Emp ID", "Employee ID", "EmpID"]),
      name: Object.freeze(["Name", "Employee Name", "Full Name"]),
      riskCategory: Object.freeze(["Risk Category", "Category"]),
      riskLevel: Object.freeze(["Risk Level", "Level", "Severity"]),
      description: Object.freeze(["Description", "Risk Description"]),
      dateRaised: Object.freeze(["Date Raised", "Raised Date"]),
      status: Object.freeze(["Status", "Risk Status"])
    }),
    OFFBOARDED_RESOURCES: Object.freeze({
      employeeId: Object.freeze(["Emp ID", "Employee ID", "EmpID"]),
      name: Object.freeze(["Name", "Employee Name", "Full Name"]),
      department: Object.freeze(["Department", "Dept"]),
      designation: Object.freeze(["Designation", "Title", "Role"]),
      lastWorkingDay: Object.freeze(["Last Working Day", "LWD"]),
      reason: Object.freeze(["Reason", "Exit Reason"]),
      exitQuarter: Object.freeze(["Exit Quarter", "Quarter"])
    })
  })
};

HRD.SOURCE_TABS = Object.freeze([
  HRD.TABS.INDIA_EMPLOYEES,
  HRD.TABS.US_EMPLOYEES,
  HRD.TABS.RM_DATA,
  HRD.TABS.FINANCE_PRODUCTIVITY,
  HRD.TABS.RISK_REPORT,
  HRD.TABS.OFFBOARDED_RESOURCES
]);

HRD.OUTPUT_TABS = Object.freeze([
  HRD.TABS.DASHBOARD,
  HRD.TABS.ORG_CHART,
  HRD.TABS.DRILL_DOWN,
  HRD.TABS.LOGS,
  HRD.TABS.CHANGELOG
]);

Object.freeze(HRD);

/**
 * Returns a copy of the default configuration values.
 *
 * @returns {Object} Default configuration keyed by config name.
 */
function getDefaultConfigValues() {
  return Object.assign({}, HRD.DEFAULT_CONFIG);
}

/**
 * Returns every tab required by the workbook.
 *
 * @returns {string[]} Source, config, and output tab names.
 */
function getRequiredTabs() {
  return HRD.SOURCE_TABS.concat([HRD.TABS.CONFIG], HRD.OUTPUT_TABS);
}

/**
 * Returns the source tab names that HR users can edit.
 *
 * @returns {string[]} Source tab names.
 */
function getSourceTabNames() {
  return HRD.SOURCE_TABS.slice();
}

/**
 * Returns the generated/protected tab names.
 *
 * @returns {string[]} Output tab names.
 */
function getOutputTabNames() {
  return HRD.OUTPUT_TABS.slice();
}

/**
 * Returns the source column aliases for a tab key.
 *
 * @param {string} tabKey Internal source tab key.
 * @returns {Object} Field-to-header alias mapping.
 */
function getColumnAliases(tabKey) {
  return HRD.COLUMN_ALIASES[tabKey] || {};
}

/**
 * Loads runtime configuration from the _Config tab with safe defaults.
 *
 * @returns {Object} Validated runtime configuration.
 */
function loadConfig() {
  var config = getDefaultConfigValues();
  var spreadsheet = getActiveSpreadsheet_();

  if (!spreadsheet) {
    return config;
  }

  var sheet = getSheetByName_(spreadsheet, HRD.TABS.CONFIG);
  if (!sheet) {
    return config;
  }

  var values = getSheetValues_(sheet);
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex] || [];
    var key = String(row[0] || "").trim();

    if (!key || !Object.prototype.hasOwnProperty.call(HRD.DEFAULT_CONFIG, key)) {
      continue;
    }

    var validation = validateConfigValue_(key, row[1]);
    if (validation.ok) {
      config[key] = validation.value;
    } else {
      logWarn("Config value for " + key + " is invalid. Using default value. " + validation.message);
    }
  }

  return config;
}

/**
 * Returns the default _Config rows.
 *
 * @returns {Array[]} Config rows including descriptions.
 */
function getDefaultConfigRows() {
  return Object.keys(HRD.DEFAULT_CONFIG).map(function(key) {
    return [
      key,
      HRD.DEFAULT_CONFIG[key],
      HRD.CONFIG_DESCRIPTIONS[key] || ""
    ];
  });
}

/**
 * Validates and coerces a config value.
 *
 * @param {string} key Config key.
 * @param {*} value Raw value from _Config.
 * @returns {Object} Validation result.
 */
function validateConfigValue_(key, value) {
  var rule = HRD.CONFIG_VALIDATION[key];

  if (!rule) {
    return { ok: true, value: value, message: "" };
  }

  if (rule.type === "number") {
    return validateNumberConfig_(key, value, rule.min, rule.max);
  }

  if (rule.type === "email") {
    return validateEmailConfig_(value);
  }

  if (rule.type === "emailList") {
    return validateEmailListConfig_(value);
  }

  if (rule.type === "regex") {
    return validateRegexConfig_(value);
  }

  return { ok: true, value: value, message: "" };
}

/**
 * Validates numeric config values.
 *
 * @param {string} key Config key.
 * @param {*} value Raw value.
 * @param {number} min Minimum value.
 * @param {number} max Maximum value.
 * @returns {Object} Validation result.
 */
function validateNumberConfig_(key, value, min, max) {
  var numberValue = Number(value);

  if (!isFinite(numberValue) || numberValue < min || numberValue > max) {
    return {
      ok: false,
      value: HRD.DEFAULT_CONFIG[key],
      message: "Expected a number from " + min + " to " + max + "."
    };
  }

  return { ok: true, value: numberValue, message: "" };
}

/**
 * Validates a single email config value.
 *
 * @param {*} value Raw value.
 * @returns {Object} Validation result.
 */
function validateEmailConfig_(value) {
  var email = String(value || "").trim();

  if (!isValidEmail_(email)) {
    return { ok: false, value: "", message: "Expected a valid email address." };
  }

  return { ok: true, value: email, message: "" };
}

/**
 * Validates a comma-separated email list config value.
 *
 * @param {*} value Raw value.
 * @returns {Object} Validation result.
 */
function validateEmailListConfig_(value) {
  var emails = String(value || "").split(",").map(function(email) {
    return email.trim();
  }).filter(Boolean);

  if (!emails.length || emails.some(function(email) { return !isValidEmail_(email); })) {
    return { ok: false, value: "", message: "Expected one or more comma-separated email addresses." };
  }

  return { ok: true, value: emails.join(","), message: "" };
}

/**
 * Validates a regular expression config value.
 *
 * @param {*} value Raw value.
 * @returns {Object} Validation result.
 */
function validateRegexConfig_(value) {
  var pattern = String(value || "").trim();

  try {
    RegExp(pattern);
  } catch (error) {
    return { ok: false, value: "", message: "Expected a valid regular expression." };
  }

  return { ok: true, value: pattern, message: "" };
}

/**
 * Returns true when a value has a basic email shape.
 *
 * @param {string} email Email value.
 * @returns {boolean} True for valid email shape.
 */
function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}
