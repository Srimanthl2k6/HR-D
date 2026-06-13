/**
 * Runs the Apps Script test harness. Pass 8 adds acceptance tests.
 *
 * @returns {Object} Test run summary.
 */
function runAllTests() {
  var tests = [
    testHeaderMapResolvesAliasesAndReorderedColumns_,
    testLoadAllDataNormalizesEmployeesAndFlagsInvalidRows_,
    testLoadAllDataReadsRelatedSourceTabs_,
    testCurrentMonthColumnDiscovery_,
    testFormulaSanitization_,
    testDashboardModelComputesKpisAndBreakdowns_,
    testDashboardModelBuildsLwdAndProbationAlerts_,
    testDashboardModelComputesCurrentQuarterAttritionFromLiveRows_,
    testDashboardModelSummarizesRiskAndHealthScore_,
    testDashboardRendererSurfacesValidationWarnings_,
    testDashboardRendererBuildsAllRequiredSections_,
    testOrgChartRendererBuildsManagerRows_,
    testDrillDownRendererBuildsFilteredRows_,
    testEditRoutingDistinguishesDrillDownAndSourceEdits_
  ];
  var results = createTestResults_();

  tests.forEach(function(testFn) {
    try {
      testFn();
      results.passed += 1;
      results.tests.push({ name: testFn.name, ok: true });
    } catch (error) {
      results.failed += 1;
      results.failures.push({ name: testFn.name, message: error.message });
      results.tests.push({ name: testFn.name, ok: false, message: error.message });
    }
  });

  logInfo("Test harness completed. Passed: " + results.passed + ". Failed: " + results.failed + ".");
  return results;
}

/**
 * Asserts that a condition is true.
 *
 * @param {boolean} condition Assertion condition.
 * @param {string} message Failure message.
 * @returns {void}
 */
function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || "Expected condition to be true.");
  }
}

/**
 * Asserts strict equality between two values.
 *
 * @param {*} expected Expected value.
 * @param {*} actual Actual value.
 * @param {string=} message Failure message.
 * @returns {void}
 */
function assertEquals(expected, actual, message) {
  if (expected !== actual) {
    throw new Error(message || "Expected " + expected + " but received " + actual + ".");
  }
}

/**
 * Asserts that two numbers are approximately equal.
 *
 * @param {number} expected Expected number.
 * @param {number} actual Actual number.
 * @param {number=} tolerance Accepted absolute difference.
 * @param {string=} message Failure message.
 * @returns {void}
 */
function assertApproxEquals(expected, actual, tolerance, message) {
  var maxDelta = typeof tolerance === "number" ? tolerance : 0.001;

  if (Math.abs(expected - actual) > maxDelta) {
    throw new Error(message || "Expected " + actual + " to be within " + maxDelta + " of " + expected + ".");
  }
}

/**
 * Creates the standard test result object.
 *
 * @returns {Object} Empty test result summary.
 */
function createTestResults_() {
  return {
    passed: 0,
    failed: 0,
    failures: [],
    tests: []
  };
}

/**
 * Verifies aliases resolve correctly even when columns are reordered.
 *
 * @returns {void}
 */
function testHeaderMapResolvesAliasesAndReorderedColumns_() {
  var headerMap = buildHeaderMap(
    ["Status", "Employee ID", "Full Name", "Date of Joining", "Manager"],
    {
      employeeId: ["Emp ID", "Employee ID"],
      name: ["Name", "Full Name"],
      employmentStatus: ["Employment Status", "Status"],
      doj: ["DOJ", "Date of Joining"],
      reportingManager: ["Reporting Manager", "Manager"]
    }
  );

  assertEquals(1, headerMap.fields.employeeId, "Employee ID alias should resolve to its reordered position.");
  assertEquals(2, headerMap.fields.name, "Full Name alias should resolve to its reordered position.");
  assertEquals(0, headerMap.fields.employmentStatus, "Status alias should resolve to its reordered position.");
  assertEquals(0, headerMap.warnings.length, "No warnings expected when aliases resolve.");
}

/**
 * Verifies employee rows are normalized and invalid rows are excluded.
 *
 * @returns {void}
 */
function testLoadAllDataNormalizesEmployeesAndFlagsInvalidRows_() {
  var data = loadAllData(getDefaultConfigValues(), createPass3TestTables_());

  assertEquals(2, data.employees.length, "Only valid employee rows should be loaded.");
  assertEquals("India", data.employees[0].region, "India source rows should receive India region.");
  assertEquals("US", data.employees[1].region, "US source rows should receive US region.");
  assertEquals(HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION, data.employees[0].employmentStatus, "Probation status should normalize.");
  assertTrue(data.validationWarnings.length >= 1, "Invalid source rows should produce validation warnings.");
  assertTrue(
    data.validationWarnings.some(function(warning) {
      return warning.indexOf("Employee ID") !== -1;
    }),
    "Invalid employee ID should be logged as a validation warning."
  );
}

/**
 * Verifies non-employee source tabs are loaded into normalized records.
 *
 * @returns {void}
 */
function testLoadAllDataReadsRelatedSourceTabs_() {
  var data = loadAllData(getDefaultConfigValues(), createPass3TestTables_());

  assertEquals(1, data.risks.length, "Risk rows should load.");
  assertEquals("High", data.risks[0].riskLevel, "Risk level should be preserved.");
  assertEquals(1, data.offboarded.length, "Offboarded rows should load.");
  assertEquals("Q2", data.offboarded[0].exitQuarter, "Exit quarter should be preserved.");
  assertEquals(1, data.finance.length, "Finance rows should load.");
  assertEquals(72, data.finance[0].productivityAverage, "Productivity average should be numeric.");
}

/**
 * Verifies RM Data current-month discovery avoids hardcoded month names.
 *
 * @returns {void}
 */
function testCurrentMonthColumnDiscovery_() {
  var data = loadAllData(getDefaultConfigValues(), createPass3TestTables_());

  assertEquals(1, data.rmData.length, "RM Data should load current-month values.");
  assertEquals("Current Month", data.rmData[0].monthHeader, "Current-month column should be discovered.");
  assertEquals(88, data.rmData[0].value, "Current-month value should be numeric.");
}

/**
 * Verifies formula-like values are sanitized before Sheet output.
 *
 * @returns {void}
 */
function testFormulaSanitization_() {
  assertEquals("'=SUM(A1:A2)", sanitizeForSheetOutput("=SUM(A1:A2)"), "Equals-prefixed text should be escaped.");
  assertEquals("Normal text", sanitizeForSheetOutput("Normal text"), "Normal text should not be changed.");
}

/**
 * Verifies dashboard KPI and department breakdown calculations.
 *
 * @returns {void}
 */
function testDashboardModelComputesKpisAndBreakdowns_() {
  var model = buildDashboardModel(createPass4SourceData_(), getDefaultConfigValues());

  assertEquals(4, model.kpis.totalHeadcount, "Total headcount should include all employees.");
  assertEquals(3, model.kpis.regionHeadcount.India, "India headcount should be computed.");
  assertEquals(1, model.kpis.regionHeadcount.US, "US headcount should be computed.");
  assertEquals(1, model.kpis.statusHeadcount.Confirmed, "Confirmed headcount should be computed.");
  assertEquals(1, model.kpis.statusHeadcount["Under Probation"], "Probation headcount should be computed.");
  assertEquals(2, model.kpis.statusHeadcount.Intern, "Intern headcount should be computed.");
  assertEquals(1, model.kpis.productivityFlagCount, "Productivity flags should use PRODUCTIVITY_TARGET.");
  assertEquals(2, model.departmentBreakdown.length, "Department breakdown should group departments.");
}

/**
 * Verifies LWD and probation alert calculations.
 *
 * @returns {void}
 */
function testDashboardModelBuildsLwdAndProbationAlerts_() {
  var model = buildDashboardModel(createPass4SourceData_(), getDefaultConfigValues());

  assertEquals(2, model.lwdAlerts.length, "Upcoming and recently passed intern LWD alerts should be visible.");
  assertTrue(
    model.lwdAlerts.some(function(alert) { return alert.employeeId === "INT-UPCOMING"; }),
    "Intern with LWD in threshold should be in LWD alerts."
  );
  assertTrue(
    model.lwdAlerts.some(function(alert) { return alert.employeeId === "INT-PASSED"; }),
    "Intern with recently passed LWD should be in LWD alerts."
  );
  assertEquals(1, model.probationAlerts.length, "One probationer should be confirmation-imminent.");
  assertEquals("PROB-001", model.probationAlerts[0].employeeId, "Probation alert should target the confirmation-imminent employee.");
}

/**
 * Verifies attrition uses current live offboarded rows.
 *
 * @returns {void}
 */
function testDashboardModelComputesCurrentQuarterAttritionFromLiveRows_() {
  var source = createPass4SourceData_();
  var modelWithExit = buildDashboardModel(source, getDefaultConfigValues());
  var sourceAfterDeletion = createPass4SourceData_();
  sourceAfterDeletion.offboarded = [];
  var modelAfterDeletion = buildDashboardModel(sourceAfterDeletion, getDefaultConfigValues());

  assertEquals(1, modelWithExit.attrition.exits, "Current-quarter exits should be counted.");
  assertTrue(modelWithExit.attrition.rate > 0, "Attrition rate should be positive when current-quarter exits exist.");
  assertEquals(0, modelAfterDeletion.attrition.exits, "Deleting an offboarded row should change live exit count.");
  assertEquals(0, modelAfterDeletion.attrition.rate, "Deleting all current-quarter offboarded rows should reset attrition rate.");
}

/**
 * Verifies risk summaries and HR Health Score are audit-friendly.
 *
 * @returns {void}
 */
function testDashboardModelSummarizesRiskAndHealthScore_() {
  var model = buildDashboardModel(createPass4SourceData_(), getDefaultConfigValues());

  assertEquals(1, model.kpis.activeRiskCount, "Only active risk items should count as active.");
  assertEquals(1, model.riskSummary.byCategory.Delivery, "Risk summary should group by category.");
  assertEquals(1, model.riskSummary.byLevel.High, "Risk summary should group by level.");
  assertEquals(1, model.riskSummary.byStatus.Open, "Risk summary should group by status.");
  assertTrue(model.healthScore.score >= 0 && model.healthScore.score <= 100, "Health Score should stay within 0-100.");
  assertTrue(typeof model.healthScore.components.attrition.value === "number", "Attrition component should expose its value.");
  assertTrue(typeof model.healthScore.components.openAlerts.value === "number", "Open-alert component should expose its value.");
  assertTrue(typeof model.healthScore.components.activeRisks.value === "number", "Risk component should expose its value.");
  assertTrue(typeof model.healthScore.components.productivityAverage.value === "number", "Productivity component should expose its value.");
}

/**
 * Verifies validation warnings are visible in Dashboard output.
 *
 * @returns {void}
 */
function testDashboardRendererSurfacesValidationWarnings_() {
  var source = createPass4SourceData_();
  source.validationWarnings = ["India Employee Database row 3: Employment Status must be Confirmed, Under Probation, or Intern."];
  var rows = buildDashboardRows_(buildDashboardModel(source, getDefaultConfigValues()));
  var flatText = JSON.stringify(rows);

  assertTrue(flatText.indexOf("Data Quality Warnings") !== -1, "Dashboard rows should include a data quality warning section.");
  assertTrue(flatText.indexOf("Employment Status must be Confirmed") !== -1, "Dashboard rows should surface plain-English validation messages.");
}

/**
 * Verifies Dashboard render rows contain every required section.
 *
 * @returns {void}
 */
function testDashboardRendererBuildsAllRequiredSections_() {
  var rows = buildDashboardRows_(buildDashboardModel(createPass4SourceData_(), getDefaultConfigValues()));
  var flatText = JSON.stringify(rows);

  getDashboardSectionNames().forEach(function(sectionName) {
    assertTrue(flatText.indexOf(sectionName) !== -1, "Dashboard rows should include section: " + sectionName);
  });
  assertTrue(flatText.indexOf("PROB-001") !== -1, "Dashboard rows should include probation alert employee IDs.");
  assertTrue(flatText.indexOf("INT-UPCOMING") !== -1, "Dashboard rows should include LWD alert employee IDs.");
}

/**
 * Verifies OrgChart rows reflect reporting-manager relationships.
 *
 * @returns {void}
 */
function testOrgChartRendererBuildsManagerRows_() {
  var model = buildDashboardModel(createPass4SourceData_(), getDefaultConfigValues());
  var rows = buildOrgChartTableRows_(model);

  assertEquals("Reporting Manager", rows[0][0], "OrgChart table should start with headers.");
  assertTrue(
    rows.some(function(row) {
      return row[0] === "Mina Shah" && row[2] === "PROB-001";
    }),
    "OrgChart rows should include manager-to-report relationships."
  );
}

/**
 * Verifies DrillDown rows apply filter values.
 *
 * @returns {void}
 */
function testDrillDownRendererBuildsFilteredRows_() {
  var model = buildDashboardModel(createPass4SourceData_(), getDefaultConfigValues());
  var rows = buildDrillDownRows_(model, {
    region: "India",
    department: "Engineering",
    reportingManager: "All",
    employmentStatus: "All"
  });

  assertEquals("Emp ID", rows[6][0], "DrillDown table should include an employee header row after filters.");
  assertTrue(
    rows.some(function(row) {
      return row[0] === "PROB-001";
    }),
    "Filtered DrillDown rows should include matching employees."
  );
  assertTrue(
    !rows.some(function(row) {
      return row[0] === "CONF-001";
    }),
    "Filtered DrillDown rows should exclude non-matching employees."
  );
}

/**
 * Verifies edit routing distinguishes DrillDown filters and source tabs.
 *
 * @returns {void}
 */
function testEditRoutingDistinguishesDrillDownAndSourceEdits_() {
  assertEquals(
    "drillDownFilter",
    classifyEditEvent_({ range: createTestRange_(HRD.TABS.DRILL_DOWN, "B2") }),
    "DrillDown filter edits should route to DrillDown refresh."
  );
  assertEquals(
    "sourceData",
    classifyEditEvent_({ range: createTestRange_(HRD.TABS.INDIA_EMPLOYEES, "A2") }),
    "Source tab edits should route to the full pipeline."
  );
}

/**
 * Creates representative source-table data for Pass 3 tests.
 *
 * @returns {Object} Source tables keyed by tab name.
 */
function createPass3TestTables_() {
  var currentMonthHeader = "Current Month";
  var validDoj = createRelativeDate_(0, -5, 0);
  var usDoj = createRelativeDate_(0, -4, 0);
  var riskRaised = createRelativeDate_(0, -3, 0);
  var lastWorkingDay = createRelativeDate_(0, -2, 0);

  return {
    "India Employee Database": [
      ["Employment Status", "Employee ID", "Full Name", "Date of Joining", "Manager", "Department", "Designation", "Skillset", "LWD"],
      ["probationer", "IND-001", "Asha Rao", validDoj, "Mina Shah", "Engineering", "Analyst", "Apps Script", ""],
      ["Alien", "bad id!", "Invalid Person", "not a date", "Mina Shah", "Engineering", "Analyst", "Apps Script", ""]
    ],
    "US Employee Database": [
      ["Emp ID", "Name", "Department", "Designation", "Reporting Manager", "Skillset", "DOJ", "Employment Status", "Allocation %", "CTC"],
      ["US-001", "Noah Smith", "Product", "Manager", "Mina Shah", "Product", usDoj, "Confirmed", "85", "120000"]
    ],
    "RM Data": [
      ["Emp ID", "Name", "Last Month", currentMonthHeader],
      ["IND-001", "Asha Rao", "70", "88"]
    ],
    "Finance-Productivity": [
      ["Emp ID", "CTC INR Annual", "CTC INR Monthly", "CTC USD Annual", "CTC USD Monthly", "Productivity Average"],
      ["IND-001", "1200000", "100000", "14500", "1208", "72"]
    ],
    "Risk Report": [
      ["Emp ID", "Name", "Risk Category", "Risk Level", "Description", "Date Raised", "Status"],
      ["IND-001", "Asha Rao", "Delivery", "High", "Project dependency", riskRaised, "Open"]
    ],
    "Offboarded Resources": [
      ["Emp ID", "Name", "Department", "Designation", "Last Working Day", "Reason", "Exit Quarter"],
      ["OLD-001", "Past Employee", "Engineering", "Developer", lastWorkingDay, "Resigned", "Q2"]
    ]
  };
}

/**
 * Creates normalized source data for Pass 4 business-logic tests.
 *
 * @returns {Object} Normalized source data.
 */
function createPass4SourceData_() {
  return {
    employees: [
      createTestEmployee_("PROB-001", "Priya Menon", "India", "Engineering", HRD.EMPLOYMENT_STATUSES.UNDER_PROBATION, createRelativeDayDate_(-155), null, 92),
      createTestEmployee_("INT-UPCOMING", "Dev Shah", "India", "Engineering", HRD.EMPLOYMENT_STATUSES.INTERN, createRelativeDayDate_(-40), createRelativeDayDate_(20), 78),
      createTestEmployee_("INT-PASSED", "Ira Rao", "India", "People", HRD.EMPLOYMENT_STATUSES.INTERN, createRelativeDayDate_(-80), createRelativeDayDate_(-5), 88),
      createTestEmployee_("CONF-001", "Noah Smith", "US", "People", HRD.EMPLOYMENT_STATUSES.CONFIRMED, createRelativeDayDate_(-400), null, 95)
    ],
    risks: [
      {
        employeeId: "PROB-001",
        name: "Priya Menon",
        riskCategory: "Delivery",
        riskLevel: "High",
        description: "Project dependency",
        dateRaised: createRelativeDayDate_(-3),
        status: "Open"
      },
      {
        employeeId: "CONF-001",
        name: "Noah Smith",
        riskCategory: "Engagement",
        riskLevel: "Low",
        description: "Resolved item",
        dateRaised: createRelativeDayDate_(-12),
        status: "Closed"
      }
    ],
    offboarded: [
      {
        employeeId: "OLD-001",
        name: "Past Employee",
        department: "Engineering",
        designation: "Developer",
        lastWorkingDay: createRelativeDayDate_(-7),
        reason: "Resigned",
        exitQuarter: createCurrentQuarterLabelForTest_()
      }
    ],
    finance: [],
    rmData: [],
    schemaWarnings: [],
    validationWarnings: []
  };
}

/**
 * Creates a normalized employee for tests.
 *
 * @param {string} employeeId Employee ID.
 * @param {string} name Employee name.
 * @param {string} region Region.
 * @param {string} department Department.
 * @param {string} status Employment status.
 * @param {Date} doj Date of joining.
 * @param {Date|null} lwd Last working day.
 * @param {number} productivityAverage Productivity average.
 * @returns {EmployeeRecord} Employee record.
 */
function createTestEmployee_(employeeId, name, region, department, status, doj, lwd, productivityAverage) {
  return {
    employeeId: employeeId,
    name: name,
    region: region,
    department: department,
    designation: "Analyst",
    reportingManager: "Mina Shah",
    skillset: "Automation",
    doj: doj,
    employmentStatus: status,
    lwd: lwd,
    allocationPercent: null,
    ctc: null,
    productivityAverage: productivityAverage,
    rmMonthValue: null
  };
}

/**
 * Creates a date offset from the current day.
 *
 * @param {number} dayOffset Day offset from now.
 * @returns {Date} Relative date.
 */
function createRelativeDayDate_(dayOffset) {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
}

/**
 * Creates the current quarter label for test fixture data.
 *
 * @returns {string} Current quarter label.
 */
function createCurrentQuarterLabelForTest_() {
  var now = new Date();
  return "Q" + (Math.floor(now.getMonth() / 3) + 1);
}

/**
 * Creates a minimal Apps Script range test double.
 *
 * @param {string} sheetName Sheet name.
 * @param {string} a1 A1 notation.
 * @returns {Object} Range-like object.
 */
function createTestRange_(sheetName, a1) {
  return {
    getA1Notation: function() {
      return a1;
    },
    getSheet: function() {
      return {
        getName: function() {
          return sheetName;
        }
      };
    }
  };
}

/**
 * Creates a deterministic relative date for test fixtures without hardcoded dates.
 *
 * @param {number} yearOffset Year offset from current year.
 * @param {number} monthOffset Month offset from current month.
 * @param {number} dayOffset Day offset from current day.
 * @returns {Date} Relative date.
 */
function createRelativeDate_(yearOffset, monthOffset, dayOffset) {
  var now = new Date();
  return new Date(
    now.getFullYear() + yearOffset,
    now.getMonth() + monthOffset,
    now.getDate() + dayOffset
  );
}
