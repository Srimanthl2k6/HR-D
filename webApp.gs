/**
 * Serves the HtmlService web application.
 *
 * @param {Object=} event Apps Script GET event.
 * @returns {Object} HtmlService output or local fallback object.
 */
function doGet(event) {
  if (typeof HtmlService === "undefined") {
    return {
      title: HRD.APP.NAME,
      event: event || null,
      message: "HtmlService is available only inside Apps Script."
    };
  }

  var template = HtmlService.createTemplateFromFile("Index");
  template.initialPayload = JSON.stringify(getDashboardData());

  return template
    .evaluate()
    .setTitle(HRD.APP.NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Includes an HTML partial in an HtmlService template.
 *
 * @param {string} filename HtmlService file name.
 * @returns {string} Partial content.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Returns dashboard data for the Web App.
 *
 * @returns {DashboardModel} Dashboard model.
 */
function getDashboardData() {
  var config = getDefaultConfigValues();
  var data = loadAllData(config);

  return buildDashboardModel(data, config);
}

/**
 * Returns filtered employee rows for the Web App drill-down view.
 *
 * @param {Object=} filters Filter values.
 * @returns {EmployeeRecord[]} Filtered employee rows.
 */
function getFilteredEmployees(filters) {
  var data = loadAllData(getDefaultConfigValues());

  return filterEmployeesForDrillDown(data.employees, filters || getDefaultDrillDownFilters());
}

/**
 * Returns the last known pipeline status for the Web App.
 *
 * @returns {Object} Pipeline status summary.
 */
function getLastPipelineStatus() {
  return {
    ok: true,
    message: "Pipeline status storage is implemented in a later pass."
  };
}
