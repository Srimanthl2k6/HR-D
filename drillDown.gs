/**
 * Renders the DrillDown tab using the supplied filters.
 *
 * @param {DashboardModel|Object} model Shared dashboard model.
 * @param {Object=} filters Filter values keyed by field.
 * @returns {Object} Render summary.
 */
function renderDrillDown(model, filters) {
  return {
    tabName: HRD.TABS.DRILL_DOWN,
    rendered: false,
    filters: filters || getDefaultDrillDownFilters(),
    model: model || buildDashboardModel()
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
