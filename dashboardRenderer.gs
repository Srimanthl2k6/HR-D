/**
 * Renders the Sheet Dashboard tab from the dashboard model.
 *
 * @param {DashboardModel|Object} model Shared dashboard model.
 * @returns {Object} Render summary.
 */
function renderDashboard(model) {
  return {
    tabName: HRD.TABS.DASHBOARD,
    rendered: false,
    sectionCount: getDashboardSectionNames().length,
    model: model || buildDashboardModel()
  };
}

/**
 * Returns the required Dashboard sections in render order.
 *
 * @returns {string[]} Dashboard section names.
 */
function getDashboardSectionNames() {
  return [
    "KPI Strip",
    "LWD Alerts",
    "Probation Alerts",
    "Department Breakdown",
    "Quarterly Attrition",
    "Risk Register Summary",
    "HR Health Score"
  ];
}
