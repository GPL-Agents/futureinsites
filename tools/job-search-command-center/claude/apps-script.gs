/**
 * Job Search Command Center - Apps Script web app (Claude edition)
 *
 * Exposes read/write access to the Opportunities sheet over a single POST
 * endpoint. Claude calls this directly (no Vercel proxy needed). All requests
 * are POST with a JSON body; the token is checked against the API_KEY script
 * property so nothing sensitive rides in the URL.
 *
 * Setup:
 *   1. In your Sheet: Extensions -> Apps Script. Delete starter code, paste this.
 *   2. Project Settings (gear) -> Script Properties -> add property:
 *        API_KEY = <a long random string you invent>
 *   3. Deploy -> New deployment -> Web app.
 *        Execute as: Me.   Who has access: Anyone.
 *      Copy the web app URL (ends in /exec). That URL + your API_KEY are what
 *      you give Claude.
 *
 * Request body shape (application/json):
 *   { "key": "<API_KEY>", "action": "get|upsert|upsertBulk|update", ... }
 *   - get:        { includeJd?: bool, limit?: int }            -> { opportunities: [...] }
 *   - upsert:     { record: {...} }    update if id matches, else append
 *   - upsertBulk: { records: [ {...}, ... ] }
 *   - update:     { record: {...} }    must match an existing id; never appends
 */

var SHEET_NAME = 'Job Search Command Center - Opportunities';
var HEADERS = [
  'id','company','company_slug','role','link','status','waiting_reason',
  'status_reason','date_added','date_applied','comp_base_min','comp_base_max',
  'comp_range_text','location_compatible','warm_intro_available',
  'recruiter_contact','unknowns','why_deprioritized','last_action_date',
  'next_action','score_locked','score_snapshot','notes','jd_text','jd_source',
  'jd_captured_at'
];
var REQUIRED = ['id','company','company_slug','role','status','date_added'];
var BOOLEANS = ['location_compatible','warm_intro_available','score_locked'];
var BIG = ['jd_text'];

function doGet() {
  return json_({ ok: true, service: 'job-search-command-center', actions: ['get','upsert','upsertBulk','update'] });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.key !== scriptKey_()) return json_({ error: 'unauthorized' });
    var action = body.action;
    if (action === 'get')        return json_({ opportunities: readAll_(!!body.includeJd, body.limit || 0) });
    if (action === 'upsert')     return json_(upsert_(body.record, false));
    if (action === 'update')     return json_(upsert_(body.record, true));
    if (action === 'upsertBulk') return json_(upsertBulk_(body.records || []));
    return json_({ error: 'unknown action: ' + action });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function scriptKey_() {
  return PropertiesService.getScriptProperties().getProperty('API_KEY');
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  var firstRow = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var blank = firstRow.join('') === '';
  if (blank) sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sh;
}

function headerMap_(sh) {
  var row = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < row.length; i++) {
    var name = String(row[i]).trim();
    if (name) map[name] = i; // 0-based column index
  }
  return map;
}

function readAll_(includeJd, limit) {
  var sh = sheet_();
  var map = headerMap_(sh);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var width = sh.getLastColumn();
  var values = sh.getRange(2, 1, last - 1, width).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (String(row[map['id']] || '') === '' && String(row[map['company']] || '') === '') continue;
    var obj = {};
    for (var name in map) {
      if (!includeJd && BIG.indexOf(name) !== -1) continue;
      obj[name] = parseField_(name, row[map[name]]);
    }
    out.push(obj);
    if (limit && out.length >= limit) break;
  }
  return out;
}

function findRowById_(sh, map, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var idCol = map['id'];
  var ids = sh.getRange(2, idCol + 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // 1-based sheet row
  }
  return -1;
}

function upsert_(record, mustExist) {
  if (!record || record.id === undefined || record.id === null || String(record.id) === '') {
    return { error: 'record.id is required (as a string)' };
  }
  var sh = sheet_();
  var map = headerMap_(sh);
  var rowNum = findRowById_(sh, map, record.id);

  if (rowNum === -1) {
    if (mustExist) return { error: 'no record with id ' + record.id + ' (update never creates)' };
    for (var k = 0; k < REQUIRED.length; k++) {
      var f = REQUIRED[k];
      if (record[f] === undefined || record[f] === null || String(record[f]) === '') {
        return { error: 'missing required field on create: ' + f };
      }
    }
    var width = sh.getLastColumn();
    var newRow = new Array(width).fill('');
    for (var name in map) {
      if (record[name] !== undefined) newRow[map[name]] = serializeField_(name, record[name]);
    }
    sh.appendRow(newRow);
    return { status: 'created', id: String(record.id) };
  } else {
    // merge: only overwrite fields present in the record
    for (var name2 in map) {
      if (record[name2] !== undefined) {
        sh.getRange(rowNum, map[name2] + 1).setValue(serializeField_(name2, record[name2]));
      }
    }
    return { status: 'updated', id: String(record.id) };
  }
}

function upsertBulk_(records) {
  var updated = [], skipped = [];
  for (var i = 0; i < records.length; i++) {
    var res = upsert_(records[i], false);
    if (res.error) skipped.push({ id: (records[i] && records[i].id) || null, reason: res.error });
    else updated.push(res.id);
  }
  return { updated: updated, skipped: skipped };
}

function serializeField_(name, value) {
  if (BOOLEANS.indexOf(name) !== -1) {
    if (value === true || String(value).toUpperCase() === 'TRUE') return 'TRUE';
    if (value === false || String(value).toUpperCase() === 'FALSE') return 'FALSE';
    return '';
  }
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return value;
}

function parseField_(name, value) {
  if (BOOLEANS.indexOf(name) !== -1) {
    var s = String(value).toUpperCase();
    if (s === 'TRUE') return true;
    if (s === 'FALSE') return false;
    return null;
  }
  return value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
