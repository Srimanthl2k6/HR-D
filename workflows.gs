/**
 * Handles workflow action edits from source tabs.
 *
 * @param {Object} event Apps Script edit event.
 * @returns {Object} Workflow handling summary.
 */
function handleWorkflowAction(event) {
  return {
    handled: false,
    event: event || null,
    action: ""
  };
}

/**
 * Returns the configured workflow action names.
 *
 * @returns {string[]} Workflow action names.
 */
function getWorkflowActionNames() {
  return [
    HRD.WORKFLOW_ACTIONS.START_OFFBOARDING,
    HRD.WORKFLOW_ACTIONS.SCHEDULE_PIP,
    HRD.WORKFLOW_ACTIONS.APPROVE_CONFIRMATION
  ];
}

/**
 * Determines whether a value is a supported workflow action.
 *
 * @param {string} value Candidate action value.
 * @returns {boolean} True when the action is supported.
 */
function isWorkflowAction(value) {
  return getWorkflowActionNames().indexOf(String(value || "").trim()) !== -1;
}
