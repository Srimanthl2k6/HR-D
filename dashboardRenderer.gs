/**
 * Renders the Sheet Dashboard tab from the dashboard model.
 *
 * @param {DashboardModel|Object} model Shared dashboard model.
 * @returns {Object} Render summary.
 */
function renderDashboard(model) {
  var dashboardModel = model || buildDashboardModel();
  var rows = buildDashboardRows_(dashboardModel);
  var spreadsheet = getActiveSpreadsheet_();

  if (spreadsheet) {
    var sheet = ensureSheet_(spreadsheet, HRD.TABS.DASHBOARD);
    rewriteSheet_(sheet, rows);
    applyDashboardFormatting_(sheet, rows);
  }

  return {
    tabName: HRD.TABS.DASHBOARD,
    rendered: Boolean(spreadsheet),
    sectionCount: getDashboardSectionNames().length,
    rows: rows,
    model: dashboardModel
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

/**
 * Builds the Dashboard tab rows from a dashboard model.
 *
 * @param {DashboardModel|Object} model Dashboard model.
 * @returns {Array[]} Rows ready for Sheet output.
 */
function buildDashboardRows_(model) {
  var rows = [
    ["Techolution HR Automation Dashboard", ""],
    ["Generated At", new Date()],
    ["", ""],
    ["KPI Strip", ""],
    ["Metric", "Value"],
    ["Total Headcount", model.kpis.totalHeadcount],
    ["India Headcount", model.kpis.regionHeadcount[HRD.REGIONS.INDIA] || 0],
    ["US Headcount", model.kpis.regionHeadcount[HRD.REGIONS.US] || 0],
    ["Confirmed", model.kpis.statusHeadcount[HRD.EMPLOYMENT_STATUSES.CONFIRMED] || 0],
    ["Under Probation", model.kpis.statusHeadcount[HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION] || 0],
    ["Intern", model.kpis.statusHeadcount[HRD.EMPLOYMENT_STATUSES.INTERN] || 0],
    ["Productivity Flags", model.kpis.productivityFlagCount],
    ["Active Risk Items", model.kpis.activeRiskCount],
    ["", ""]
  ];

  appendAlertSectionRows_(rows, "LWD Alerts", model.lwdAlerts || []);
  appendAlertSectionRows_(rows, "Probation Alerts", model.probationAlerts || []);
  appendDepartmentRows_(rows, model.departmentBreakdown || []);
  appendAttritionRows_(rows, model.attrition || {});
  appendRiskRows_(rows, model.riskSummary || {});
  appendDataQualityRows_(rows, model.dataQuality || {});
  appendHealthScoreRows_(rows, model.healthScore || {});

  return normalizeTableWidth_(rows, 6);
}

/**
 * Appends data quality warning rows to Dashboard output.
 *
 * @param {Array[]} rows Output rows.
 * @param {Object} dataQuality Data quality warnings.
 * @returns {void}
 */
function appendDataQualityRows_(rows, dataQuality) {
  var warnings = (dataQuality.schemaWarnings || []).concat(dataQuality.validationWarnings || []);

  rows.push(["Data Quality Warnings", ""]);
  rows.push(["Level", "Message"]);

  if (!warnings.length) {
    rows.push(["INFO", "No data quality warnings."]);
  }

  warnings.forEach(function(warning) {
    rows.push(["WARN", warning]);
  });

  rows.push(["", ""]);
}

/**
 * Appends alert rows to Dashboard output.
 *
 * @param {Array[]} rows Output rows.
 * @param {string} title Section title.
 * @param {AlertRecord[]} alerts Alert records.
 * @returns {void}
 */
function appendAlertSectionRows_(rows, title, alerts) {
  rows.push([title, ""]);
  rows.push(["Employee ID", "Name", "Department", "Date", "Severity", "Message"]);

  if (!alerts.length) {
    rows.push(["No active alerts", "", "", "", "", ""]);
  }

  alerts.forEach(function(alert) {
    rows.push([
      alert.employeeId,
      alert.name,
      alert.department,
      alert.relevantDate || "",
      alert.severity,
      alert.message
    ]);
  });

  rows.push(["", ""]);
}

/**
 * Appends department breakdown rows to Dashboard output.
 *
 * @param {Array[]} rows Output rows.
 * @param {Object[]} departments Department breakdown rows.
 * @returns {void}
 */
function appendDepartmentRows_(rows, departments) {
  rows.push(["Department Breakdown", ""]);
  rows.push(["Department", "Headcount", "Confirmed", "Under Probation", "Intern"]);

  if (!departments.length) {
    rows.push(["No department data", 0, 0, 0, 0]);
  }

  departments.forEach(function(department) {
    rows.push([
      department.department,
      department.headcount,
      department.statusHeadcount[HRD.EMPLOYMENT_STATUSES.CONFIRMED] || 0,
      department.statusHeadcount[HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION] || 0,
      department.statusHeadcount[HRD.EMPLOYMENT_STATUSES.INTERN] || 0
    ]);
  });

  rows.push(["", ""]);
}

/**
 * Appends attrition rows to Dashboard output.
 *
 * @param {Array[]} rows Output rows.
 * @param {Object} attrition Attrition model.
 * @returns {void}
 */
function appendAttritionRows_(rows, attrition) {
  rows.push(["Quarterly Attrition", ""]);
  rows.push(["Current Quarter", attrition.currentQuarter || ""]);
  rows.push(["Current Quarter Exits", attrition.exits || 0]);
  rows.push(["Attrition Rate", attrition.rate || 0]);
  rows.push(["", ""]);
}

/**
 * Appends risk summary rows to Dashboard output.
 *
 * @param {Array[]} rows Output rows.
 * @param {Object} riskSummary Risk summary model.
 * @returns {void}
 */
function appendRiskRows_(rows, riskSummary) {
  rows.push(["Risk Register Summary", ""]);
  rows.push(["Group", "Name", "Count"]);
  appendGroupedCounts_(rows, "Category", riskSummary.byCategory || {});
  appendGroupedCounts_(rows, "Level", riskSummary.byLevel || {});
  appendGroupedCounts_(rows, "Status", riskSummary.byStatus || {});
  rows.push(["", ""]);
}

/**
 * Appends grouped count rows.
 *
 * @param {Array[]} rows Output rows.
 * @param {string} group Group name.
 * @param {Object} counts Count map.
 * @returns {void}
 */
function appendGroupedCounts_(rows, group, counts) {
  var keys = Object.keys(counts);
  if (!keys.length) {
    rows.push([group, "No data", 0]);
    return;
  }

  keys.sort().forEach(function(key) {
    rows.push([group, key, counts[key]]);
  });
}

/**
 * Appends health score rows to Dashboard output.
 *
 * @param {Array[]} rows Output rows.
 * @param {Object} healthScore Health score model.
 * @returns {void}
 */
function appendHealthScoreRows_(rows, healthScore) {
  rows.push(["HR Health Score", ""]);
  rows.push(["Score", healthScore.score || 0]);
  rows.push(["Component", "Value", "Weight", "Component Score", "Weighted Score"]);
  Object.keys(healthScore.components || {}).forEach(function(key) {
    var component = healthScore.components[key];
    rows.push([key, component.value, component.weight, component.score, component.weightedScore]);
  });
}

/**
 * Pads rows to a stable width for setValues.
 *
 * @param {Array[]} rows Table rows.
 * @param {number} width Output width.
 * @returns {Array[]} Normalized rows.
 */
function normalizeTableWidth_(rows, width) {
  return rows.map(function(row) {
    var copy = row.slice();
    while (copy.length < width) {
      copy.push("");
    }
    return copy.slice(0, width);
  });
}

/**
 * Applies functional Dashboard formatting when available.
 *
 * @param {Object} sheet Dashboard sheet.
 * @param {Array[]} rows Rendered rows.
 * @returns {void}
 */
function applyDashboardFormatting_(sheet, rows) {
  if (!sheet || !sheet.getRange) {
    return;
  }

  try {
    sheet.setFrozenRows && sheet.setFrozenRows(1);
    sheet.autoResizeColumns && sheet.autoResizeColumns(1, rows[0].length);
    colorDashboardSectionRows_(sheet, rows);
    colorDashboardAlertRows_(sheet, rows);
  } catch (error) {
    logWarn("Dashboard formatting could not be applied: " + getSafeErrorMessage_(error));
  }
}

/**
 * Colors section rows for readability.
 *
 * @param {Object} sheet Dashboard sheet.
 * @param {Array[]} rows Rendered rows.
 * @returns {void}
 */
function colorDashboardSectionRows_(sheet, rows) {
  var sectionNames = getDashboardSectionNames().concat(["Techolution HR Automation Dashboard"]);
  rows.forEach(function(row, index) {
    if (sectionNames.indexOf(row[0]) !== -1) {
      var range = sheet.getRange(index + 1, 1, 1, row.length);
      range.setBackground && range.setBackground("#dbeafe");
      range.setFontWeight && range.setFontWeight("bold");
    }
  });
}

/**
 * Colors alert rows by severity.
 *
 * @param {Object} sheet Dashboard sheet.
 * @param {Array[]} rows Rendered rows.
 * @returns {void}
 */
function colorDashboardAlertRows_(sheet, rows) {
  rows.forEach(function(row, index) {
    var severity = String(row[4] || "").toLowerCase();
    if (severity !== "overdue" && severity !== "imminent") {
      return;
    }

    var range = sheet.getRange(index + 1, 1, 1, row.length);
    if (severity === "overdue" && range.setBackground) {
      range.setBackground("#fee2e2");
    }
    if (severity === "imminent" && range.setBackground) {
      range.setBackground("#fef3c7");
    }
  });
}
