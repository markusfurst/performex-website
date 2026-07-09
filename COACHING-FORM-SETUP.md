# Coaching Inquiry Form - Setup Guide

Three pieces:

| File | What it is |
|------|-----------|
| `coaching-inquiry.html` | The standalone lead form (dark/gold, mobile-first, on-page thank-you) |
| `coaching-inquiry.gs` | Google Apps Script backend (Sheet logging + both emails) |
| This file | Deploy + wiring instructions |

Nothing redirects off your domain - the "thank you" appears in-page so a Google Ads conversion can fire there.

---

## Part 1 - Create the Google Sheet + Apps Script

1. Go to <https://sheets.google.com> and create a **new blank spreadsheet**. Name it e.g. `Performex Leads`.
   *(You don't need to add any tabs/columns - the script creates a `Leads` tab with headers automatically on the first submission.)*
2. In that sheet, open **Extensions → Apps Script**. A new script project opens.
3. Delete the default `function myFunction() {}` code.
4. Open `coaching-inquiry.gs` from this project, copy **all** of it, and paste it into the Apps Script editor.
5. At the top of the script, check the **SETTINGS** block:
   - `COACH_EMAIL` - already set to `markus.furst1@gmail.com` (where lead alerts go).
   - `COACH_NAME` - currently `"Markus"` (used to sign the lead's thank-you email - change if you want).
   - `BRAND` - `"Performex"`.
6. Click the **Save** icon (💾).

> The script is **bound** to this specific sheet, so `SpreadsheetApp.getActiveSpreadsheet()` always writes to the right place - no Sheet ID to copy.

---

## Part 2 - Deploy as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the ⚙️ gear next to "Select type" → choose **Web app**.
3. Fill in:
   - **Description:** `Coaching form handler` (anything).
   - **Execute as:** **Me** (`markus.furst1@gmail.com`). *(This lets it write the sheet and send email as you.)*
   - **Who has access:** **Anyone**. ⚠️ This is required - the form is called from a public web page with no login. "Anyone" means anyone can POST to the endpoint; it does **not** expose your sheet.
4. Click **Deploy**.
5. Google asks you to **authorize**. Click **Authorize access** → pick your Google account → you'll see a "Google hasn't verified this app" screen (normal for your own script) → **Advanced → Go to (project name) → Allow**.
6. Copy the **Web app URL**. It ends in `/exec` and looks like:
   `https://script.google.com/macros/s/AKfycb..................../exec`

### Test the endpoint
Paste that `/exec` URL into a browser tab. You should see:
```json
{"result":"ok","message":"Performex coaching inquiry endpoint is live."}
```

---

## Part 3 - Connect the form to the backend

1. Open `coaching-inquiry.html`.
2. Find this line near the bottom (in the `<script>`):
   ```js
   const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
3. Replace the placeholder with the `/exec` URL you copied. Keep the quotes:
   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycb..../exec";
   ```
4. Save and upload `coaching-inquiry.html` to your site (same place as your other tool pages).

### Test the whole flow
- Open the form, fill it in, submit.
- You should see the in-page **"Thank you, {name}!"** screen (no redirect).
- Within ~1 min: a new row appears in the `Leads` sheet, you get the notification email, and the test email address gets the thank-you email. Check spam on the first run.

---

## Part 4 - Google Ads conversion tracking

The conversion should fire on the **thank-you state**, which is already wired up. Two steps:

### A) Add the global site tag (once, in `<head>`)
In Google Ads → **Tools → Conversions**, create a conversion action (e.g. *Lead - coaching form*). It gives you a **global site tag** and a **conversion event snippet**. Paste the global site tag just inside `<head>` of `coaching-inquiry.html` (and ideally on your main site too):

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-XXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-XXXXXXXXX');
</script>
```

### B) Set your conversion ID in the form
The event already fires in the `showThankYou()` function. Find this block in the `<script>` of `coaching-inquiry.html` and swap in the real IDs from your conversion event snippet:

```js
if(typeof gtag === 'function'){
  gtag('event', 'conversion', {
    'send_to': 'AW-XXXXXXXXX/AbC-D_efG'   // ← your conversion ID / label
  });
}
```

- `AW-XXXXXXXXX` = your Google Ads conversion ID.
- `AbC-D_efG` = the conversion label (the part after the slash in the event snippet).

**Using Google Tag Manager instead?** There's a commented `dataLayer.push({ 'event': 'lead_form_submit' })` in the same function - uncomment it and build a GTM trigger on that custom event, then skip step A.

To verify: install the **Google Tag Assistant** / Tag Assistant Companion extension, submit a test lead, and confirm the conversion event fires on the thank-you screen.

---

## Editing the form later

- **Change a question / options:** edit the field in `coaching-inquiry.html`. If you add a new input, give it a `name="..."`, then add a matching entry to the `FIELDS` array in `coaching-inquiry.gs` (same `key`) so it gets logged + emailed. Redeploy the script (**Deploy → Manage deployments → edit → Version: New version**).
- **Change email wording:** edit `sendCoachEmail_` / `sendLeadEmail_` in the `.gs` file, then redeploy a new version.
- **Important:** every time you change the `.gs` code, you must deploy a **New version** (Manage deployments → ✏️ → Version → *New version*), otherwise the live URL keeps running the old code. The `/exec` URL itself stays the same.

## Notes & limits
- Gmail/Apps Script free accounts can send ~100 emails/day - plenty for lead volume.
- Emails send from **your** Google account; the coach notification has the lead's address as **reply-to**, so hitting reply goes straight to them.
- If submissions ever fail with a CORS error in the browser console, re-check that **Who has access = Anyone** and that you deployed a **Web app** (not an API executable).
