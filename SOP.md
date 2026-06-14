# HR Automation Dashboard SOP

![Web App hero page](SOP_hero.png)

*Hero page screenshot captured from the current HtmlService Web App shell with representative dashboard data.*

## How To Use This SOP

This SOP is written for two audiences:

- Reviewers who need to verify that the submitted dashboard works as required.
- Maintainers who need to set up, deploy, operate, or troubleshoot the workbook and Web App.

Start with **Quick Start** when setting up the project for the first time. Use **Daily Usage Guide** for normal HR operations. Use **Web App Deployment**, **Acceptance Verification**, and **Submission Checklist** before final handoff.

## Contents

- Quick Start
- Access Model At A Glance
- Architecture
- Daily Usage Guide
- Data Management
- Threshold Modification Guide
- Configuration Management
- Real-Time Reflection
- Trigger Installation
- Web App Deployment
- Workflow Actions
- HR Health Score
- Acceptance Verification
- Security Review
- Technical Maintenance
- Troubleshooting
- Troubleshooting Matrix
- Change Management
- Submission Checklist

## Quick Start

Use this sequence for a clean setup or final verification run:

1. Open the Apps Script project attached to the target Google Sheet.
2. Confirm the Apps Script files are saved with the current repository contents.
3. Run `setupWorkbook()` to create tabs, seed `_Config`, and protect generated sheets.
4. Run `runAllTests()` and confirm the `Logs` tab shows passing test output.
5. Run `installTriggers()` as the deployment owner.
6. Run `runFullPipeline("manual")`.
7. Deploy the Web App with the settings in **Web App Deployment**.
8. Share the underlying Sheet with `aadish.jain@techolution.com` as Viewer.
9. Confirm `AUTH_DEV_ALLOWLIST_ENABLED = false` in `webApp.gs`.
10. Complete the manual checks in **Acceptance Verification**.

## Access Model At A Glance

- The Web App must be deployed as **User accessing the web app**.
- The Web App must be available to **Anyone with Google account**.
- The server-side access gate only allows `@techolution.com` users.
- `AUTH_DEV_ALLOWLIST_ENABLED = false` for the current strict submission mode.
- `srmt2k6@gmail.com` is denied in strict submission mode.
- Unauthorized users receive only plain text: `access-denied`.
- Authorized users must also have Google Sheet access because the Web App runs as the visiting user.

## Architecture

The solution runs entirely on Google Sheets, Apps Script, HtmlService, and MailApp.

![Architecture diagram](Architecture-Diagram.png)

*Architecture diagram showing source tabs, Apps Script modules, automation triggers, generated outputs, Web App access control, and the real-time reflection pattern.*

System flow:

```text
Source Tabs
  India Employee Database
  US Employee Database
  RM Data
  Finance-Productivity
  Risk Report
  Offboarded Resources
        |
        v
Apps Script Pipeline
  config -> dataLoader -> validation -> alerts/metrics
        |
        +--> Sheet Surfaces: Dashboard, OrgChart, DrillDown
        +--> Web App API: getDashboardData(), getFilteredEmployees(), getLastPipelineStatus()
        +--> Notifications: HR alert digest and admin self-monitoring alerts
        +--> Audit Trail: Logs and Changelog
```

Module map:

- `config.gs`: tab names, aliases, config defaults, constants, and shared contracts.
- `dataLoader.gs`: header-agnostic source readers, normalization, schema drift warnings, and formula sanitization.
- `alerts.gs`: dashboard model, LWD alerts, probation alerts, attrition, risk summary, and HR Health Score.
- `dashboardRenderer.gs`, `orgChart.gs`, `drillDown.gs`: Google Sheet output surfaces.
- `pipeline.gs`: setup, trigger entrypoints, orchestration, changelog, and partial-failure handling.
- `workflows.gs`: HR workflow actions and idempotency stamps.
- `webApp.gs`, `index.html`, `client.html`, `styles.html`: authenticated HtmlService dashboard.
- `tests.gs`: runnable acceptance harness and QA helpers.

## Daily Usage Guide

HR users should edit source tabs only:

- `India Employee Database`
- `US Employee Database`
- `RM Data`
- `Finance-Productivity`
- `Risk Report`
- `Offboarded Resources`

Generated tabs are script-owned. They are refreshed by Apps Script and should not be manually edited:

- `Dashboard`
- `OrgChart`
- `DrillDown`
- `Logs`
- `Changelog`
- `_Config`

Daily workflow:

1. Add or update employee, RM, productivity, risk, or offboarding rows in the relevant source tab.
2. Installable edit/change triggers refresh the generated Sheet surfaces.
3. `Dashboard` shows KPIs, alerts, department breakdown, attrition, risk summary, data quality warnings, and HR Health Score.
4. `OrgChart` reflects reporting-manager relationships.
5. `DrillDown` filter cells can be edited to refresh filtered employee rows.
6. The Web App polls every 5 seconds and reads the same shared dashboard model as the Sheet dashboard.
7. `Logs` records readable operational messages. `Changelog` records one row per full pipeline run.

Rule of thumb: source tabs are for input; generated tabs are for review, audit, and reporting.

## Data Management

Use source tabs as the system of record. Do not add operational data directly to generated tabs such as `Dashboard`, `OrgChart`, or `DrillDown`.

Adding a new employee:

1. Add the employee row to `India Employee Database` or `US Employee Database`.
2. Fill all required identity fields, including employee ID, name, region, department, reporting manager, employment status, DOJ, and LWD when applicable.
3. Use an employee ID that matches `_Config.EMPLOYEE_ID_PATTERN`.
4. Use one of the supported employment statuses: `Confirmed`, `Under Probation`, or `Intern`.
5. Add the employee's reporting manager consistently so the `OrgChart` output can group the employee correctly.
6. If the employee has productivity data, add or update the matching row in `Finance-Productivity`.
7. If the employee belongs in RM reporting, add or update the matching row in `RM Data`.
8. Run `runFullPipeline("manual")` or wait for the installable edit trigger to refresh outputs.
9. Verify the employee appears in `Dashboard`, `DrillDown`, the Web App, and `OrgChart` if manager data is present.

Adding a new department:

1. Enter the new department name in the employee source row exactly as HR wants it reported.
2. Use the same spelling and capitalization for every employee in that department.
3. Run the pipeline and confirm the department appears in the department breakdown.
4. If the Web App drill-down filter is used, confirm the department appears in the department dropdown after refresh.

Adding a new project:

1. Add the project value in the relevant source column if the workbook includes a project or assignment field.
2. Keep project names consistent across employee, RM, productivity, and risk records.
3. If a project creates a new risk category or productivity grouping, update the relevant source rows in `Risk Report` or `Finance-Productivity`.
4. Run the pipeline and verify the project-related data is reflected in downstream dashboard summaries where applicable.

Data quality rules:

- Do not leave required IDs blank.
- Do not use formula-like text in user-entered fields; the loader sanitizes formula-like values before writing them back to generated surfaces.
- Do not create duplicate employee IDs.
- Do not manually edit generated dashboard rows to correct data. Fix the source row and rerun the pipeline.
- For test data, use QA test IDs only and clean them up with the QA helper rules in `tests.gs`.

## Threshold Modification Guide

Administrators update thresholds in `_Config`. The pipeline validates values and falls back to defaults when a setting is invalid.

Config keys:

- `LWD_ALERT_DAYS`: days before or after an intern LWD to show an LWD alert.
- `PROBATION_ALERT_DAYS`: days before confirmation date to show a probation alert.
- `PROBATION_DURATION_DAYS`: days after DOJ used to compute confirmation date.
- `PRODUCTIVITY_TARGET`: productivity score below which an employee is flagged.
- `HR_ALERT_EMAIL`: alert digest recipient.
- `ADMIN_ALERT_EMAIL`: self-monitoring alert recipient.
- `PIPELINE_TRIGGER_HOUR`: daily trigger hour.
- `EMPLOYEE_ID_PATTERN`: validation regex for employee IDs.

After changing `_Config`, run `runFullPipeline("manual")` or edit a source tab row to refresh outputs.

## Configuration Management

Configuration changes should be made deliberately because they affect both Sheet surfaces and the Web App.

Thresholds:

1. Open `_Config`.
2. Update the relevant key, such as `LWD_ALERT_DAYS`, `PROBATION_ALERT_DAYS`, `PROBATION_DURATION_DAYS`, or `PRODUCTIVITY_TARGET`.
3. Keep values numeric where the setting expects a number.
4. Run `runFullPipeline("manual")`.
5. Check `Logs` for warnings and confirm the dashboard values changed as expected.

Dropdown menus:

1. Source-tab dropdowns should use the canonical values expected by the loader and validators.
2. Employment status dropdowns should stay aligned to `Confirmed`, `Under Probation`, and `Intern`.
3. Drill-down filters are generated by script from normalized employee data and should not be manually rebuilt.
4. If a new dropdown value is required, update validation rules and aliases in code first, then test with `runAllTests()`.

Conditional formatting:

1. Dashboard conditional formatting is script-rendered and may be overwritten on the next render.
2. Make formatting changes in `dashboardRenderer.gs`, `drillDown.gs`, or the relevant renderer module instead of manually editing generated tabs.
3. Keep alert colors aligned to severity: overdue/danger and imminent/warning.
4. After changing formatting logic, run `runFullPipeline("manual")` and confirm protections still apply.

Protected ranges:

- `Dashboard`, `OrgChart`, `Logs`, `Changelog`, and `_Config` are protected by `setupWorkbook()`.
- Only designated `DrillDown` filter cells should remain editable for HR users.
- If protections are lost, rerun `setupWorkbook()` and review the protected ranges before handoff.

## Real-Time Reflection

Sheet reflection:

- Source-tab edits route through `handleInstallableEdit(e)`.
- Source-tab structure changes route through `handleInstallableChange(e)`.
- `DrillDown` filter edits refresh only the filtered output.
- Daily scheduled runs use `runDailyPipeline()`.

Web App reflection:

- `doGet(e)` checks the signed-in Google account before creating any HtmlService template.
- Unauthorized users receive a plain text response containing only `access-denied`; no dashboard shell, CSS, client JavaScript, title, or app context is sent.
- Authorized users receive the HtmlService shell.
- `getDashboardData()` loads config, loads source data, builds the shared dashboard model, escapes returned strings, and sends the payload to the browser.
- `getFilteredEmployees(filters)` applies the same drill-down filters used by the Sheet surface.
- The browser polls `getDashboardData()` every 5 seconds.

Partial failures are isolated. For example, MailApp quota errors are logged and surfaced as warnings, but dashboard rendering continues.

## Trigger Installation

Run `setupWorkbook()` once before trigger installation to create tabs, seed `_Config`, and protect generated surfaces.

Run `installTriggers()` once as the deployment owner. It installs:

- installable `onEdit` trigger
- installable `onChange` trigger
- daily time-based trigger for `runDailyPipeline()`

Use `removeProjectTriggers()` before reinstalling triggers during maintenance.

Recommended setup sequence:

1. Open the Apps Script project attached to the workbook.
2. Confirm `appsscript.json` uses V8 and the required scopes.
3. Run `setupWorkbook()`.
4. Run `runAllTests()`.
5. Run `installTriggers()`.
6. Run `runFullPipeline("manual")`.
7. Review `Logs`, `Changelog`, `Dashboard`, `OrgChart`, and `DrillDown`.

## Web App Deployment

Deploy from Apps Script as a Web App with `doGet(e)` as the entrypoint.

Required deployment settings:

- Execute as: User accessing the web app
- Who has access: Anyone with Google account
- Manifest webapp setting: `executeAs` = `USER_ACCESSING`, `access` = `ANYONE`
- Application access gate: only `@techolution.com` accounts are allowed.
- Development bypass status: `AUTH_DEV_ALLOWLIST_ENABLED = false`; `srmt2k6@gmail.com` is denied in the current submission configuration.
- Client API functions: `getDashboardData()`, `getFilteredEmployees(filters)`, and `getLastPipelineStatus()`

Important permission note:

Because the Web App executes as the visiting user, every allowed user must also have access to the underlying Google Sheet. Share the workbook with the reviewer `aadish.jain@techolution.com` as Viewer before final verification.

Deployment steps:

1. Apps Script > Deploy > New deployment.
2. Select type: Web app.
3. Description: `HR Automation Dashboard`.
4. Execute as: User accessing the web app.
5. Who has access: Anyone with Google account.
6. Deploy and copy the Web App URL.
7. Open the URL as an allowed `@techolution.com` user with Sheet access and confirm the dashboard loads.
8. Open the URL as a non-Techolution Google account and confirm the page contains only `access-denied`.
9. View source/page content for the unauthorized account and confirm there is no dashboard HTML, CSS, client JavaScript, app title, or HR/Techolution context.
10. Record the deployed URL in the submission notes.

Before final submission, confirm `AUTH_DEV_ALLOWLIST_ENABLED = false` in `webApp.gs`, save, and deploy a new Web App version.

No stable deployed Web App URL is stored in source control because Apps Script generates it at deployment time.

## Workflow Actions

Workflow action columns are added to employee source tabs when missing.

Supported actions:

- `Start Offboarding`
- `Schedule PIP`
- `Approve Confirmation`

Each action is idempotent. After an action executes, the row receives execution timestamp and result stamps. Re-selecting the same action on the same stamped row does not resend email or repeat side effects.

## HR Health Score

The HR Health Score is a 0-100 composite score built from the shared dashboard model. Components are exposed separately in the Sheet Dashboard and Web App.

Score weights:

- Attrition: 30%
- Open alerts: 25%
- Active risks: 25%
- Productivity average: 20%

Component formulas:

- Attrition component = `max(0, 100 - attritionRate * 5)`
- Open alerts component = `max(0, 100 - alertCount * 10)`
- Active risks component = `max(0, 100 - activeRiskCount * 15)`
- Productivity component = productivity average

Final score:

```text
sum(componentScore * componentWeight / 100)
```

The final result is rounded and clamped between 0 and 100.

## Acceptance Verification

Run `runAllTests()` from Apps Script after deploying the latest code. The harness writes one `PASS ...` or `FAIL ...` row per test to `Logs`, followed by a summary and acceptance report line.

Automated checks covered by `runAllTests()`:

- LWD alerts
- Probation alerts
- Current-quarter attrition math
- Column reorder and alias resilience
- Config threshold changes
- Workflow idempotency
- Formula sanitization
- HtmlService escaping
- Web App payload and filter behavior
- Web App email-domain access rules
- Opaque `access-denied` denied-response text
- Partial MailApp failure behavior

Manual checks to complete in the workbook and deployed Web App:

- Add three QA employees using IDs generated by `createQaTestDataSet_()` and confirm Sheet Dashboard and Web App counts update.
- Change a probation employee DOJ and confirm probation alerts update.
- Delete a QA offboarded row and confirm attrition updates.
- Change `_Config` thresholds and confirm alert/productivity counts update.
- Enter an invalid employment status and confirm a readable validation message appears.
- Confirm `AUTH_DEV_ALLOWLIST_ENABLED = false` in `webApp.gs`.
- Open the deployed Web App as `srmt2k6@gmail.com` and confirm the page contains only `access-denied`.
- Open the deployed Web App as a real `@techolution.com` account with Sheet access and confirm the dashboard loads.
- Open the deployed Web App as a non-Techolution Google account and confirm the page contains only `access-denied`.
- View source/page content for an unauthorized account and confirm it contains no dashboard HTML, CSS, client JavaScript, app name, HR text, Techolution text, or user email.

QA cleanup must only remove rows where `isQaTestEmployeeId_(employeeId)` returns true. Do not delete or overwrite non-test employee IDs.

## Security Review

Reviewed controls:

- No credentials, API keys, tokens, passwords, or service account secrets are stored in source code.
- No `UrlFetchApp`, external database, external API, or third-party network integration is used.
- MailApp is the only outbound integration.
- Compensation fields are loaded for internal normalization but are not rendered into dashboard rows, Web App public employee rows, logs, or HR alert digest bodies.
- HtmlService responses recursively escape Sheet-provided strings before returning payloads to the browser.
- Inline initial payload JSON escapes `<`, `>`, `&`, U+2028, and U+2029 to prevent script-tag breakout.
- Client rendering uses `textContent`; it does not use `innerHTML`, `document.write`, `eval`, or dynamic code execution.
- Generated tabs and `_Config` are protected by `setupWorkbook()`.
- Web App deployment requires a Google account and then applies an Apps Script-native server-side email-domain gate.
- Unauthorized `doGet(e)` requests return plain text `access-denied` before any HtmlService dashboard shell is created.
- Browser-callable server functions (`getDashboardData()`, `getFilteredEmployees(filters)`, and `getLastPipelineStatus()`) also enforce the access gate.
- Web App read paths suppress Sheet log writes so viewer requests do not require edit access to `Logs`.
- Broad iframe embedding is not enabled in code.

Reviewer access:

- Grant `aadish.jain@techolution.com` view-only workbook access for final review.
- Grant other workbook reviewers view-only access unless they are expected to run admin setup.
- Grant Apps Script edit access only to maintainers.
- Deployment owner should be a controlled Workspace account, not a personal account.

## Technical Maintenance

Maintain the Apps Script project through the repository first, then copy or push the approved source into Apps Script.

Code maintenance guidelines:

1. Keep module boundaries stable. Business calculations belong in `alerts.gs`; loading belongs in `dataLoader.gs`; rendering belongs in renderer modules; Web App access and API payloads belong in `webApp.gs`.
2. Do not hardcode dates, reviewer emails, or thresholds in business logic unless the SRS explicitly requires the value.
3. Keep source loading header-agnostic. Do not switch to fixed column indexes for source tabs.
4. Preserve XSS safety in HtmlService. Use `textContent` and safe DOM construction in `client.html`.
5. Preserve the server-side domain gate in `webApp.gs`.
6. Keep `AUTH_DEV_ALLOWLIST_ENABLED = false` before strict final submission.
7. Do not add external APIs, CDNs, or third-party services unless the security model is reviewed and documented.
8. When changing Sheet rendering, verify protected tabs remain protected after render.
9. When changing workflow actions, keep them idempotent and log the initiating user when available.

Maintenance workflow:

1. Edit source files in git.
2. Run static checks such as JavaScript parsing and `git diff --check`.
3. Run `runAllTests()` in Apps Script after copying or pushing changes.
4. Run `runFullPipeline("manual")`.
5. Review `Logs`, `Changelog`, generated Sheet surfaces, and the Web App.
6. Commit and push only after validation passes.

## Troubleshooting

Check `Logs` first. Messages are plain English and include INFO, WARN, or ERROR levels.

Common issues:

- Missing source tab: run `setupWorkbook()`.
- Missing or renamed header: restore the canonical header or add an alias in `config.gs`.
- Invalid config value: correct the `_Config` row; the pipeline falls back to defaults until fixed.
- Mail quota exceeded: dashboard rendering continues; digest failure is logged and admin self-monitoring is attempted.
- Web App shows an error view: open `Logs`, fix the reported workbook/config/source issue, and refresh.
- Web App shows only `access-denied`: sign in with an allowed `@techolution.com` account, confirm `AUTH_DEV_ALLOWLIST_ENABLED` is set as intended, and confirm the signed-in account has access to the underlying Sheet.
- Allowed Web App user sees a Sheet permission error: share the workbook with that user as Viewer or Editor as appropriate.
- Trigger did not run: run `removeProjectTriggers()`, then `installTriggers()` as the deployment owner.

When troubleshooting access issues, separate the checks:

1. Is the signed-in Google account allowed by the domain gate?
2. Does that same account have permission to open the underlying Sheet?
3. Was the latest Apps Script version deployed after changing `webApp.gs`?

## Troubleshooting Matrix

Use this symptom-to-resolution guide during review or support.

- Symptom: `Dashboard` is missing or blank.
  Cause: workbook setup has not run, source tabs are missing, or the pipeline failed before render.
  Resolution: run `setupWorkbook()`, confirm source tabs exist, run `runFullPipeline("manual")`, and review `Logs`.

- Symptom: Web App shows only `access-denied`.
  Cause: signed-in account is not allowed by the domain gate or strict mode is blocking the dev allowlist.
  Resolution: sign in with a real `@techolution.com` account, confirm `AUTH_DEV_ALLOWLIST_ENABLED = false` is intended, and redeploy after any auth change.

- Symptom: Allowed Web App user sees a Sheet permission error.
  Cause: Web App runs as the visiting user, and that user does not have access to the underlying Sheet.
  Resolution: share the workbook with the user as Viewer or Editor as appropriate.

- Symptom: New employee does not appear in dashboard totals.
  Cause: row is in the wrong source tab, employee ID is invalid, required headers are missing, or employment status is unsupported.
  Resolution: fix the source row, confirm headers, check `_Config.EMPLOYEE_ID_PATTERN`, and rerun the pipeline.

- Symptom: Department breakdown looks split into duplicate departments.
  Cause: inconsistent department spelling or capitalization.
  Resolution: standardize department names in source rows and rerun the pipeline.

- Symptom: Drill-down filters do not update.
  Cause: filter cells were edited outside the designated range, script protections changed, or the Web App/server call failed.
  Resolution: rerun `setupWorkbook()`, refresh filters, check browser console for Web App errors, and review `Logs`.

- Symptom: Alerts are missing or too broad.
  Cause: thresholds in `_Config` are incorrect or dates are malformed.
  Resolution: verify `LWD_ALERT_DAYS`, `PROBATION_ALERT_DAYS`, and date values, then run `runFullPipeline("manual")`.

- Symptom: HR Health Score seems incorrect.
  Cause: attrition, alert count, risk count, or productivity inputs changed.
  Resolution: review the component scores in the dashboard model and compare against the formulas in `HR Health Score`.

- Symptom: Email digest does not send.
  Cause: no active alerts, missing digest recipient, or MailApp quota/failure.
  Resolution: confirm active alerts exist, verify `HR_ALERT_EMAIL`, check MailApp quota, and review `Logs`.

- Symptom: Manual edits to generated tabs disappear.
  Cause: generated tabs are rewritten by script.
  Resolution: make changes in source tabs or renderer code, then rerun the pipeline.

- Symptom: Apps Script deployment uses an old UI or old auth behavior.
  Cause: a new Web App version was not deployed after code changes.
  Resolution: deploy a new version from Apps Script and verify the deployment URL.

## Change Management

Use one git checkpoint per completed pass. Do not push mid-pass.

Recommended release process:

1. Run `runAllTests()`.
2. Run static parser checks locally when editing source files.
3. Deploy Apps Script.
4. Run the manual acceptance checks.
5. Commit with the pass checkpoint message.
6. Push to `origin/main`.
7. Record final Web App URL and workbook URL in submission notes outside source control.

## Submission Checklist

Use this as the final handoff gate:

- Source code pushed to GitHub.
- Apps Script project opened without syntax errors.
- `setupWorkbook()` completed.
- `installTriggers()` completed.
- `runAllTests()` passed.
- Manual acceptance checks completed.
- Web App deployed with the settings above.
- `AUTH_DEV_ALLOWLIST_ENABLED = false` for strict final submission.
- Reviewer `aadish.jain@techolution.com` has view-only access to the workbook.
- Reviewer has Web App access through the `@techolution.com` domain gate.
- `SOP.pdf` generated from this SOP.
