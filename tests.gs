/**
 * Runs the Apps Script test harness. Pass 8 adds acceptance tests.
 *
 * @returns {Object} Test run summary.
 */
function runAllTests() {
  var results = {
    passed: 0,
    failed: 0,
    failures: []
  };

  logInfo("Test harness skeleton executed.");
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
