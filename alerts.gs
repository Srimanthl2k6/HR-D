/**
 * Builds the shared dashboard model used by Sheet and Web App renderers.
 *
 * @param {Object=} data Normalized source data.
 * @param {Object=} config Runtime configuration.
 * @returns {DashboardModel} Dashboard model.
 */
function buildDashboardModel(data, config) {
  var runtimeConfig = config || loadConfig();
  var source = data || loadAllData(runtimeConfig);

  return {
    kpis: buildKpis_(source, runtimeConfig),
    lwdAlerts: buildLwdAlerts_(source.employees || [], runtimeConfig),
    probationAlerts: buildProbationAlerts_(source.employees || [], runtimeConfig),
    departmentBreakdown: buildDepartmentBreakdown_(source.employees || []),
    attrition: buildAttritionModel_(source.employees || [], source.offboarded || []),
    riskSummary: buildRiskSummary_(source.risks || []),
    orgChart: {
      managers: buildOrgChartRows(source.employees || [])
    },
    drillDownRows: source.employees || [],
    dataQuality: {
      schemaWarnings: source.schemaWarnings || [],
      validationWarnings: source.validationWarnings || []
    },
    healthScore: buildHealthScore_(source, runtimeConfig)
  };
}

/**
 * Evaluates all active HR alerts.
 *
 * @param {Object=} data Normalized source data.
 * @param {Object=} config Runtime configuration.
 * @returns {Object} Alert model grouped by category.
 */
function evaluateAlerts(data, config) {
  var model = buildDashboardModel(data, config);

  return {
    lwdAlerts: model.lwdAlerts,
    probationAlerts: model.probationAlerts,
    allAlerts: model.lwdAlerts.concat(model.probationAlerts)
  };
}

/**
 * Builds the email digest payload without sending mail.
 *
 * @param {Object=} alertModel Alert model returned by evaluateAlerts.
 * @returns {Object} Digest payload.
 */
function buildAlertDigestModel(alertModel) {
  var alerts = alertModel || evaluateAlerts();

  return {
    hasActiveAlerts: alerts.allAlerts.length > 0,
    lwdAlerts: alerts.lwdAlerts,
    probationAlerts: alerts.probationAlerts,
    subject: "Techolution HR Alerts - " + formatDateForMessage_(new Date()),
    body: buildAlertDigestBody_(alerts)
  };
}

/**
 * Sends the HR alert digest if active alerts exist.
 *
 * @param {Object} alertModel Alert model returned by evaluateAlerts.
 * @param {Object} config Runtime configuration.
 * @returns {Object} Send result.
 */
function sendAlertDigestIfNeeded(alertModel, config) {
  var digest = buildAlertDigestModel(alertModel);

  if (!digest.hasActiveAlerts) {
    return { sent: false, reason: "No active alerts." };
  }

  if (typeof MailApp === "undefined" || !MailApp.sendEmail) {
    return { sent: false, warning: "Email digest failed: MailApp is unavailable." };
  }

  try {
    MailApp.sendEmail({
      to: config.HR_ALERT_EMAIL,
      subject: digest.subject,
      body: digest.body
    });
    logInfo("Sent HR alert digest.");
    return { sent: true };
  } catch (error) {
    var message = "Email digest failed: " + getSafeErrorMessage_(error);
    logError(message);
    sendAdminAlert_("MailApp Failure", message, config);
    return { sent: false, warning: message };
  }
}

/**
 * Builds a plain-text alert digest body.
 *
 * @param {Object} alerts Alert model.
 * @returns {string} Digest body.
 */
function buildAlertDigestBody_(alerts) {
  var lines = [
    "Techolution HR Alerts",
    "",
    "LWD Alerts"
  ];

  appendDigestAlertLines_(lines, alerts.lwdAlerts || []);
  lines.push("");
  lines.push("Probation Alerts");
  appendDigestAlertLines_(lines, alerts.probationAlerts || []);

  return lines.join("\n");
}

/**
 * Appends alert lines to the digest body.
 *
 * @param {string[]} lines Digest lines.
 * @param {AlertRecord[]} alerts Alert records.
 * @returns {void}
 */
function appendDigestAlertLines_(lines, alerts) {
  if (!alerts.length) {
    lines.push("No active alerts.");
    return;
  }

  alerts.forEach(function(alert) {
    lines.push([
      alert.employeeId,
      alert.name,
      alert.department,
      alert.type,
      formatDateForMessage_(alert.relevantDate)
    ].join(" | "));
  });
}

/**
 * Formats a date for email/log messages.
 *
 * @param {*} value Date-like value.
 * @returns {string} Message-safe date.
 */
function formatDateForMessage_(value) {
  var date = value instanceof Date ? value : normalizeDateValue_(value);
  if (!date) {
    return "";
  }

  if (typeof Utilities !== "undefined" && Utilities.formatDate && typeof Session !== "undefined") {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return date.getFullYear() + "-" + padTwo_(date.getMonth() + 1) + "-" + padTwo_(date.getDate());
}

/**
 * Pads a number to two digits.
 *
 * @param {number} value Numeric value.
 * @returns {string} Padded string.
 */
function padTwo_(value) {
  return value < 10 ? "0" + value : String(value);
}

/**
 * Creates an empty dashboard model with all required top-level sections.
 *
 * @param {Object} source Normalized source data.
 * @returns {DashboardModel} Empty dashboard model.
 */
function createEmptyDashboardModel_(source) {
  return {
    kpis: {
      regionHeadcount: {},
      statusHeadcount: {},
      productivityFlagCount: 0,
      activeRiskCount: 0,
      totalHeadcount: source && source.employees ? source.employees.length : 0
    },
    lwdAlerts: [],
    probationAlerts: [],
    departmentBreakdown: [],
    attrition: {
      currentQuarter: "",
      exits: 0,
      rate: 0
    },
    riskSummary: {
      byCategory: {},
      byLevel: {},
      byStatus: {}
    },
    orgChart: {
      managers: []
    },
    drillDownRows: [],
    healthScore: {
      score: 100,
      components: {
        attrition: 30,
        openAlerts: 25,
        activeRisks: 25,
        productivityAverage: 20
      }
    }
  };
}

/**
 * Builds dashboard KPI values.
 *
 * @param {Object} source Normalized source data.
 * @param {Object} config Runtime configuration.
 * @returns {Object} KPI model.
 */
function buildKpis_(source, config) {
  var employees = source.employees || [];
  var risks = source.risks || [];

  return {
    regionHeadcount: countByField_(employees, "region"),
    statusHeadcount: countByField_(employees, "employmentStatus"),
    productivityFlagCount: countProductivityFlags_(employees, config),
    activeRiskCount: countActiveRisks_(risks),
    totalHeadcount: employees.length
  };
}

/**
 * Counts records by a named field.
 *
 * @param {Object[]} records Records to count.
 * @param {string} field Field name.
 * @returns {Object} Counts by field value.
 */
function countByField_(records, field) {
  return (records || []).reduce(function(counts, record) {
    var key = record[field] || "Unspecified";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

/**
 * Counts employees below the productivity target.
 *
 * @param {EmployeeRecord[]} employees Employee records.
 * @param {Object} config Runtime configuration.
 * @returns {number} Flag count.
 */
function countProductivityFlags_(employees, config) {
  var target = Number(config.PRODUCTIVITY_TARGET);

  return (employees || []).filter(function(employee) {
    return typeof employee.productivityAverage === "number" && employee.productivityAverage < target;
  }).length;
}

/**
 * Counts active risk records.
 *
 * @param {RiskRecord[]} risks Risk records.
 * @returns {number} Active risk count.
 */
function countActiveRisks_(risks) {
  return (risks || []).filter(isActiveRisk_).length;
}

/**
 * Returns true when a risk status is active.
 *
 * @param {RiskRecord|Object} risk Risk record.
 * @returns {boolean} True when active.
 */
function isActiveRisk_(risk) {
  var status = String(risk.status || "").trim().toLowerCase();
  return status !== "" && ["closed", "resolved", "inactive", "done"].indexOf(status) === -1;
}

/**
 * Builds intern LWD alerts using the configured alert window.
 *
 * @param {EmployeeRecord[]} employees Employee records.
 * @param {Object} config Runtime configuration.
 * @returns {AlertRecord[]} LWD alerts.
 */
function buildLwdAlerts_(employees, config) {
  var threshold = Number(config.LWD_ALERT_DAYS);
  var today = startOfDay_(new Date());

  return (employees || []).filter(function(employee) {
    if (employee.employmentStatus !== HRD.EMPLOYMENT_STATUSES.INTERN || !employee.lwd) {
      return false;
    }

    var daysUntilLwd = diffDays_(today, startOfDay_(employee.lwd));
    return Math.abs(daysUntilLwd) <= threshold;
  }).map(function(employee) {
    var daysUntilLwd = diffDays_(today, startOfDay_(employee.lwd));
    var overdue = daysUntilLwd < 0;

    return createAlertRecord_(
      "LWD",
      employee,
      employee.lwd,
      overdue ? "overdue" : "imminent",
      overdue ? "Intern LWD has recently passed." : "Intern LWD is approaching."
    );
  });
}

/**
 * Builds probation confirmation alerts using configured duration and window.
 *
 * @param {EmployeeRecord[]} employees Employee records.
 * @param {Object} config Runtime configuration.
 * @returns {AlertRecord[]} Probation alerts.
 */
function buildProbationAlerts_(employees, config) {
  var threshold = Number(config.PROBATION_ALERT_DAYS);
  var duration = Number(config.PROBATION_DURATION_DAYS);
  var today = startOfDay_(new Date());

  return (employees || []).filter(function(employee) {
    if (employee.employmentStatus !== HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION || !employee.doj) {
      return false;
    }

    var confirmationDate = addDays_(employee.doj, duration);
    var daysUntilConfirmation = diffDays_(today, startOfDay_(confirmationDate));
    return daysUntilConfirmation >= 0 && daysUntilConfirmation <= threshold;
  }).map(function(employee) {
    var confirmationDate = addDays_(employee.doj, duration);

    return createAlertRecord_(
      "Probation",
      employee,
      confirmationDate,
      "imminent",
      "Probation confirmation date is approaching."
    );
  });
}

/**
 * Creates an alert record.
 *
 * @param {string} type Alert type.
 * @param {EmployeeRecord} employee Employee record.
 * @param {Date|null} relevantDate Alert date.
 * @param {string} severity Alert severity.
 * @param {string} message Alert message.
 * @returns {AlertRecord} Alert record.
 */
function createAlertRecord_(type, employee, relevantDate, severity, message) {
  return {
    type: type,
    employeeId: employee.employeeId || "",
    name: employee.name || "",
    department: employee.department || "",
    relevantDate: relevantDate || null,
    severity: severity,
    message: message
  };
}

/**
 * Builds department headcount and status distribution.
 *
 * @param {EmployeeRecord[]} employees Employee records.
 * @returns {Object[]} Department breakdown rows.
 */
function buildDepartmentBreakdown_(employees) {
  var byDepartment = {};

  (employees || []).forEach(function(employee) {
    var department = employee.department || "Unspecified";
    if (!byDepartment[department]) {
      byDepartment[department] = {
        department: department,
        headcount: 0,
        statusHeadcount: {}
      };
    }

    byDepartment[department].headcount += 1;
    byDepartment[department].statusHeadcount[employee.employmentStatus] =
      (byDepartment[department].statusHeadcount[employee.employmentStatus] || 0) + 1;
  });

  return Object.keys(byDepartment).sort().map(function(department) {
    return byDepartment[department];
  });
}

/**
 * Builds quarterly attrition from live offboarded rows.
 *
 * @param {EmployeeRecord[]} employees Employee records.
 * @param {OffboardRecord[]} offboarded Offboarded records.
 * @returns {Object} Attrition model.
 */
function buildAttritionModel_(employees, offboarded) {
  var today = new Date();
  var currentQuarter = getCurrentQuarterLabel_(today);
  var currentQuarterExits = (offboarded || []).filter(function(record) {
    return isCurrentQuarterExit_(record, today, currentQuarter);
  });
  var denominator = Math.max((employees || []).length + currentQuarterExits.length, 1);
  var rate = roundToTwo_((currentQuarterExits.length / denominator) * 100);

  return {
    currentQuarter: currentQuarter,
    exits: currentQuarterExits.length,
    rate: rate,
    denominator: denominator
  };
}

/**
 * Returns true when an offboarded record belongs to the current quarter.
 *
 * @param {OffboardRecord|Object} record Offboarded record.
 * @param {Date} today Current date.
 * @param {string} currentQuarter Current quarter label.
 * @returns {boolean} True when current-quarter exit.
 */
function isCurrentQuarterExit_(record, today, currentQuarter) {
  if (record.lastWorkingDay instanceof Date && !isNaN(record.lastWorkingDay.getTime())) {
    return record.lastWorkingDay.getFullYear() === today.getFullYear()
      && Math.floor(record.lastWorkingDay.getMonth() / 3) === Math.floor(today.getMonth() / 3);
  }

  return String(record.exitQuarter || "").trim().toLowerCase() === currentQuarter.toLowerCase();
}

/**
 * Returns the quarter label for a date.
 *
 * @param {Date} date Date value.
 * @returns {string} Quarter label.
 */
function getCurrentQuarterLabel_(date) {
  return "Q" + (Math.floor(date.getMonth() / 3) + 1);
}

/**
 * Builds risk summary groupings.
 *
 * @param {RiskRecord[]} risks Risk records.
 * @returns {Object} Risk summary.
 */
function buildRiskSummary_(risks) {
  return {
    byCategory: countByField_(risks || [], "riskCategory"),
    byLevel: countByField_(risks || [], "riskLevel"),
    byStatus: countByField_(risks || [], "status")
  };
}

/**
 * Builds the weighted HR Health Score.
 *
 * @param {Object} source Normalized source data.
 * @param {Object} config Runtime configuration.
 * @returns {Object} Health score model.
 */
function buildHealthScore_(source, config) {
  var employees = source.employees || [];
  var attrition = buildAttritionModel_(employees, source.offboarded || []);
  var alerts = {
    lwdAlerts: buildLwdAlerts_(employees, config),
    probationAlerts: buildProbationAlerts_(employees, config)
  };
  var alertCount = alerts.lwdAlerts.length + alerts.probationAlerts.length;
  var activeRiskCount = countActiveRisks_(source.risks || []);
  var productivityAverage = averageProductivity_(employees);
  var components = {
    attrition: createHealthComponent_(attrition.rate, 30, Math.max(0, 100 - attrition.rate * 5)),
    openAlerts: createHealthComponent_(alertCount, 25, Math.max(0, 100 - alertCount * 10)),
    activeRisks: createHealthComponent_(activeRiskCount, 25, Math.max(0, 100 - activeRiskCount * 15)),
    productivityAverage: createHealthComponent_(productivityAverage, 20, productivityAverage)
  };
  var score = roundToTwo_(
    components.attrition.weightedScore
    + components.openAlerts.weightedScore
    + components.activeRisks.weightedScore
    + components.productivityAverage.weightedScore
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    scale: "0-100",
    components: components
  };
}

/**
 * Creates a weighted health score component.
 *
 * @param {number} value Raw component value.
 * @param {number} weight Weight percentage.
 * @param {number} componentScore Component score from 0 to 100.
 * @returns {Object} Health score component.
 */
function createHealthComponent_(value, weight, componentScore) {
  var boundedScore = Math.max(0, Math.min(100, Number(componentScore) || 0));

  return {
    value: Number(value) || 0,
    weight: weight,
    score: roundToTwo_(boundedScore),
    weightedScore: roundToTwo_(boundedScore * (weight / 100))
  };
}

/**
 * Computes average productivity for employees with productivity data.
 *
 * @param {EmployeeRecord[]} employees Employee records.
 * @returns {number} Average productivity.
 */
function averageProductivity_(employees) {
  var values = (employees || []).map(function(employee) {
    return employee.productivityAverage;
  }).filter(function(value) {
    return typeof value === "number" && isFinite(value);
  });

  if (!values.length) {
    return 100;
  }

  return roundToTwo_(values.reduce(function(sum, value) {
    return sum + value;
  }, 0) / values.length);
}

/**
 * Adds a day count to a date.
 *
 * @param {Date} date Base date.
 * @param {number} days Days to add.
 * @returns {Date} Result date.
 */
function addDays_(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Returns a start-of-day date.
 *
 * @param {Date} date Date value.
 * @returns {Date} Start-of-day date.
 */
function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Returns whole-day difference from start to end.
 *
 * @param {Date} start Start date.
 * @param {Date} end End date.
 * @returns {number} Day difference.
 */
function diffDays_(start, end) {
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

/**
 * Rounds a number to two decimals.
 *
 * @param {number} value Numeric value.
 * @returns {number} Rounded number.
 */
function roundToTwo_(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
