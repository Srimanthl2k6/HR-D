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
    testFormulaSanitization_
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
