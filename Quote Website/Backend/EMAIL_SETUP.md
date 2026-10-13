# Quote email setup

The Flask backend sends quotes with Brevo's HTTPS API. SMTP and EMAIL_PASS are no longer used.

In the existing Divorce-Insurance Render service, set:
- BREVO_API_KEY: a private Brevo API key (not an SMTP key).
- EMAIL_USER: the sender email verified in Brevo.

Never put these values in source code or the React frontend. After the backend
change is merged, deploy the latest main commit on Render. The API returns the
quote even if email submission fails. email_status is accepted when Brevo accepts
the request, failed on provider/configuration/network errors, or not_requested
when no email was provided. Acceptance is not confirmation of inbox delivery.
Check Brevo transactional logs for delivery, bounce, or rejection events.
A Gmail sender may be rewritten by Brevo; authenticate an owned domain for
consistent branded delivery.

To publish the frontend status messages after merging, in your local frontend
folder run:
```powershell
git pull origin main
npm install
npm run deploy
```
If you still have the old invalid user-event version (^1A3.5.0), retain your local
correction to ^13.5.0. Do not overwrite it while pulling.

Test the GitHub Pages quote form with your own email. Confirm that quote details
appear, check email_status and the Render/Brevo logs if email fails, and verify
receipt in your inbox or spam folder. Keep the old backend until this succeeds.
