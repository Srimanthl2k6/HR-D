/**
 * Renders the OrgChart tab from reporting-manager relationships.
 *
 * @param {DashboardModel|Object} model Shared dashboard model.
 * @returns {Object} Render summary.
 */
function renderOrgChart(model) {
  return {
    tabName: HRD.TABS.ORG_CHART,
    rendered: false,
    model: model || buildDashboardModel()
  };
}

/**
 * Builds manager-to-report relationships from employees.
 *
 * @param {EmployeeRecord[]} employees Normalized employee records.
 * @returns {Object[]} Org chart rows.
 */
function buildOrgChartRows(employees) {
  return (employees || []).map(function(employee) {
    return {
      employeeId: employee.employeeId || "",
      name: employee.name || "",
      reportingManager: employee.reportingManager || ""
    };
  });
}
