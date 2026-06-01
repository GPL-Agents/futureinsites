/**
 * Job Search Command Center Webhook API
 * Canonical store is a Google Sheet.
 *
 * Setup:
 *  1. Create a Google Sheet and add a tab named exactly as SHEET_NAME below.
 *  2. Paste the header row (see sheet-headers.txt) into row 1 of that tab.
 *  3. Extensions -> Apps Script, paste this file, save.
 *  4. Project Settings -> Script Properties: add API_KEY = a long random string.
 *  5. Deploy -> New deployment -> Web app. Execute as: Me.
 *     Who has access: Anyone. Copy the /exec URL (this is APPS_SCRIPT_URL).
 */

const SHEET_NAME = 'Job Search Command Center - Opportunities';

/* ---------- Utilities ---------- */

function getEffectiveLastRow_(sheet) {
  const colA = sheet.getRange('A:A').getValues();
  for (let i = colA.length - 1; i >= 0; i--) {
    if (String(colA[i][0]).trim() !== '') return i + 1;
  }
  return 1;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse_(err) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: err.message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function requireApiKey_(e) {
  const expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) throw new Error('Server not configured: missing API_KEY');

  const fromHeader =
    e && e.headers && (e.headers['x-api-key'] || e.headers['X-Api-Key'])
      ? String(e.headers['x-api-key'] || e.headers['X-Api-Key'])
      : '';

  const fromQuery =
    e && e.parameter && (e.parameter.api_key || e.parameter.key)
      ? String(e.parameter.api_key || e.parameter.key)
      : '';

  const provided = fromHeader || fromQuery;

  if (!provided || provided !== expected) {
    throw new Error('Unauthorized');
  }
}

/* ---------- GET /opportunities ---------- */
function doGet(e) {
  try {
    requireApiKey_(e);

    const sheet = getSheet_();
    const lastRow = getEffectiveLastRow_(sheet);
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2 || lastCol < 1) {
      return jsonResponse_({ opportunities: [] });
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const p = (e && e.parameter) ? e.parameter : {};
    const includeJd = p.include_jd === '1';
    const summaries = p.summaries === 'true' || p.summaries === '1';
    const status = p.status ? String(p.status).trim().toLowerCase() : '';
    const company = p.company ? String(p.company).trim().toLowerCase() : '';
    const companySlug = p.company_slug ? String(p.company_slug).trim().toLowerCase() : '';
    const id = p.id ? String(p.id).trim() : '';
    const hasLimit = p.limit !== undefined && String(p.limit).trim() !== '';
    const limitRaw = hasLimit ? parseInt(String(p.limit), 10) : null;
    const limit = hasLimit && !isNaN(limitRaw) ? Math.max(1, limitRaw) : null;

    let records = data.map(row => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return normalizeRecord_(obj);
    });

    if (id) {
      records = records.filter(r => String(r.id || '').trim() === id);
    }

    if (company) {
      records = records.filter(r => String(r.company || '').trim().toLowerCase() === company);
    }

    if (companySlug) {
      records = records.filter(r => String(r.company_slug || '').trim().toLowerCase() === companySlug);
    }

    if (status) {
      records = records.filter(r => String(r.status || '').trim().toLowerCase() === status);
    }

    if (limit !== null) {
      records = records.slice(0, limit);
    }

    if (!includeJd) {
      records.forEach(r => (r.jd_text = ''));
    }

    if (summaries) {
      records = records.map(r => ({
        id: r.id || '',
        company: r.company || '',
        company_slug: r.company_slug || '',
        role: r.role || '',
        status: r.status || '',
        waiting_reason: r.waiting_reason || '',
        status_reason: r.status_reason || '',
        date_added: r.date_added || '',
        date_applied: r.date_applied || '',
        last_action_date: r.last_action_date || '',
        next_action: r.next_action || ''
      }));
    }

    return jsonResponse_({ opportunities: records });

  } catch (err) {
    return errorResponse_(err);
  }
}
/* ---------- POST /opportunity ---------- */

function doPost(e) {
  try {
    requireApiKey_(e);

    const body = JSON.parse(e.postData.contents);
    if (!body.id) throw new Error('Missing required field: id');

    const sheet = getSheet_();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const idColIndex = headers.indexOf('id');
    if (idColIndex === -1) throw new Error('Sheet must contain an id column');

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === body.id) {
        rowIndex = i + 1;
        break;
      }
    }

    const rowValues = headers.map(h => body[h] ?? '');

    if (rowIndex === -1) {
      sheet.appendRow(rowValues);
    } else {
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
    }

    return jsonResponse_({ status: 'ok', id: body.id });

  } catch (err) {
    return errorResponse_(err);
  }
}

/* ---------- Normalization ---------- */

function normalizeRecord_(record) {
  record.jd_text = record.jd_text || '';
  record.jd_source = record.jd_source || '';
  record.jd_captured_at = record.jd_captured_at || '';

  if (record.unknowns) {
    try { record.unknowns = JSON.parse(record.unknowns); } catch (_) {}
  }
  if (record.score_snapshot) {
    try { record.score_snapshot = JSON.parse(record.score_snapshot); } catch (_) {}
  }

  record.score_locked = record.score_locked === true || record.score_locked === 'TRUE';
  record.location_compatible =
    record.location_compatible === true || record.location_compatible === 'TRUE';
  record.warm_intro_available =
    record.warm_intro_available === true || record.warm_intro_available === 'TRUE';

  return record;
}
