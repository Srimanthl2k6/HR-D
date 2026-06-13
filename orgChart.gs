/**
 * Renders the OrgChart tab from reporting-manager relationships.
 *
 * @param {DashboardModel|Object} model Shared dashboard model.
 * @returns {Object} Render summary.
 */
function renderOrgChart(model) {
  var dashboardModel = model || buildDashboardModel();
  var rows = buildOrgChartTableRows_(dashboardModel);
  var spreadsheet = getActiveSpreadsheet_();

  if (spreadsheet) {
    var sheet = ensureSheet_(spreadsheet, HRD.TABS.ORG_CHART);
    rewriteSheet_(sheet, rows);
    sheet.autoResizeColumns && sheet.autoResizeColumns(1, rows[0].length);
  }

  return {
    tabName: HRD.TABS.ORG_CHART,
    rendered: Boolean(spreadsheet),
    rows: rows,
    model: dashboardModel
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

/**
 * Builds OrgChart tab rows.
 *
 * @param {DashboardModel|Object} model Dashboard model.
 * @returns {Array[]} Org chart rows.
 */
function buildOrgChartTableRows_(model) {
  var employees = model.drillDownRows || [];
  var rows = [["Reporting Manager", "Report Name", "Emp ID", "Department", "Status"]];

  employees.slice().sort(function(left, right) {
    return String(left.reportingManager || "").localeCompare(String(right.reportingManager || ""))
      || String(left.name || "").localeCompare(String(right.name || ""));
  }).forEach(function(employee) {
    rows.push([
      employee.reportingManager || "Unassigned",
      employee.name || "",
      employee.employeeId || "",
      employee.department || "",
      employee.employmentStatus || ""
    ]);
  });

  return rows;
}
