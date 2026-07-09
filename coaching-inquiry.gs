/****************************************************************
 * PERFORMEX - Coaching Inquiry form handler (Google Apps Script)
 *
 * On submit it will:
 *   1. Append a timestamped row to the "Leads" sheet
 *   2. Email YOU a plain-text notification with the lead details
 *   3. Email the LEAD a plain-text thank-you confirmation
 *
 * Bind this script to a Google Sheet (Extensions > Apps Script),
 * then deploy it as a Web App. See COACHING-FORM-SETUP.md.
 ****************************************************************/

/* ─── SETTINGS - edit these ─────────────────────────────── */
var COACH_EMAIL = "markus.furst1@gmail.com";   // where lead notifications are sent
var COACH_NAME  = "Markus";                     // used to sign the thank-you email
var BRAND       = "Performex";                  // brand name in emails
var SHEET_NAME  = "Leads";                       // tab that stores submissions

/* Column order for the sheet + notification email.
   key = form field name (must match the HTML input "name" attributes) */
var FIELDS = [
  { key: "name",               label: "Name" },
  { key: "email",              label: "Email" },
  { key: "phone",              label: "Phone / WhatsApp" },
  { key: "age",                label: "Age" },
  { key: "location",           label: "Location" },
  { key: "training_for",       label: "Training for" },
  { key: "training_for_other", label: "Training for (other)" },
  { key: "experience",         label: "Training consistently" },
  { key: "goals",              label: "Goals" },
  { key: "background",         label: "Background" },
  { key: "source",             label: "Heard about me via" },
  { key: "page_url",           label: "Page URL" }
];

/* ─── POST handler (form submissions) ───────────────────── */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // avoid two submissions writing the same row

    var params = (e && e.parameter) ? e.parameter : {};

    // basic guard: require an email so we don't log empty pings
    if (!params.email || String(params.email).trim() === "") {
      return jsonOut({ result: "error", message: "Missing email." });
    }

    var sheet = getSheet_();
    var timestamp = new Date();

    // build the row in FIELDS order, prefixed with a timestamp
    var row = [timestamp];
    FIELDS.forEach(function (f) {
      row.push(params[f.key] ? String(params[f.key]) : "");
    });
    sheet.appendRow(row);

    // notify the coach + confirm to the lead (failures here shouldn't block logging)
    try { sendCoachEmail_(params, timestamp); } catch (mailErr) { logQuietly_("coach email", mailErr); }
    try { sendLeadEmail_(params); }             catch (mailErr) { logQuietly_("lead email", mailErr); }

    return jsonOut({ result: "success" });

  } catch (err) {
    return jsonOut({ result: "error", message: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* ─── GET handler (health check in the browser) ─────────── */
function doGet() {
  return jsonOut({ result: "ok", message: "Performex coaching inquiry endpoint is live." });
}

/* ─── Sheet: get or create, ensure header row ───────────── */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    var header = ["Timestamp"].concat(FIELDS.map(function (f) { return f.label; }));
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ─── Email to the coach (plain text) ───────────────────── */
function sendCoachEmail_(params, timestamp) {
  var name = (params.name && String(params.name).trim()) || "Someone";

  var lines = [];
  lines.push("New coaching inquiry from " + name + ".");
  lines.push("");
  lines.push("Submitted: " + Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") );
  lines.push("");

  FIELDS.forEach(function (f) {
    var val = params[f.key] ? String(params[f.key]).trim() : "";
    if (val === "") return; // skip empty fields in the email
    lines.push(f.label + ": " + val);
  });

  lines.push("");
  lines.push("- Logged to the \"" + SHEET_NAME + "\" sheet.");

  var options = { name: BRAND + " Website" };
  if (params.email && String(params.email).trim() !== "") {
    options.replyTo = String(params.email).trim(); // reply goes straight to the lead
  }

  MailApp.sendEmail(
    COACH_EMAIL,
    "New coaching inquiry - " + name,
    lines.join("\n"),
    options
  );
}

/* ─── Thank-you email to the lead (plain text) ──────────── */
function sendLeadEmail_(params) {
  var to = params.email ? String(params.email).trim() : "";
  if (to === "") return;

  var firstName = "";
  if (params.name && String(params.name).trim() !== "") {
    firstName = String(params.name).trim().split(/\s+/)[0];
  }
  var greeting = firstName ? ("Hi " + firstName + ",") : "Hi,";

  var body = [
    greeting,
    "",
    "Thanks for reaching out about coaching with " + BRAND + " - I've received your inquiry.",
    "",
    "I personally read every application. I'll review your goals and background and get back to you within 24–48 hours to talk about the next steps.",
    "",
    "If anything changes in the meantime, or you have a question, just reply to this email.",
    "",
    "Talk soon,",
    COACH_NAME,
    BRAND + " Coaching"
  ].join("\n");

  MailApp.sendEmail(
    to,
    "Thanks for your coaching inquiry - " + BRAND,
    body,
    { name: COACH_NAME + " · " + BRAND, replyTo: COACH_EMAIL }
  );
}

/* ─── Helpers ───────────────────────────────────────────── */
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function logQuietly_(where, err) {
  try { console.error("Email failed (" + where + "): " + err); } catch (ignore) {}
}
