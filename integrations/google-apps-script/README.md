# Google Apps Script publishing service

This service is the private Google Sheets workflow used by Vartalap, publication subscriptions, Aeva feedback, and notification operations.

## Required Script Properties

- `AKB_SPREADSHEET_ID`: private Google Sheet ID; the initializer sets it.
- `AKB_SERVICE_TOKEN`: random token shared with `AKB_PUBLISHING_SERVICE_TOKEN` in Vercel; the initializer creates it when absent.
- `APPS_SCRIPT_SIGNING_SECRET`: random HMAC secret shared with the variable of the same name in Vercel.

Generate the two secrets independently. Use at least 32 random bytes for each and never place either value in this repository, a PDF, a pull-request description, or a client-side environment variable.

## Deployment

1. Create a private Google Sheet owned by the AKB Studio operations account.
2. Open the Sheet's Apps Script project, paste `Code.gs`, set `APPS_SCRIPT_SIGNING_SECRET`, and run `initializePublishingService` once as the owner.
3. Copy the generated `AKB_SERVICE_TOKEN` value to `AKB_PUBLISHING_SERVICE_TOKEN` in Vercel.
4. Deploy as a web app executing as the owner. Permit access required for the web-app endpoint; application-layer access is enforced by the service token, timestamp window, and HMAC signature.
5. Copy the `/exec` deployment URL to `AKB_PUBLISHING_SERVICE_URL` in Vercel.
6. Keep the Google Sheet private. Do not publish it to the web or grant link-wide access.
7. Make a clearly labelled test submission, verify the expected sheet row, test Admin moderation, and then delete the test row.

Every request is authenticated, expires after five minutes, and is protected against spreadsheet-formula injection. Initialization validates required tabs and adds the report-chat columns to `AevaFeedback` without deleting existing rows.
