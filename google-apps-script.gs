/**
 * Gluu waitlist -> Google Sheets
 *
 * SETUP:
 * 1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1od2AkiPJqYV5X_fXMnSjlG_lE7yIeuOqulaPi1DANG0/edit
 * 2. Extensions -> Apps Script
 * 3. Delete any starter code, paste this file's contents in instead
 * 4. Click Deploy -> New deployment -> select type "Web app"
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Click Deploy, authorize the permissions prompt (it's your own sheet, so this is safe)
 * 6. Copy the "Web app URL" it gives you (looks like
 *    https://script.google.com/macros/s/AKfycb.../exec)
 * 7. Send that URL back — it goes into the Cloudflare Worker as SHEETS_WEBHOOK_URL
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  var email = (data.email || '').trim();

  if (!email) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Missing email' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Email', 'Date', 'Time']);
  }

  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var date = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  var time = Utilities.formatDate(now, tz, 'HH:mm:ss');

  sheet.appendRow([email, date, time]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
