# Google Apps Script publishing service

This service is the private Google Sheets workflow used by Vartalap, publication subscriptions, Aeva feedback, and notification operations.

## Required Script Properties

- `SPREADSHEET_ID`: private Google Sheet ID.
- `SERVICE_TOKEN`: random token shared with `AKB_PUBLISHING_SERVICE_TOKEN` in Vercel.
- `SIGNING_SECRET`: random HMAC secret shared with `APPS_SCRIPT_SIGNING_SECRET` in Vercel.

Generate the two secrets independently. Use at least 32 random bytes for each and never place either value in this repository, a PDF, a pull-request description, or a client-side environment variable.

## Deployment

1. Create a private Google Sheet owned by the AKB Studio operations account.
2. Create a standalone Apps Script project, paste `Code.gs`, and add the three Script Properties above.
3. Deploy as a web app executing as the owner. Permit access required for the web-app endpoint; application-layer access is enforced by the service token, timestamp window, and HMAC signature.
4. Copy the `/exec` deployment URL to `AKB_PUBLISHING_SERVICE_URL` in Vercel.
5. Keep the Google Sheet private. Do not publish it to the web or grant link-wide access.
6. Make a clearly labelled test submission, verify the expected sheet row, test Admin moderation, and then delete the test row.

Every request is authenticated, expires after five minutes, and is protected against spreadsheet-formula injection. The service creates required tabs and headers on first use.
