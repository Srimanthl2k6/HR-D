/**
 * Renders the DrillDown tab using the supplied filters.
 *
 * @param {DashboardModel|Object} model Shared dashboard model.
 * @param {Object=} filters Filter values keyed by field.
 * @returns {Object} Render summary.
 */
function renderDrillDown(model, filters) {
  var dashboardModel = model || buildDashboardModel();
  var activeFilters = filters || readDrillDownFilters_() || getDefaultDrillDownFilters();
  var rows = buildDrillDownRows_(dashboardModel, activeFilters);
  var spreadsheet = getActiveSpreadsheet_();

  if (spreadsheet) {
    var sheet = ensureSheet_(spreadsheet, HRD.TABS.DRILL_DOWN);
    rewriteSheet_(sheet, rows);
    applyDrillDownValidation_(sheet, dashboardModel);
    sheet.autoResizeColumns && sheet.autoResizeColumns(1, rows[0].length);
  }

  return {
    tabName: HRD.TABS.DRILL_DOWN,
    rendered: Boolean(spreadsheet),
    filters: activeFilters,
    rows: rows,
    model: dashboardModel
  };
}

/**
 * Returns the default drill-down filter values.
 *
 * @returns {Object} Default filters.
 */
function getDefaultDrillDownFilters() {
  return {
    region: HRD.REGIONS.ALL,
    department: "All",
    reportingManager: "All",
    employmentStatus: "All"
  };
}

/**
 * Applies drill-down filters to employee records.
 *
 * @param {EmployeeRecord[]} employees Normalized employee records.
 * @param {Object=} filters Filter values.
 * @returns {EmployeeRecord[]} Filtered employee records.
 */
function filterEmployeesForDrillDown(employees, filters) {
  var activeFilters = filters || getDefaultDrillDownFilters();

  return (employees || []).filter(function(employee) {
    var regionOk = activeFilters.region === "All" || employee.region === activeFilters.region;
    var departmentOk = activeFilters.department === "All" || employee.department === activeFilters.department;
    var managerOk = activeFilters.reportingManager === "All" || employee.reportingManager === activeFilters.reportingManager;
    var statusOk = activeFilters.employmentStatus === "All" || employee.employmentStatus === activeFilters.employmentStatus;

    return regionOk && departmentOk && managerOk && statusOk;
  });
}

/**
 * Builds DrillDown tab rows with filter controls and filtered employees.
 *
 * @param {DashboardModel|Object} model Dashboard model.
 * @param {Object=} filters Active filters.
 * @returns {Array[]} DrillDown rows.
 */
function buildDrillDownRows_(model, filters) {
  var activeFilters = filters || getDefaultDrillDownFilters();
  var employees = filterEmployeesForDrillDown(model.drillDownRows || [], activeFilters);
  var rows = [
    ["Drill-Down Filters", ""],
    ["Region", activeFilters.region || HRD.REGIONS.ALL],
    ["Department", activeFilters.department || "All"],
    ["Reporting Manager", activeFilters.reportingManager || "All"],
    ["Employment Status", activeFilters.employmentStatus || "All"],
    ["", ""],
    ["Emp ID", "Name", "Region", "Department", "Reporting Manager", "Employment Status"]
  ];

  employees.forEach(function(employee) {
    rows.push([
      employee.employeeId,
      employee.name,
      employee.region,
      employee.department,
      employee.reportingManager,
      employee.employmentStatus
    ]);
  });

  if (!employees.length) {
    rows.push(["No matching employees", "", "", "", "", ""]);
  }

  return normalizeTableWidth_(rows, 6);
}

/**
 * Reads DrillDown filter cells from the active spreadsheet.
 *
 * @returns {Object|null} Filter values or null outside Apps Script.
 */
function readDrillDownFilters_() {
  var spreadsheet = getActiveSpreadsheet_();
  if (!spreadsheet) {
    return null;
  }

  var sheet = getSheetByName_(spreadsheet, HRD.TABS.DRILL_DOWN);
  if (!sheet || !sheet.getRange) {
    return getDefaultDrillDownFilters();
  }

  return {
    region: getRangeDisplayValue_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.REGION) || HRD.REGIONS.ALL,
    department: getRangeDisplayValue_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.DEPARTMENT) || "All",
    reportingManager: getRangeDisplayValue_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.REPORTING_MANAGER) || "All",
    employmentStatus: getRangeDisplayValue_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.EMPLOYMENT_STATUS) || "All"
  };
}

/**
 * Reads a display value from a range.
 *
 * @param {Object} sheet Sheet object.
 * @param {string} a1 A1 notation.
 * @returns {string} Display value.
 */
function getRangeDisplayValue_(sheet, a1) {
  var range = sheet.getRange(a1);
  if (range.getDisplayValue) {
    return range.getDisplayValue();
  }
  if (range.getValue) {
    return String(range.getValue() || "");
  }
  return "";
}

/**
 * Applies dropdown validation to DrillDown filter cells when Apps Script supports it.
 *
 * @param {Object} sheet DrillDown sheet.
 * @param {DashboardModel|Object} model Dashboard model.
 * @returns {void}
 */
function applyDrillDownValidation_(sheet, model) {
  if (typeof SpreadsheetApp === "undefined" || !SpreadsheetApp.newDataValidation || !sheet.getRange) {
    return;
  }

  try {
    setDropdown_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.REGION, [HRD.REGIONS.ALL, HRD.REGIONS.INDIA, HRD.REGIONS.US]);
    setDropdown_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.DEPARTMENT, ["All"].concat(uniqueFieldValues_(model.drillDownRows || [], "department")));
    setDropdown_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.REPORTING_MANAGER, ["All"].concat(uniqueFieldValues_(model.drillDownRows || [], "reportingManager")));
    setDropdown_(sheet, HRD.DRILL_DOWN.FILTER_CELLS.EMPLOYMENT_STATUS, [
      "All",
      HRD.EMPLOYMENT_STATUSES.CONFIRMED,
      HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION,
      HRD.EMPLOYMENT_STATUSES.INTERN
    ]);
  } catch (error) {
    logWarn("DrillDown dropdown validation could not be applied: " + getSafeErrorMessage_(error));
  }
}

/**
 * Applies a dropdown list to a cell.
 *
 * @param {Object} sheet Sheet object.
 * @param {string} a1 A1 notation.
 * @param {string[]} values Dropdown values.
 * @returns {void}
 */
function setDropdown_(sheet, a1, values) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(a1).setDataValidation(rule);
}

/**
 * Returns unique non-empty field values.
 *
 * @param {Object[]} records Records.
 * @param {string} field Field name.
 * @returns {string[]} Unique sorted values.
 */
function uniqueFieldValues_(records, field) {
  var seen = {};
  (records || []).forEach(function(record) {
    if (record[field]) {
      seen[record[field]] = true;
    }
  });
  return Object.keys(seen).sort();
}
