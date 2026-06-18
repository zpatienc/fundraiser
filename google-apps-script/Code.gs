/**
 * =====================================================================
 *  Patience Fundraiser - Google Apps Script
 * ---------------------------------------------------------------------
 *  This script receives orders from your web page and writes them
 *  as new rows into your Google Sheet.
 *
 *  You do NOT need to change anything in this file.
 * =====================================================================
 */

// The tab (sheet) name where orders are stored. Leave as "Orders".
var SHEET_NAME = "Orders";

// Column headers - written automatically the first time.
var HEADERS = [
  "Timestamp",
  "Collection Date",
  "Name",
  "Phone",
  "Notes",
  "Payment",
  "Combos",
  "Chicken Burgers",
  "Beef Burgers",
  "Boerewors",
  "Drinks",
  "Total (R)",
  "Paid?"
];

/**
 * Runs automatically when the web page submits an order (POST).
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var sheet = getOrCreateSheet_();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp      || new Date(),
      data.collectionDate || "",
      data.name           || "",
      data.phone          || "",
      data.notes          || "",
      data.payment        || "",
      Number(data.combo)     || 0,
      Number(data.chicken)   || 0,
      Number(data.beef)      || 0,
      Number(data.boerewors) || 0,
      Number(data.drink)     || 0,
      Number(data.total)     || 0,
      ""
    ]);

    return jsonOut_({ result: "success" });
  } catch (err) {
    return jsonOut_({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * A simple GET handler so you can test the URL in a browser.
 * Visiting the deployed URL should show: {"result":"ready"}
 */
function doGet() {
  return jsonOut_({ result: "ready" });
}

/** Gets the Orders sheet, creating it (with headers) if needed. */
function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Helper to return JSON from the web app. */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}