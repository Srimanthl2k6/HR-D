/**
 * Creates the workbook structure. Pass 2 implements tab creation and protection.
 *
 * @returns {Object} Setup summary.
 */
function setupWorkbook() {
  return {
    ok: true,
    requiredTabs: getRequiredTabs(),
    message: "Workbook setup skeleton is available; Pass 2 implements Sheets operations."
  };
}

/**
 * Runs the full HRD pipeline.
 *
 * @param {string=} triggerSource Source that initiated the run.
 * @returns {PipelineResult} Pipeline result.
 */
function runFullPipeline(triggerSource) {
  var startedAt = Date.now();
  var source = triggerSource || HRD.TRIGGER_SOURCES.MANUAL;
  var result = createPipelineResult_(source, startedAt);

  try {
    var config = getDefaultConfigValues();
    var data = loadAllData(config);
    var model = buildDashboardModel(data, config);

    renderDashboard(model);
    renderOrgChart(model);
    renderDrillDown(model, getDefaultDrillDownFilters());

    result.model = model;
    result.ok = true;
    result.durationMs = Date.now() - startedAt;
    appendChangelog(result);
    logInfo("Pipeline skeleton completed for trigger source: " + source);
  } catch (error) {
    result.ok = false;
    result.errors.push(getSafeErrorMessage_(error));
    result.durationMs = Date.now() - startedAt;
    logError(result.errors.join("; "));
  }

  return result;
}

/**
 * Handles installable onEdit events.
 *
 * @param {Object} event Apps Script edit event.
 * @returns {PipelineResult|Object} Pipeline or workflow result.
 */
function handleInstallableEdit(event) {
  if (event && event.value && isWorkflowAction(event.value)) {
    return handleWorkflowAction(event);
  }

  return runFullPipeline(HRD.TRIGGER_SOURCES.ON_EDIT);
}

/**
 * Handles installable onChange events for schema drift and structural changes.
 *
 * @param {Object} event Apps Script change event.
 * @returns {PipelineResult} Pipeline result.
 */
function handleInstallableChange(event) {
  return runFullPipeline(HRD.TRIGGER_SOURCES.ON_CHANGE);
}

/**
 * Runs the daily scheduled pipeline.
 *
 * @returns {PipelineResult} Pipeline result.
 */
function runDailyPipeline() {
  return runFullPipeline(HRD.TRIGGER_SOURCES.TIME_BASED);
}

/**
 * Creates a pipeline result skeleton.
 *
 * @param {string} triggerSource Source that initiated the run.
 * @param {number} startedAt Millisecond timestamp captured at run start.
 * @returns {PipelineResult} Pipeline result.
 */
function createPipelineResult_(triggerSource, startedAt) {
  return {
    runId: "pending",
    triggerSource: triggerSource,
    durationMs: 0,
    ok: false,
    warnings: [],
    errors: [],
    model: null,
    startedAt: startedAt
  };
}

/**
 * Converts thrown values into a plain-English message.
 *
 * @param {*} error Thrown value.
 * @returns {string} Safe error message.
 */
function getSafeErrorMessage_(error) {
  if (!error) {
    return "An unknown error occurred.";
  }

  return error.message ? String(error.message) : String(error);
}
