# HR Automation Dashboard SOP

## Architecture

Source tabs feed Apps Script modules. Apps Script renders the Sheet dashboard surfaces, serves the HtmlService Web App, sends MailApp alerts, and writes Logs and Changelog entries.

## Daily Usage Guide

HR users work in the source tabs only. Generated tabs are protected and are refreshed by script triggers in later passes.

## Threshold Modification Guide

Administrators change thresholds in `_Config`. Invalid values fall back to defaults and are logged in plain English.

## Real-Time Reflection

Pass 9 completes this section after triggers and Web App polling are implemented and verified.

## Trigger Installation

Admins run `installTriggers()` once after deployment to create installable `onEdit`, `onChange`, and daily time-based triggers. Use `removeProjectTriggers()` before reinstalling triggers during maintenance.

## Web App Deployment

Pass 9 completes this section after HtmlService deployment behavior is implemented and verified.

## Troubleshooting

Review `Logs` for timestamped INFO, WARN, and ERROR messages. Review `Changelog` for one row per full pipeline run.

If HR alert email delivery fails, the pipeline continues rendering Sheet surfaces and records a warning. System self-monitoring alerts are sent to `ADMIN_ALERT_EMAIL` when MailApp failures, missed daily runs, or schema drift are detected.

## Change Management

Pass 9 completes this section after the final deployment package is ready.

## HR Health Score

Pass 9 completes this section after the final score formula is implemented and verified.
