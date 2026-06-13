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
