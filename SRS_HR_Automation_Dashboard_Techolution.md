# Software Requirements Specification

**HR Automation Dashboard**
Google Workspace · Apps Script · HtmlService

---

| Field | Value |
|---|---|
| Document ID | SRS-HRD-2025-001 |
| Version | 1.0 |
| Status | Draft – For Review |
| Prepared By | Srimanth (AI Automation Intern Candidate) |
| Prepared For | Techolution — AI Automation Intern Assignment |
| Date | June 2025 |
| Stack | Google Sheets + Apps Script + HtmlService |

---

## Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | June 2025 | Srimanth | Initial Draft |

---

## Table of Contents

1. Introduction & Purpose
2. System Overview
3. Stakeholders & User Roles
4. Assumptions & Constraints
5. Functional Requirements (FR)
   - 5.1 Source Data Management
   - 5.2 Sheet Dashboard
   - 5.3 Web Application
   - 5.4 Real-Time Reflection
   - 5.5 Alerts & Notifications
   - 5.6 Automation & Operations
   - 5.7 Workflow Engine
   - 5.8 HR Health Score
   - 5.9 Drill-Down & Filters
   - 5.10 Test Harness
6. Non-Functional Requirements (NFR)
   - 6.1 Performance
   - 6.2 Reliability & Availability
   - 6.3 Scalability
   - 6.4 Maintainability
   - 6.5 Usability
7. Security Requirements (SEC)
   - 7.1 Authentication & Authorization
   - 7.2 Data Protection
   - 7.3 Audit & Logging
   - 7.4 Input Validation & Injection Prevention
   - 7.5 Operational Security
8. Data Requirements
9. Interface Requirements
10. Configuration & Thresholds
11. Verification & Acceptance Protocol
12. Out of Scope
13. Glossary

---

## 1. Introduction & Purpose

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete requirements for the Techolution HR Automation Dashboard (HRD). It covers both surfaces of the system — the Google Sheets script-rendered dashboard and the deployed Apps Script web application — including all functional requirements, non-functional requirements, security controls, data requirements, and acceptance criteria.

### 1.2 Product Scope

The HRD system automates the visibility and alerting lifecycle for Techolution's HR team across India and US employee databases. It eliminates manual refresh, manual report generation, and ad hoc spreadsheet lookups by providing a self-updating, trigger-driven system that surfaces KPIs, alerts, attrition trends, risk data, and org structure in real time.

### 1.3 Definitions

| Term | Definition |
|---|---|
| HRD | HR Automation Dashboard — the full system described in this SRS. |
| Sheet Dashboard | The Apps Script-rendered dashboard tab inside the Google Spreadsheet workbook. |
| Web App | The deployed Apps Script HtmlService web application, accessible via a Google web app URL. |
| Source Tabs | The raw data tabs: India Employee Database, US Employee Database, RM Data, Finance-Productivity, Risk Report, Offboarded Resources. |
| _Config Tab | A dedicated configuration tab storing all threshold values and recipient lists. |
| LWD | Last Working Day — relevant for intern exit tracking. |
| Probation Period | 180 calendar days from DOJ. Confirmation date = DOJ + 180. |
| onEdit Trigger | Apps Script installable trigger that fires when a cell value changes in the Sheet. |
| Pipeline Run | A full execution of all dashboard-rendering, alert-evaluation, and logging logic. |
| Header-Agnostic | Column lookup by header name (not index), making the system resilient to column reordering. |

---

## 2. System Overview

### 2.1 Architecture Summary

The HRD is a single Google Spreadsheet workbook that serves as both the database and the computation engine. Apps Script acts as the orchestration layer — reading from Source Tabs, writing to the Dashboard Tab, serving the Web App, and managing triggers. There is no external database, no third-party middleware, and no server infrastructure beyond Google's Apps Script runtime.

| Layer | Component |
|---|---|
| Data Layer | Google Sheets — India DB, US DB, RM Data, Finance-Productivity, Risk Report, Offboarded Resources, _Config, Logs, Changelog |
| Logic Layer | Apps Script — modular .gs files: config.gs, dataLoader.gs, dashboardRenderer.gs, webApp.gs, alerts.gs, orgChart.gs, drillDown.gs, workflows.gs, tests.gs |
| Trigger Layer | onEdit (installable), time-based daily trigger, onChange for schema drift detection |
| Surface 1 | Sheet Dashboard — script-rendered Dashboard tab + OrgChart tab + DrillDown tab |
| Surface 2 | Web App — HtmlService deployed page, authenticated via Google, real-time data fetch |
| Notification Layer | MailApp — alert digest emails to HR, self-monitoring alerts to admin |

### 2.2 Data Flow

HR edits a Source Tab → onEdit trigger fires → dataLoader reads affected rows → dashboardRenderer writes to Dashboard tab → Web App reads from source tabs on next request. The Logs tab receives an entry for every trigger execution. The Changelog tab receives a summary entry for every pipeline run.

### 2.3 Deployment Model

The system is deployed entirely within Google Workspace. The Google Sheet is shared with editor access for HR users and viewer access for the submitting reviewer. The Web App is deployed with **Execute as: Me** and **Who has access: Anyone within the organization who is logged in with Google**.

---

## 3. Stakeholders & User Roles

| Role | Access Level | Primary Interactions |
|---|---|---|
| HR Operator | Sheet Editor + Web App Viewer | Enters/edits employee data in Source Tabs; views Dashboard Tab and Web App; never runs scripts. |
| HR Manager | Sheet Editor + Web App Viewer | Monitors KPIs, alerts, attrition; reviews Risk Register; uses Drill-Down filters. |
| Finance Team | Sheet Viewer | Reviews CTC and productivity data; read-only access to Finance-Productivity tab. |
| System Admin / Developer | Sheet Owner + Script Editor | Deploys apps, manages triggers, updates code, monitors Logs and Changelog. |
| Reviewer (Techolution) | Sheet Viewer + Web App Viewer | Executes verification protocol; tests real-time reflection, auth, and alert accuracy. |

---

## 4. Assumptions & Constraints

### 4.1 Assumptions

- All HR users have active Google Workspace accounts within the same organization domain.
- The starter Sheet's tab structure and approximate column headers are stable at launch; the system is built to survive column reordering, not tab deletion.
- MailApp daily quota (100 emails/day for free accounts, 1500 for Workspace) is sufficient for the alert digest pattern.
- Apps Script execution time limits (6 min per run) are sufficient for the current headcount volumes.
- Google Workspace triggers (installable onEdit, time-based) are available and will not be revoked by admin policy.
- Network connectivity to Google APIs is available without interruption.

### 4.2 Constraints

- Stack is strictly limited to Google Sheets + Apps Script + HtmlService. No external databases, no third-party APIs except MailApp.
- The system must function without any HR user ever opening the Apps Script editor.
- All thresholds and configuration must live in _Config tab — no magic numbers in code.
- No hardcoded dates anywhere in the codebase — all date logic derives from `new Date()` / `TODAY()`.
- Column lookups must be header-name-based, not index-based, in all .gs files.
- The SOP must be submitted as a PDF alongside the Sheet link and Web App URL.

### 4.3 Dependencies

- Google Apps Script runtime (V8 engine)
- Google Sheets API (SpreadsheetApp)
- Google HtmlService (for Web App)
- MailApp (for email alerts)
- Google Workspace authentication (OAuth2 via Apps Script's implicit flow)

---

## 5. Functional Requirements

> **Priority Legend:** `MUST` = mandatory, submission fails without it | `SHOULD` = strongly recommended | `MAY` = nice-to-have

### 5.1 Source Data Management (FR-DM)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-DM-01 | The system shall read employee data from the India Employee Database and US Employee Database tabs using header-name lookup, not column index. | MUST | Brief §4.5 |
| FR-DM-02 | The system shall auto-discover the current month column in the RM Data tab without hardcoding any month value. | MUST | Brief §3 |
| FR-DM-03 | The system shall read the Risk Report, Offboarded Resources, Finance-Productivity, and _Config tabs using the same header-agnostic pattern. | MUST | Brief §3 |
| FR-DM-04 | The system shall detect schema drift (column addition, header rename) in source tabs and surface a human-readable warning in the Logs tab rather than throwing a stack trace. | SHOULD | Brief §4.5 |
| FR-DM-05 | Renaming any two columns in the India Employee Database tab must not break data loading on either surface. | MUST | Brief §6 |

### 5.2 Sheet Dashboard (FR-SD)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-SD-01 | A dedicated Dashboard tab shall exist where every cell is written by Apps Script code, not by Sheet formulas alone. | MUST | Brief §4.1 |
| FR-SD-02 | The Dashboard shall contain a KPI strip showing: total headcount by region (India / US), headcount by employment status (Confirmed / Under Probation / Intern), count of productivity flags, and count of active risk items. | MUST | Brief §4.1 |
| FR-SD-03 | The Dashboard shall display an LWD Alerts section listing all interns with Last Working Day within 45 days, including interns whose LWD has already passed within the current period. | MUST | Brief §4.1 |
| FR-SD-04 | The Dashboard shall display a Probation Alerts section listing all employees within 30 days of their confirmation date (DOJ + 180 days). | MUST | Brief §4.1 |
| FR-SD-05 | The Dashboard shall include a Department Breakdown section showing headcount and status distribution per department. | MUST | Brief §4.1 |
| FR-SD-06 | The Dashboard shall include a Quarterly Attrition section computing live attrition rate from the Offboarded Resources tab for the current quarter. The rate shall recalculate when a row is deleted from Offboarded Resources. | MUST | Brief §4.1 |
| FR-SD-07 | The Dashboard shall include a Risk Register Summary section derived from the Risk Report tab. | MUST | Brief §4.1 |
| FR-SD-08 | A separate OrgChart tab shall render the organizational hierarchy rebuilt from the Reporting Manager column. The chart shall reflect manager changes within seconds of an edit without manual redraw. | MUST | Brief §4.1 |
| FR-SD-09 | A DrillDown tab shall provide filter controls for Region, Department, Reporting Manager, and Employment Status at minimum. Filters shall apply on edit without HR clicking a button. | MUST | Brief §4.1 |
| FR-SD-10 | The Dashboard tab shall be fully reproducible by running the render function against the current source data — no manual cell edits required. | MUST | Brief §4.1 |

### 5.3 Web Application (FR-WA)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-WA-01 | The system shall deploy a web app via Apps Script HtmlService, accessible at a persistent Google web app URL. | MUST | Brief §4.2 |
| FR-WA-02 | The web app shall require Google Sign-In. Unauthenticated requests shall be redirected to a Google login page. Access shall be restricted to authenticated Workspace users. | MUST | Brief §4.2 |
| FR-WA-03 | The web app shall display all dashboard sections from FR-SD-02 through FR-SD-07, including KPIs, alerts, org chart, department breakdown, attrition, risk register, and drill-down with filters. | MUST | Brief §4.2 |
| FR-WA-04 | The web app visual design shall be appropriate for executive viewing — clean layout, clear hierarchy, recognizable as a dashboard rather than a plain HTML page. | MUST | Brief §4.2 |
| FR-WA-05 | The web app shall read all displayed data from Source Tabs on each request or via a lightweight refresh mechanism. Stale cached data must not persist beyond one pipeline run cycle. | MUST | Brief §4.2 |
| FR-WA-06 | Opening the web app URL in an incognito window with a valid Google account shall display the dashboard without requiring script editor access. | MUST | Brief §7 |

### 5.4 Real-Time Reflection (FR-RT)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-RT-01 | When HR adds a new employee row to a Source Tab, both the Sheet Dashboard and the Web App shall reflect the new employee within seconds — without HR clicking Refresh or running any script. | MUST | Brief §4.3 |
| FR-RT-02 | When HR changes an employee's status in a Source Tab, both surfaces shall reflect the updated status within seconds. | MUST | Brief §4.3 |
| FR-RT-03 | When HR updates a Risk Report entry, both surfaces shall reflect the change within seconds. | MUST | Brief §4.3 |
| FR-RT-04 | When HR adds a row to Offboarded Resources, both surfaces shall reflect updated quarterly attrition within seconds. | MUST | Brief §4.3 |
| FR-RT-05 | Adding 3 new employees (1 Intern with LWD in 20 days, 1 Probationer with confirmation in 25 days, 1 Confirmed) shall cause both surfaces to reflect all 3 records within seconds, with the Intern surfacing in LWD Alerts and the Probationer in Probation Alerts. | MUST | Brief §6 |
| FR-RT-06 | Changing a Probationer's DOJ shall trigger recalculation of the confirmation date and update the Probation Alert state on both surfaces without manual action. | MUST | Brief §6 |
| FR-RT-07 | Deleting a row from Offboarded Resources shall cause quarterly attrition to recalculate from live data on both surfaces. | MUST | Brief §6 |
| FR-RT-08 | The implementation pattern for real-time reflection (onEdit trigger, polling, cache layer, etc.) shall be documented in the SOP. | MUST | Brief §4.3 |

### 5.5 Alerts & Notifications (FR-AL)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-AL-01 | The system shall surface Intern LWD alerts for any intern with LWD within the threshold defined in _Config (default: 45 days). Both upcoming and just-passed LWD cases must be visible. | MUST | Brief §4.4 |
| FR-AL-02 | The system shall surface Probation alerts for any employee within the confirmation-imminent threshold in _Config (default: 30 days) of their confirmation date (DOJ + 180 days). | MUST | Brief §4.4 |
| FR-AL-03 | The system shall send an email digest to the recipient(s) defined in _Config on each pipeline run, summarizing all active alerts. No email shall be sent if no alerts are active. | MUST | Brief §4.4 |
| FR-AL-04 | All alert thresholds (LWD window, probation window, probation duration, productivity target, email recipients) shall be stored in _Config. Changing a value must take effect on the next pipeline run without any code change. | MUST | Brief §4.4 |
| FR-AL-05 | The email digest format shall be human-readable, listing each alert category with employee name, ID, department, and the relevant date. | SHOULD | Brief §4.4 |

### 5.6 Automation & Operations (FR-AO)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-AO-01 | A time-based daily trigger shall execute the full pipeline run (data load → dashboard render → alert evaluation → email digest → changelog append). | MUST | Brief §4.5 |
| FR-AO-02 | Installable onEdit triggers shall execute event-driven updates to both surfaces when source data changes. | MUST | Brief §4.5 |
| FR-AO-03 | An append-only Logs tab shall capture every pipeline run, trigger execution, alert fired, and error, with columns: Timestamp, Level (INFO / WARN / ERROR), and Message. | MUST | Brief §4.5 |
| FR-AO-04 | The Logs tab shall show real execution history spanning the development period — not a single freshly-generated row at submission time. | MUST | Brief §6 |
| FR-AO-05 | No hardcoded dates shall exist anywhere in the codebase. All date math shall derive from `new Date()` or `TODAY()`. | MUST | Brief §4.5 |
| FR-AO-06 | All column lookups in all .gs files shall use header-name-based mapping. Reordering columns in any source tab must not break the pipeline. | MUST | Brief §4.5 |
| FR-AO-07 | When HR enters invalid data (wrong type, missing required field), the system shall surface a clear human-readable message in the Sheet. No raw JavaScript stack traces shall be shown to HR users. | MUST | Brief §4.5 |
| FR-AO-08 | The system shall detect its own failures: missed daily runs, MailApp quota exhaustion, and schema drift. Detected failures shall be logged and surfaced, not silently swallowed. | SHOULD | Brief §5 |
| FR-AO-09 | A Changelog tab shall be appended on every pipeline run with: Run ID, Run Duration (ms), Key Metrics (headcount, alert count, attrition rate), and Trigger Source (time-based / onEdit). | SHOULD | Brief §5 |

### 5.7 Workflow Engine (FR-WF)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-WF-01 | Source tabs shall expose dropdown action columns (e.g., Start Offboarding, Schedule PIP, Approve Confirmation) that fire onEdit when HR selects a value. | SHOULD | Brief §5 |
| FR-WF-02 | Each workflow action shall send the relevant notification email, stamp the triggering row with an execution timestamp, append a log entry, and guard against duplicate execution on the same row. | SHOULD | Brief §5 |
| FR-WF-03 | Workflow actions shall be idempotent — re-selecting the same action on an already-stamped row shall not re-send emails or duplicate log entries. | SHOULD | Brief §5 |

### 5.8 HR Health Score (FR-HS)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-HS-01 | The system shall compute and display a composite HR Health Score on the Dashboard and Web App, derived from: attrition rate, open alert count, risk item count, and productivity averages. | SHOULD | Brief §5 |
| FR-HS-02 | The Health Score formula shall be fully documented in the SOP, including the weight of each component and the scoring scale. | SHOULD | Brief §5 |
| FR-HS-03 | The Health Score shall be audit-friendly — each component value that feeds into the score must be separately visible on the Dashboard. | SHOULD | Brief §5 |

### 5.9 Drill-Down & Filters (FR-DD)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-DD-01 | The DrillDown tab shall provide dropdown filters for: Region (India / US / All), Department, Reporting Manager, and Employment Status. | MUST | Brief §4.1 |
| FR-DD-02 | Changing a filter value shall immediately update the displayed data on the DrillDown tab without HR clicking a Run or Apply button. | MUST | Brief §4.1 |
| FR-DD-03 | The Web App shall include the same drill-down and filter functionality as the Sheet DrillDown tab. | MUST | Brief §4.2 |

### 5.10 Test Harness (FR-TH)

| FR-ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-TH-01 | A `tests.gs` file (or QA tab) shall contain assertion functions that verify: LWD alert logic correctness, attrition math accuracy, and column-rename resilience. | SHOULD | Brief §5 |
| FR-TH-02 | The test harness shall be runnable from the Apps Script editor with pass/fail output logged to the Logs tab. | SHOULD | Brief §5 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| NFR-ID | Requirement |
|---|---|
| NFR-P-01 | Sheet Dashboard shall reflect source data changes within 5 seconds of an onEdit trigger firing for typical edits (single row add/modify). |
| NFR-P-02 | Web App initial load shall complete within 3 seconds for datasets up to 500 employees per region. |
| NFR-P-03 | Full pipeline run (daily trigger) shall complete within the Apps Script 6-minute execution limit for datasets up to 1000 total employees. |
| NFR-P-04 | Email digest generation and dispatch shall complete within 30 seconds of pipeline run initiation. |

### 6.2 Reliability & Availability

| NFR-ID | Requirement |
|---|---|
| NFR-R-01 | The system shall not lose data. Script errors shall be caught, logged, and surfaced — never silently discarded. |
| NFR-R-02 | The daily trigger shall run every day. A missed run shall be detected on the next run and logged with level ERROR. |
| NFR-R-03 | Partial execution failures (e.g., MailApp quota exceeded) shall not prevent the dashboard from rendering. Each pipeline stage shall fail independently. |
| NFR-R-04 | The Web App URL shall remain accessible 24/7 subject to Google's platform SLA. Deployments shall use a stable 'current' URL, not version-specific URLs. |

### 6.3 Scalability

| NFR-ID | Requirement |
|---|---|
| NFR-S-01 | The column-lookup pattern shall scale to source tabs with up to 50 columns without performance degradation. |
| NFR-S-02 | The system shall support up to 1000 total employee records (India + US combined) without hitting Apps Script memory limits. |
| NFR-S-03 | Adding a new source tab or a new department shall require only _Config tab changes and minor code additions — no architectural rework. |

### 6.4 Maintainability

| NFR-ID | Requirement |
|---|---|
| NFR-M-01 | The Apps Script project shall be organized into separate files: `config.gs`, `dataLoader.gs`, `dashboardRenderer.gs`, `webApp.gs`, `alerts.gs`, `orgChart.gs`, `drillDown.gs`, `workflows.gs`, `tests.gs`. Single-file submissions are disqualified. |
| NFR-M-02 | Every function shall have a JSDoc comment describing its purpose, parameters, and return value. |
| NFR-M-03 | The Changelog tab shall retain one row per pipeline run indefinitely to enable 30-day trend analysis. |
| NFR-M-04 | All configuration values (thresholds, recipients, column names) shall be centralized in _Config. Changing a threshold requires zero code changes. |
| NFR-M-05 | The SOP shall include an architecture diagram (input → script → output, with each component named), daily usage guide, threshold modification guide, troubleshooting section, and change management guidance. |

### 6.5 Usability

| NFR-ID | Requirement |
|---|---|
| NFR-U-01 | HR users shall never need to open the Apps Script editor, click Refresh, or manually trigger any script. |
| NFR-U-02 | All validation error messages shown to HR shall be written in plain English — no technical jargon, no stack traces. |
| NFR-U-03 | The Web App shall be navigable on a standard 1920×1080 desktop browser without horizontal scrolling. |
| NFR-U-04 | The Sheet Dashboard tab shall use conditional formatting and color-coding to visually distinguish alert states (e.g., red for overdue LWD, amber for imminent). |

---

## 7. Security Requirements

### 7.1 Authentication & Authorization

| SEC-ID | Requirement |
|---|---|
| SEC-AA-01 | The Web App shall require Google Sign-In before rendering any content. Unauthenticated GET requests shall receive a redirect to Google's OAuth endpoint, not a raw 401 or blank page. |
| SEC-AA-02 | Web App access shall be restricted to users with active Google Workspace accounts. The Apps Script deployment shall be configured as "Anyone within the organization who is signed in with Google". |
| SEC-AA-03 | The Apps Script project shall execute as the authorized developer account ("Execute as: Me"), not as the accessing user, to ensure the script always has Sheet access regardless of viewer permissions. |
| SEC-AA-04 | HR users with Sheet Editor access can modify Source Tabs. The Dashboard, OrgChart, DrillDown, Logs, and Changelog tabs shall be protected (sheet protection) to prevent accidental manual edits. Only the Apps Script service account can write to these tabs. |
| SEC-AA-05 | The Sheet shall be shared with view-only access for the Techolution reviewer (aadish.jain@techolution.com). Write access shall be limited to HR users and the script service account. |

### 7.2 Data Protection

| SEC-ID | Requirement |
|---|---|
| SEC-DP-01 | All employee data (CTC, Allocation %, personal identifiers, health flags) shall reside within Google's infrastructure. No data shall be transmitted to third-party services or external APIs. |
| SEC-DP-02 | The system shall not log or expose CTC or sensitive compensation data in the Logs tab or email digests. |
| SEC-DP-03 | Email digests shall contain only alert summaries (name, ID, department, alert type, relevant date). Full compensation or risk detail shall not be included in outbound emails. |
| SEC-DP-04 | The _Config tab shall be protected from non-admin users. Threshold changes shall require deliberate editor access, not accidental keyboard entry. |

### 7.3 Audit & Logging

| SEC-ID | Requirement |
|---|---|
| SEC-AL-01 | Every pipeline run, trigger execution, alert fired, email sent, and workflow action taken shall produce an append-only log entry in the Logs tab with: Timestamp, User (if identifiable), Level, and Message. |
| SEC-AL-02 | The Logs tab shall be append-only. No script shall delete or overwrite existing log entries. Log pruning, if needed, shall be a manual admin action documented in the SOP. |
| SEC-AL-03 | The Changelog tab shall record Run ID, timestamp, trigger source, duration, and key output metrics for every pipeline run, enabling post-incident review. |
| SEC-AL-04 | Workflow actions (Start Offboarding, Schedule PIP, Approve Confirmation) shall log the initiating user's email (`Session.getActiveUser().getEmail()`) alongside the action and affected employee ID. |

### 7.4 Input Validation & Injection Prevention

| SEC-ID | Requirement |
|---|---|
| SEC-IV-01 | All user-entered values in source tabs shall be validated before being written to the Dashboard or included in email digests. Invalid values (wrong type, empty required field, out-of-range date) shall produce a human-readable error and be excluded from rendering. |
| SEC-IV-02 | Employee IDs shall be validated against the expected format defined in _Config before being processed. Malformed IDs shall be flagged in the Logs tab. |
| SEC-IV-03 | All string values read from the Sheet and rendered into the Web App HTML shall be HTML-escaped before insertion into the DOM to prevent XSS via crafted cell content. |
| SEC-IV-04 | The Web App shall not use `eval()` or equivalent dynamic code execution. All template rendering shall use static HtmlService templates or explicit string concatenation with escaped values. |
| SEC-IV-05 | No Apps Script function that reads from the Sheet shall use exec-style constructs. All formula injection vectors (e.g., values starting with `=`, `+`, `-`, `@`) shall be sanitized when written back to the Sheet. |

### 7.5 Operational Security

| SEC-ID | Requirement |
|---|---|
| SEC-OS-01 | The Apps Script project shall not store credentials, API keys, or passwords in source code or in the Sheet. Service account permissions shall be granted at the Workspace level only. |
| SEC-OS-02 | The Web App deployment shall use HTTPS only (enforced by Google's Apps Script infrastructure). HTTP access is not applicable. |
| SEC-OS-03 | The system shall detect and log unauthorized access attempts: any request to the Web App that fails Google authentication shall be logged with timestamp and redacted user-agent. |
| SEC-OS-04 | The Techolution reviewer access (aadish.jain@techolution.com) shall be granted as view-only and shall be revocable without affecting system operation. |
| SEC-OS-05 | Self-monitoring alerts for system failures (missed runs, quota exhaustion, schema drift) shall be sent to the admin email address defined in _Config, separate from the HR alert recipient. |

---

## 8. Data Requirements

### 8.1 Source Tab Minimum Column Schema

All column lookups are header-name-based. The system reads the first row of each tab as the header row and builds a mapping dictionary on every execution.

| Tab | Minimum Required Columns |
|---|---|
| India Employee Database | Emp ID, Name, Department, Designation, Reporting Manager, Skillset, Date of Joining (DOJ), Employment Status, Last Working Day (LWD for interns) |
| US Employee Database | Emp ID, Name, Department, Designation, Reporting Manager, Skillset, DOJ, Employment Status, Allocation %, CTC |
| RM Data | Emp ID, Name, and one column per month (auto-discovered by date header format) |
| Finance · Productivity | Emp ID, CTC INR Annual, CTC INR Monthly, CTC USD Annual, CTC USD Monthly, Productivity Average |
| Risk Report | Emp ID, Name, Risk Category, Risk Level, Description, Date Raised, Status |
| Offboarded Resources | Emp ID, Name, Department, Designation, Last Working Day, Reason, Exit Quarter |

### 8.2 _Config Tab Schema

| Config Key | Default Value | Description |
|---|---|---|
| LWD_ALERT_DAYS | 45 | Days before LWD to surface an intern alert. |
| PROBATION_ALERT_DAYS | 30 | Days before confirmation date to surface a probation alert. |
| PROBATION_DURATION_DAYS | 180 | Total probation period in days. Confirmation date = DOJ + this value. |
| PRODUCTIVITY_TARGET | 80 | Productivity score below which an employee is flagged. |
| HR_ALERT_EMAIL | hr@techolution.com | Primary recipient for alert digest emails. |
| ADMIN_ALERT_EMAIL | admin@techolution.com | Recipient for system self-monitoring failure alerts. |
| PIPELINE_TRIGGER_HOUR | 8 | Hour (0–23, UTC) for the daily time-based trigger. |
| LOG_RETENTION_DAYS | 90 | Number of days to retain Logs tab entries before archiving. |

---

## 9. Interface Requirements

### 9.1 Google Sheet Surfaces

- **Dashboard Tab** — Read-only for HR. Script-rendered. Contains KPI strip, alert sections, department breakdown, attrition, risk summary.
- **OrgChart Tab** — Read-only for HR. Script-rendered hierarchical org chart rebuilt on every pipeline run and onEdit.
- **DrillDown Tab** — HR can interact with filter dropdowns in designated cells. All other cells are script-rendered and protected.
- **Logs Tab** — Read-only for HR. Append-only. Columns: Timestamp, Level, Message.
- **Changelog Tab** — Read-only for HR. Append-only. Columns: Run ID, Timestamp, Trigger Source, Duration (ms), Headcount, Alert Count, Attrition Rate.
- **Source Tabs** (India DB, US DB, RM Data, Finance-Productivity, Risk Report, Offboarded Resources) — HR has edit access. Validation fires onEdit.
- **_Config Tab** — Admin-only edit access. Contains threshold key-value pairs.

### 9.2 Web Application Interface

- **Authentication Screen** — Google Sign-In page (handled by Google's OAuth infrastructure).
- **Dashboard View** — Full-page HTML dashboard with navigation sections for KPIs, Alerts, Org Chart, Department Breakdown, Attrition, Risk Register, and Drill-Down.
- **Drill-Down View** — Filter controls (dropdowns) that call Apps Script server functions via `google.script.run` to re-fetch filtered data.
- **Error View** — Human-readable error page for script failures. No stack traces exposed to end users.

### 9.3 Email Interface

- **Alert Digest** — Plain-text or HTML email to `HR_ALERT_EMAIL`. Subject: `Techolution HR Alerts — [Date]`. Body: categorized alert list with employee name, ID, department, and relevant date.
- **Self-Monitoring Alert** — Plain-text email to `ADMIN_ALERT_EMAIL`. Subject: `HRD System Alert — [Failure Type]`. Body: failure description, timestamp, last successful run timestamp.

---

## 10. Configuration & Thresholds

All thresholds are stored in the _Config tab and are modifiable by an admin without any code change.

| Parameter | Default | Valid Range | Impact on System |
|---|---|---|---|
| LWD_ALERT_DAYS | 45 | 1 – 180 | Widens or narrows the LWD alert window for interns. |
| PROBATION_ALERT_DAYS | 30 | 1 – 90 | Widens or narrows the confirmation-imminent alert window. |
| PROBATION_DURATION_DAYS | 180 | 60 – 365 | Changes confirmation date calculation for all employees. |
| PRODUCTIVITY_TARGET | 80 | 0 – 100 | Changes the threshold below which employees are flagged. |
| HR_ALERT_EMAIL | hr@techolution.com | Valid email(s), comma-separated | Changes alert digest recipients. |
| ADMIN_ALERT_EMAIL | admin@techolution.com | Valid email | Changes self-monitoring failure alert recipient. |
| PIPELINE_TRIGGER_HOUR | 8 | 0 – 23 | Changes the daily trigger execution hour (UTC). |

---

## 11. Verification & Acceptance Protocol

The following acceptance tests mirror Techolution's live verification protocol. All `MUST` tests must pass on **both** the Sheet Dashboard and the Web App.

| # | Reviewer Action | Expected Outcome | Surface | Priority |
|---|---|---|---|---|
| 1 | Rename two columns in India Employee Database tab. | Both surfaces continue loading India data correctly with no errors. | Both | MUST |
| 2 | Add 3 employees: Intern (LWD in 20 days), Probationer (confirmation in 25 days), Confirmed employee. | All 3 reflected within seconds. Intern in LWD Alerts. Probationer in Probation Alerts. No manual refresh required. | Both | MUST |
| 3 | Change a Probationer's Date of Joining. | Confirmation date recalculates. Probation alert state updates on both surfaces automatically. | Both | MUST |
| 4 | Delete a row from Offboarded Resources. | Quarterly attrition recalculates from live data on both surfaces. | Both | MUST |
| 5 | Open Web App URL as a logged-in Google user. | Auth gate works. Dashboard renders. All sections from FR-SD are present. | Web App | MUST |
| 6 | Inspect the Logs tab. | Real execution history with multiple timestamps spanning the development period — not a single freshly-generated row. | Sheet | MUST |
| 7 | Modify `LWD_ALERT_DAYS` in _Config tab. | Alert threshold changes on next pipeline run or onEdit trigger without any code redeployment. | Both | MUST |
| 8 | Enter an invalid Employment Status value in a source tab. | Human-readable validation error surfaces in the Sheet. No stack trace shown. | Sheet | MUST |
| 9 | Open Web App in incognito window without an active Google session. | Redirected to Google Sign-In. Dashboard not accessible without authentication. | Web App | MUST |
| 10 | Manually trigger a full pipeline run from Apps Script editor. | Logs tab receives a new entry. Changelog receives a new summary row with run metadata. | Sheet | SHOULD |

---

## 12. Out of Scope

- Visual design polish beyond functional clarity. Color palettes and aesthetic preferences are not evaluated.
- Feature quantity — a focused, correct implementation of fewer features outperforms a sprawling partially-working one.
- Excel / VBA implementations. Only Google Sheets + Apps Script submissions are accepted.
- External databases, third-party APIs (beyond MailApp), or cloud infrastructure outside Google Workspace.
- Mobile-specific responsive design for the Web App.
- HRIS integrations (SAP, Workday, BambooHR, etc.) — not required for this phase.
- Real-time collaborative editing conflict resolution.
- Multi-language or internationalization support.

---

## 13. Glossary

| Term | Definition |
|---|---|
| Apps Script | Google's cloud-based JavaScript platform for extending Google Workspace products. |
| HtmlService | Apps Script service that enables serving web pages from a Script project. |
| onEdit Trigger | An installable Apps Script trigger that fires when a user edits a cell in the Sheet. |
| MailApp | Apps Script service for sending emails via the authorized user's Gmail account. |
| KPI | Key Performance Indicator — a measurable metric used to evaluate system or team health. |
| DOJ | Date of Joining — the calendar date on which an employee officially started. |
| LWD | Last Working Day — the final calendar date of employment. |
| PIP | Performance Improvement Plan — a formal HR process for managing underperformance. |
| Attrition Rate | Percentage of employees who left the organization in a given quarter relative to average headcount. |
| Header-Agnostic | Column lookup strategy based on header name rather than column index number. |
| Modular .gs Project | Apps Script project organized into multiple .gs files by functional domain. |
| Self-Monitoring | System capability to detect and report its own operational failures without external intervention. |
| SOP | Standard Operating Procedure — the document submitted alongside the Sheet and Web App URL. |
| Pipeline Run | A full execution of all dashboard-rendering, alert-evaluation, and logging logic triggered either by a time-based trigger or an onEdit event. |
| Schema Drift | A change in source tab structure (column rename, deletion, or reorder) that could break column-index-based lookups. |

---

*— End of Document —*

*SRS-HRD-2025-001 · v1.0 · Techolution HR Automation Dashboard · Confidential — Assignment Submission*
