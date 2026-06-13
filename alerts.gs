/**
 * Builds the shared dashboard model used by Sheet and Web App renderers.
 *
 * @param {Object=} data Normalized source data.
 * @param {Object=} config Runtime configuration.
 * @returns {DashboardModel} Dashboard model.
 */
function buildDashboardModel(data, config) {
  var source = data || loadAllData(config);

  return createEmptyDashboardModel_(source);
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
    probationAlerts: alerts.probationAlerts
  };
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
