/**
 * Creates the workbook structure, seeds defaults, and protects output tabs.
 *
 * @returns {Object} Setup summary.
 */
function setupWorkbook() {
  var spreadsheet = getActiveSpreadsheet_();

  if (!spreadsheet) {
    return {
      ok: true,
      requiredTabs: getRequiredTabs(),
      message: "SpreadsheetApp is unavailable in this environment; workbook setup will run inside Apps Script."
    };
  }

  var createdTabs = [];
  getRequiredTabs().forEach(function(tabName) {
    if (!getSheetByName_(spreadsheet, tabName)) {
      spreadsheet.insertSheet(tabName);
      createdTabs.push(tabName);
    }
  });

  seedSourceHeaders_(spreadsheet);
  seedConfigSheet_(spreadsheet);
  initializeOperationalSheets_(spreadsheet);
  initializeDrillDownSheet_(spreadsheet);
  protectWorkbookTabs_(spreadsheet);
  logInfo("Workbook setup completed. Created tabs: " + (createdTabs.length ? createdTabs.join(", ") : "none"));

  return {
    ok: true,
    createdTabs: createdTabs,
    requiredTabs: getRequiredTabs(),
    message: "Workbook setup completed."
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
    var config = loadConfig();
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
    runId: createRunId_(),
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

/**
 * Creates a short unique run ID for logging and changelog rows.
 *
 * @returns {string} Run ID.
 */
function createRunId_() {
  if (typeof Utilities !== "undefined" && Utilities.getUuid) {
    return Utilities.getUuid();
  }

  return "run-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
}

/**
 * Seeds source tab header rows if they are blank.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @returns {void}
 */
function seedSourceHeaders_(spreadsheet) {
  var tabToHeaders = {};
  tabToHeaders[HRD.TABS.INDIA_EMPLOYEES] = HRD.SOURCE_HEADERS.INDIA_EMPLOYEES;
  tabToHeaders[HRD.TABS.US_EMPLOYEES] = HRD.SOURCE_HEADERS.US_EMPLOYEES;
  tabToHeaders[HRD.TABS.RM_DATA] = HRD.SOURCE_HEADERS.RM_DATA;
  tabToHeaders[HRD.TABS.FINANCE_PRODUCTIVITY] = HRD.SOURCE_HEADERS.FINANCE_PRODUCTIVITY;
  tabToHeaders[HRD.TABS.RISK_REPORT] = HRD.SOURCE_HEADERS.RISK_REPORT;
  tabToHeaders[HRD.TABS.OFFBOARDED_RESOURCES] = HRD.SOURCE_HEADERS.OFFBOARDED_RESOURCES;

  Object.keys(tabToHeaders).forEach(function(tabName) {
    ensureHeaderRow_(ensureSheet_(spreadsheet, tabName), tabToHeaders[tabName]);
  });
}

/**
 * Seeds _Config headers and missing default config rows.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @returns {void}
 */
function seedConfigSheet_(spreadsheet) {
  var sheet = ensureSheet_(spreadsheet, HRD.TABS.CONFIG);
  ensureHeaderRow_(sheet, HRD.SHEET_HEADERS.CONFIG);

  var values = getSheetValues_(sheet);
  var existingKeys = {};
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var key = String((values[rowIndex] || [])[0] || "").trim();
    if (key) {
      existingKeys[key] = true;
    }
  }

  getDefaultConfigRows().forEach(function(row) {
    if (!existingKeys[row[0]]) {
      appendSheetRow_(sheet, row);
    }
  });
}

/**
 * Initializes Logs and Changelog headers.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @returns {void}
 */
function initializeOperationalSheets_(spreadsheet) {
  ensureHeaderRow_(ensureSheet_(spreadsheet, HRD.TABS.LOGS), HRD.SHEET_HEADERS.LOGS);
  ensureHeaderRow_(ensureSheet_(spreadsheet, HRD.TABS.CHANGELOG), HRD.SHEET_HEADERS.CHANGELOG);
}

/**
 * Initializes the DrillDown sheet labels and editable filter cells.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @returns {void}
 */
function initializeDrillDownSheet_(spreadsheet) {
  var sheet = ensureSheet_(spreadsheet, HRD.TABS.DRILL_DOWN);
  var values = [
    ["Drill-Down Filters", ""],
    ["Region", HRD.REGIONS.ALL],
    ["Department", "All"],
    ["Reporting Manager", "All"],
    ["Employment Status", "All"]
  ];

  rewriteSheet_(sheet, values);
}

/**
 * Protects generated tabs and keeps designated DrillDown filter cells editable.
 *
 * @param {Object} spreadsheet Spreadsheet object.
 * @returns {void}
 */
function protectWorkbookTabs_(spreadsheet) {
  getOutputTabNames().concat([HRD.TABS.CONFIG]).forEach(function(tabName) {
    var sheet = ensureSheet_(spreadsheet, tabName);
    protectSheet_(sheet, tabName);
  });

  allowDrillDownFilterEdits_(ensureSheet_(spreadsheet, HRD.TABS.DRILL_DOWN));
}

/**
 * Applies sheet protection when supported.
 *
 * @param {Object} sheet Sheet object.
 * @param {string} tabName Sheet name.
 * @returns {void}
 */
function protectSheet_(sheet, tabName) {
  if (!sheet || !sheet.protect) {
    return;
  }

  try {
    var description = "HRD protected generated tab: " + tabName;
    var existingProtections = sheet.getProtections
      ? sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET)
      : [];
    var protection = null;

    for (var index = 0; index < existingProtections.length; index += 1) {
      if (existingProtections[index].getDescription && existingProtections[index].getDescription() === description) {
        protection = existingProtections[index];
        break;
      }
    }

    if (!protection) {
      protection = sheet.protect().setDescription(description);
    }

    if (protection.setWarningOnly) {
      protection.setWarningOnly(false);
    }
    if (protection.canDomainEdit && protection.canDomainEdit() && protection.setDomainEdit) {
      protection.setDomainEdit(false);
    }
    if (protection.getEditors && protection.removeEditors) {
      var editors = protection.getEditors();
      if (editors && editors.length) {
        protection.removeEditors(editors);
      }
    }
  } catch (error) {
    logWarn("Unable to protect " + tabName + ": " + getSafeErrorMessage_(error));
  }
}

/**
 * Leaves the DrillDown filter cells editable inside the protected sheet.
 *
 * @param {Object} sheet DrillDown sheet.
 * @returns {void}
 */
function allowDrillDownFilterEdits_(sheet) {
  if (!sheet || !sheet.getProtections || !sheet.getRange) {
    return;
  }

  try {
    var editableRanges = [
      sheet.getRange(HRD.DRILL_DOWN.FILTER_CELLS.REGION),
      sheet.getRange(HRD.DRILL_DOWN.FILTER_CELLS.DEPARTMENT),
      sheet.getRange(HRD.DRILL_DOWN.FILTER_CELLS.REPORTING_MANAGER),
      sheet.getRange(HRD.DRILL_DOWN.FILTER_CELLS.EMPLOYMENT_STATUS)
    ];
    var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    protections.forEach(function(protection) {
      if (protection.setUnprotectedRanges) {
        protection.setUnprotectedRanges(editableRanges);
      }
    });
  } catch (error) {
    logWarn("Unable to configure DrillDown editable filter cells: " + getSafeErrorMessage_(error));
  }
}
