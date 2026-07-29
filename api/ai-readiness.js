// Vercel Serverless Function: POST /api/ai-readiness
// AI Readiness Assessment -- scores answers, generates PDF report, emails results to user and FIS team.
//
// Required env vars (set in Vercel -> Project -> Settings -> Environment Variables):
//   RESEND_API_KEY        e.g. re_xxxxxxxxxxxx
//   INQUIRY_FROM          FutureInSites <forms@futureinsites.com>
//   AI_READINESS_TO       gregl@futureinsites.com,randalk@futureinsites.com,jeffh@futureinsites.com

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
// Using native fetch available in Node 18+

// ─── Scoring Engine ───────────────────────────────────────────────────────────

const SECTIONS = {
  B: { label: 'Data Maturity', weight: 0.25 },
  C: { label: 'AI Governance & Risk', weight: 0.25 },
  D: { label: 'Technical Readiness', weight: 0.20 },
  E: { label: 'Business Readiness', weight: 0.20 },
  F: { label: 'Security & Compliance', weight: 0.10 },
};

const TIERS = [
  { min: 80, id: 'ready',    label: 'AI Ready',       color: '#16A34A', desc: 'Your foundation is solid. You are ready for production AI. Focus areas: formalize governance, prioritize high-impact use cases.' },
  { min: 50, id: 'developing',label: 'AI Developing',  color: '#EAB308', desc: 'You have the basics. Priority: close governance gaps, assess data readiness, and pick 1-2 high-impact use cases to pilot.' },
  { min: 20, id: 'exploring', label: 'AI Exploring',   color: '#F97316', desc: 'You are asking the right questions. Start with a formal Readiness Assessment engagement to build your foundation.' },
  { min: 0,  id: 'novice',    label: 'AI Novice',      color: '#DC2626', desc: 'AI is a big leap from where you are. We recommend starting with data hygiene and an AI literacy workshop.' },
];

function scoreDataMaturity(a) {
  const scores = [];
  // q5 - data storage
  const storageMap = { onprem: 25, singlecloud: 50, multicloud: 75, hybrid: 100, dontknow: 0 };
  scores.push(storageMap[a.q5] ?? 0);

  // q6 - data types (multi-select)
  if (Array.isArray(a.q6)) {
    if (a.q6.includes('dontknow')) scores.push(0);
    else {
      const valid = a.q6.filter(v => v !== 'dontknow');
      const raw = Math.min(valid.length * 14.3, 100);
      scores.push(Math.round(raw));
    }
  } else scores.push(0);

  // q7 - data management
  const mgmtMap = { spreadsheets: 10, shareddrives: 25, opdb: 50, dw: 75, lake: 100, combo: 75 };
  scores.push(mgmtMap[a.q7] ?? 0);

  // q8 - data quality
  const qualMap = { formal: 100, adhoc: 50, needthem: 25, notpriority: 0 };
  scores.push(qualMap[a.q8] ?? 0);

  // q9 - data access
  const accessMap = { selfservice: 100, somewhat: 50, throughit: 25, dontknow: 10 };
  scores.push(accessMap[a.q9] ?? 0);

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

function scoreGovernance(a) {
  const scores = [];
  // q10 - governance policy
  const polMap = { fullyadopted: 100, drafted: 60, indev: 40, planned: 20, notplanned: 0 };
  scores.push(polMap[a.q10] ?? 0);

  // q11 - AI oversight
  const ovMap = { board: 100, dedicated: 80, itdept: 50, teamleads: 30, nobody: 0 };
  scores.push(ovMap[a.q11] ?? 0);

  // q12 - formal processes (multi-select)
  if (Array.isArray(a.q12)) {
    if (a.q12.includes('none')) scores.push(0);
    else {
      const valid = a.q12.filter(v => v !== 'none');
      const raw = Math.min(valid.length * 20, 100);
      scores.push(Math.round(raw));
    }
  } else scores.push(0);

  // q14 - acceptable use policy
  const aupMap = { enforced: 100, notenforced: 60, indev: 30, no: 0 };
  scores.push(aupMap[a.q14] ?? 0);

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

function scoreTechnical(a) {
  const scores = [];
  // q16 - AI relationship
  const aiMap = { notstarted: 0, experimenting: 30, someprod: 70, core: 100 };
  scores.push(aiMap[a.q16] ?? 0);

  // q17 - AI talent
  const talentMap = { team: 100, individuals: 60, contractors: 40, none: 0 };
  scores.push(talentMap[a.q17] ?? 0);

  // q18 - cloud maturity
  const cloudMap = { native: 100, mostlycloud: 75, mostlyonprem: 30, allonprem: 10, na: 0 };
  scores.push(cloudMap[a.q18] ?? 0);

  // q19 - APIs
  const apiMap = { robust: 100, some: 60, minimal: 25, no: 0 };
  scores.push(apiMap[a.q19] ?? 0);

  // q20 - enterprise systems (multi-select)
  if (Array.isArray(a.q20)) {
    if (a.q20.includes('none')) scores.push(0);
    else {
      const valid = a.q20.filter(v => v !== 'none');
      const raw = Math.min(valid.length * 12.5, 100);
      scores.push(Math.round(raw));
    }
  } else scores.push(0);

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

function scoreBusiness(a) {
  const scores = [];
  // q22 - exec sponsorship
  const sponMap = { champion: 100, verbalsupport: 60, nobuyin: 20, tooearly: 10 };
  scores.push(sponMap[a.q22] ?? 0);

  // q23 - timeline
  const timeMap = { immediately: 100, shortterm: 80, mediumterm: 50, longterm: 20, exploring: 10 };
  scores.push(timeMap[a.q23] ?? 0);

  // q24 - budget
  const budgetMap = { dedicated: 100, partofit: 60, planned: 30, no: 0 };
  scores.push(budgetMap[a.q24] ?? 0);

  // q25 - previous attempts
  const prevMap = { success: 100, stalled: 50, evaluated: 30, no: 10 };
  scores.push(prevMap[a.q25] ?? 0);

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

function scoreSecurity(a) {
  const scores = [];
  // q26 - data location
  const locMap = { usonly: 100, canada: 80, eu: 50, global: 30, notsure: 0 };
  scores.push(locMap[a.q26] ?? 0);

  // q27 - data classification
  const classMap = { fully: 100, partially: 50, indev: 30, no: 0 };
  scores.push(classMap[a.q27] ?? 0);

  // q28 - vendor vetting
  const vetMap = { formal: 100, informal: 50, noprocess: 10, dontknow: 0 };
  scores.push(vetMap[a.q28] ?? 0);

  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

function generateRecommendations(sectionScores, answers) {
  const recs = [];
  const B = sectionScores.B, C = sectionScores.C, D = sectionScores.D, E = sectionScores.E, F = sectionScores.F;

  if (B < 40) recs.push('Start by inventorying your data sources and documenting what data you have, where it lives, and who owns it. A data catalog is the first step toward AI readiness.');
  else if (B < 70) recs.push('Improve data accessibility by reducing reliance on IT for data requests. Consider self-service BI tools and formalizing data quality processes.');
  else recs.push('Your data maturity is strong. Focus on integration -- ensure your data pipeline can feed AI models in real-time or near-real-time.');

  if (C < 40) recs.push('Establish an AI governance framework. Start with an Acceptable Use Policy for employee AI tools and a simple ethics review process for new AI use cases.');
  else if (C < 70) recs.push('Strengthen your AI governance by adding model monitoring, bias testing, and vendor risk assessment processes. Assign clear ownership for AI oversight.');
  else recs.push('Your governance is mature. Consider formalizing board-level AI oversight and expanding third-party AI vendor risk assessments.');

  if (D < 40) recs.push('Build basic AI literacy on the team before investing in infrastructure. A 2-day AI Transformation Session can accelerate your technical readiness.');
  else if (D < 70) recs.push('Strengthen your technical foundation by investing in API integration between business systems. Consider a cloud migration roadmap if you are still on-prem.');
  else recs.push('You have strong technical infrastructure. The next step is moving from experimentation to production -- identify 1-2 use cases with clear ROI and build them end-to-end.');

  if (E < 30) recs.push('AI adoption needs executive sponsorship and budget. Start by building a business case: identify 3-5 specific problems AI could solve and estimate the ROI of solving each.');
  else if (E < 70) recs.push('You have some business momentum. Refine your AI strategy by prioritizing 1-2 use cases where you have data, talent, and clear ROI. Avoid spreading too thin.');
  else recs.push('Your business is ready to execute. The risk now is overreach -- stay focused on the highest-impact use cases and ensure each has dedicated resources and success metrics.');

  if (F < 40) recs.push('Data security and compliance need attention. Start by understanding what regulatory frameworks apply to your data and establishing data classification standards.');
  else if (F < 70) recs.push('Improve your security posture by formalizing vendor risk assessments and implementing data classification if not already in place.');

  // Tier-based action
  const overall = Math.round(
    B * 0.25 + C * 0.25 + D * 0.20 + E * 0.20 + F * 0.10
  );

  if (overall >= 80) recs.push('Schedule a strategy session with our team to prioritize and sequence your AI roadmap. You are ready to move from planning to execution.');
  else if (overall >= 50) recs.push('Book a free 30-minute consultation with FutureInSites to discuss your assessment results and map out a 90-day AI action plan.');
  else recs.push('Consider FutureInSites AI Readiness Assessment engagement -- a structured 2-week engagement that delivers a capability heatmap, gap analysis, and prioritized roadmap.');

  return recs;
}

function getTier(score) {
  for (const t of TIERS) {
    if (score >= t.min) return t;
  }
  return TIERS[TIERS.length - 1];
}

function sanitize(s) {
  return String(s ?? '').trim().slice(0, 5000);
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function generatePdf(score, tier, sectionScores, sectionNames, recommendations, logoBase64) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page dimensions: letter
  const W = 612, H = 792;
  const margin = 50;
  const contentW = W - margin * 2;

  // ── Page 1: Cover ──
  let page = doc.addPage([W, H]);

  // Background
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.96, 0.97, 0.98) });

  // Logo
  if (logoBase64) {
    try {
      const logoImg = doc.embedPng(logoBase64);
      const logoDims = logoImg.scale(1);
      const logoW = 120;
      const logoScale = logoW / logoDims.width;
      page.drawImage(logoImg, {
        x: margin,
        y: H - margin - 45,
        width: logoW,
        height: logoDims.height * logoScale,
      });
    } catch (e) {
      // logo optional
    }
  }

  // Title
  page.drawText('AI Readiness Assessment', { x: margin, y: H - margin - 90, size: 22, font: bold, color: rgb(0.04, 0.05, 0.06) });

  // Score
  page.drawText('Overall Score', { x: margin, y: H - margin - 140, size: 12, font: font, color: rgb(0.39, 0.45, 0.51) });
  page.drawText(`${score}/100`, { x: margin, y: H - margin - 175, size: 42, font: bold, color: rgb(0.04, 0.05, 0.06) });

  // Tier
  const tierColors = { ready: rgb(0.09, 0.63, 0.26), developing: rgb(0.92, 0.70, 0.03), exploring: rgb(0.98, 0.45, 0.09), novice: rgb(0.86, 0.15, 0.15) };
  const tierColor = tierColors[tier.id] || rgb(0.04, 0.05, 0.06);
  page.drawText(tier.label, { x: margin, y: H - margin - 195, size: 16, font: bold, color: tierColor });

  // Description
  page.drawText(tier.desc, {
    x: margin, y: H - margin - 225, size: 10, font: font, color: rgb(0.39, 0.45, 0.51),
    maxWidth: contentW, lineHeight: 14,
  });

  // Date
  const now = new Date();
  page.drawText(`Generated ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: margin, y: margin, size: 9, font: font, color: rgb(0.58, 0.63, 0.69),
  });

  // ── Page 2: Section Breakdown ──
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawText('Section Breakdown', { x: margin, y: H - margin - 20, size: 18, font: bold, color: rgb(0.04, 0.05, 0.06) });

  const sectionKeys = ['B', 'C', 'D', 'E', 'F'];
  const tableTop = H - margin - 55;
  const rowH = 28;
  const labelX = margin;
  const barX = margin + 180;
  const barW = contentW - 240;
  const scoreX = barX + barW + 10;

  // Header row
  page.drawText('Section', { x: labelX, y: tableTop + 2, size: 9, font: bold, color: rgb(0.39, 0.45, 0.51) });
  page.drawText('Score', { x: scoreX, y: tableTop + 2, size: 9, font: bold, color: rgb(0.39, 0.45, 0.51) });

  // Separator
  page.drawLine({
    start: { x: labelX, y: tableTop - 6 },
    end: { x: labelX + contentW, y: tableTop - 6 },
    thickness: 1, color: rgb(0.89, 0.91, 0.93),
  });

  sectionKeys.forEach((k, i) => {
    const y = tableTop - rowH * (i + 1);
    const s = sectionScores[k];
    const name = sectionNames[k] || SECTIONS[k].label;

    page.drawText(name, { x: labelX, y: y + 2, size: 10, font: font, color: rgb(0.04, 0.05, 0.06) });
    page.drawText(`${s}`, { x: scoreX, y: y + 2, size: 10, font: bold, color: rgb(0.04, 0.05, 0.06) });

    // Bar background
    page.drawRectangle({
      x: barX, y: y + 2, width: barW, height: 12,
      color: rgb(0.93, 0.94, 0.96),
    });

    // Bar fill
    const fillW = Math.round((s / 100) * barW);
    const barColors = [
      rgb(0.09, 0.63, 0.26), // B
      rgb(0.15, 0.39, 0.92), // C
      rgb(0.92, 0.70, 0.03), // D
      rgb(0.98, 0.45, 0.09), // E
      rgb(0.86, 0.15, 0.15), // F
    ];
    page.drawRectangle({
      x: barX, y: y + 2, width: fillW, height: 12,
      color: barColors[i],
    });
  });

  // Overall score row
  const overallY = tableTop - rowH * (sectionKeys.length + 1);
  page.drawLine({
    start: { x: labelX, y: overallY + 14 },
    end: { x: labelX + contentW, y: overallY + 14 },
    thickness: 1, color: rgb(0.89, 0.91, 0.93),
  });
  page.drawText('Overall', { x: labelX, y: overallY - 12, size: 11, font: bold, color: rgb(0.04, 0.05, 0.06) });
  page.drawText(`${score}/100`, { x: scoreX, y: overallY - 12, size: 11, font: bold, color: tierColor });

  // ── Page 3: Recommendations ──
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawText('Recommendations', { x: margin, y: H - margin - 20, size: 18, font: bold, color: rgb(0.04, 0.05, 0.06) });

  let recY = H - margin - 50;
  recommendations.forEach((rec, i) => {
    const lines = wrapText(rec, bold, font, contentW - 20, 10);
    const lineH = lines.length * 15;
    if (recY - lineH < margin) {
      page = doc.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
      recY = H - margin - 20;
    }

    // Number
    page.drawText(`${i + 1}.`, { x: margin, y: recY - 2, size: 10, font: bold, color: rgb(0.15, 0.39, 0.92) });
    // Text
    lines.forEach((line, li) => {
      page.drawText(line, { x: margin + 16, y: recY, size: 10, font: font, color: rgb(0.04, 0.05, 0.06) });
      recY -= 15;
    });
    recY -= 10;
  });

  // ── Page 4+: Scoring Methodology ──
  page = doc.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawText('Scoring Methodology', { x: margin, y: H - margin - 20, size: 18, font: bold, color: rgb(0.04, 0.05, 0.06) });

  const methodology = [
    'The AI Readiness Assessment evaluates your organization across five dimensions:',
    '',
    'Data Maturity (25%) - How your data is stored, managed, and accessed. Includes data types, quality processes, and accessibility. Strong data foundations are critical for any AI initiative.',
    '',
    'AI Governance & Risk (25%) - Your AI policy framework, oversight structure, and formal processes for ethics, bias testing, and model monitoring. Governance is the most common enterprise blocker.',
    '',
    'Technical Readiness (20%) - Your existing infrastructure, cloud maturity, API integration, and in-house AI talent. This measures whether you have the technical foundation to execute.',
    '',
    'Business Readiness (20%) - Executive sponsorship, budget allocation, timeline expectations, and prior AI experience. Shows whether the organization is aligned and committed.',
    '',
    'Security & Compliance (10%) - Data location, classification standards, and third-party vendor vetting. Essential hygiene for regulated industries.',
    '',
    'Each question maps to a numeric score (0-100). Multi-select questions are scored proportionally. Section scores are averaged, then weighted into the final overall score (0-100).',
  ];

  let methY = H - margin - 50;
  methodology.forEach(line => {
    if (methY < margin + 20) {
      page = doc.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
      methY = H - margin - 20;
    }
    if (line === '') {
      methY -= 8;
    } else if (line.endsWith(':')) {
      page.drawText(line, { x: margin, y: methY, size: 10, font: bold, color: rgb(0.04, 0.05, 0.06) });
      methY -= 16;
    } else {
      page.drawText(line, { x: margin, y: methY, size: 10, font: font, color: rgb(0.39, 0.45, 0.51), maxWidth: contentW, lineHeight: 14 });
      methY -= (Math.ceil(line.length / 90) * 14 + 2);
    }
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}

function wrapText(text, boldFont, font, maxWidth, fontSize) {
  // Simple word wrap - splits on space and wraps at ~85 chars for letter page
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).length > 85) {
      lines.push(current);
      current = w;
    } else {
      current = current ? current + ' ' + w : w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Email Helpers ────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function sendEmail({ apiKey, from, to, subject, html, text, attachments }) {
  const body = { from, to, subject, html, text };
  if (attachments) body.attachments = attachments;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('Resend error:', r.status, detail);
    return { ok: false, status: r.status };
  }
  return { ok: true };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill hidden fields
  if (body.website_hp || body.fax) {
    return res.status(200).json({ ok: true });
  }

  // Required fields
  const email = (body.email || '').toString().trim().slice(0, 200);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'A valid email is required.' });
  }

  // Parse answer map
  const a = {};
  ['q5','q6','q7','q8','q9','q10','q11','q12','q13','q14','q15',
   'q16','q17','q18','q19','q20','q21','q22','q23','q24','q25',
   'q26','q27','q28','q29'].forEach(k => {
    a[k] = body[k];
  });

  // q29 = self-reported AI opportunity areas. Not scored; passed through for the team.
  const OPPORTUNITY_LABELS = {
    docautomation: 'Document automation',
    intake: 'Intake and communication',
    knowledge: 'Knowledge assistants',
    opsanalysis: 'Operational analysis',
    execai: 'Personal and executive AI',
    aisetup: 'Business AI setup',
    training: 'Team AI training',
    readiness: 'AI readiness assessment',
    workflow: 'Workflow automation',
    clientcomms: 'Client and patient communication',
    scheduling: 'Scheduling and dispatch support',
    billing: 'Billing and claims preparation',
    proposals: 'Proposal and contract drafting',
    research: 'Research and competitive intelligence',
    agents: 'Custom AI agent development',
    strategy: 'AI strategy and roadmap',
  };
  const opportunityAreas = (Array.isArray(a.q29) ? a.q29 : (a.q29 ? [a.q29] : []))
    .map(v => OPPORTUNITY_LABELS[v])
    .filter(Boolean);

  // Optional fields
  const company = (body.company || '').toString().trim().slice(0, 200);
  const name = (body.name || '').toString().trim().slice(0, 200);
  const phone = (body.phone || '').toString().trim().slice(0, 80);
  const industry = (body.industry || '').toString().trim().slice(0, 100);
  const role = (body.role || '').toString().trim().slice(0, 100);
  const companySize = (body.companySize || '').toString().trim().slice(0, 50);

  // ── Calculate scores ──
  const sectionScores = {
    B: scoreDataMaturity(a),
    C: scoreGovernance(a),
    D: scoreTechnical(a),
    E: scoreBusiness(a),
    F: scoreSecurity(a),
  };

  const sectionNames = {
    B: 'Data Maturity',
    C: 'AI Governance & Risk',
    D: 'Technical Readiness',
    E: 'Business Readiness',
    F: 'Security & Compliance',
  };

  const overall = Math.round(
    sectionScores.B * 0.25 + sectionScores.C * 0.25 +
    sectionScores.D * 0.20 + sectionScores.E * 0.20 + sectionScores.F * 0.10
  );

  const tier = getTier(overall);
  const recommendations = generateRecommendations(sectionScores, a);

  // ── Generate PDF ──
  // Fetch logo from the deployed site
  let logoBase64 = null;
  try {
    const logoResp = await fetch('https://www.futureinsites.com/images/fis-logo-transparent-200.png');
    if (logoResp.ok) {
      const logoBuffer = await logoResp.arrayBuffer();
      logoBase64 = Buffer.from(logoBuffer).toString('base64');
    }
  } catch (e) {
    // Logo is optional -- proceed without it
  }

  const pdfBytes = await generatePdf(overall, tier, sectionScores, sectionNames, recommendations, logoBase64);
  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

  // ── Send emails ──
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.INQUIRY_FROM || 'FutureInSites <forms@futureinsites.com>';
  const FIS_TEAM_TO = process.env.AI_READINESS_TO || 'gregl@futureinsites.com,randalk@futureinsites.com,jeffh@futureinsites.com';
  const fisEmails = FIS_TEAM_TO.split(',').map(s => s.trim()).filter(Boolean);

  if (!RESEND_API_KEY) {
    console.error('ai-readiness: RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Server is not configured to send mail yet.' });
  }

  // ── Email 1: To the user ──
  const userHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#140F0F;font-size:14px;line-height:1.55;max-width:600px;margin:0 auto;">
      <div style="padding:24px 0;border-bottom:1px solid #E4E7EE;margin-bottom:20px;">
        <img src="https://www.futureinsites.com/images/fis-logo-transparent-200.png" alt="FutureInSites" style="height:40px;width:auto;" />
      </div>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px 0;">Your AI Readiness Results</h1>
      <p style="color:#64748B;margin:0 0 20px 0;">Based on the assessment you completed at futureinsites.com</p>

      <div style="background:#F8F9FB;border-radius:12px;padding:24px;margin-bottom:20px;">
        <div style="font-size:13px;color:#64748B;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:8px;">Overall Score</div>
        <div style="font-size:48px;font-weight:800;color:#0B0C10;">${overall}<span style="font-size:18px;color:#64748B;font-weight:400;">/100</span></div>
        <div style="font-size:16px;font-weight:700;color:${tier.color};margin:4px 0 8px 0;">${tier.label}</div>
        <p style="color:#64748B;font-size:13px;line-height:1.5;margin:0;">${tier.desc}</p>
      </div>

      <h2 style="font-size:16px;font-weight:700;margin:0 0 12px 0;">Section Scores</h2>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${Object.entries(sectionNames).map(([k, v]) => {
          const s = sectionScores[k];
          const pct = s * 0.85 + 15; // bar fill doesn't go below 15%
          const barColors = { B: '#16A34A', C: '#2563EB', D: '#EAB308', E: '#F97316', F: '#DC2626' };
          return `
            <tr>
              <td style="padding:6px 12px 6px 0;font-size:13px;color:#0B0C10;width:180px;">${escapeHtml(v)}</td>
              <td style="padding:6px 0;">
                <div style="background:#E4E7EE;border-radius:4px;height:10px;overflow:hidden;">
                  <div style="background:${barColors[k]};border-radius:4px;height:10px;width:${pct}%;"></div>
                </div>
              </td>
              <td style="padding:6px 0 6px 10px;font-size:13px;font-weight:700;color:#0B0C10;width:36px;">${s}</td>
            </tr>`;
        }).join('')}
      </table>

      <h2 style="font-size:16px;font-weight:700;margin:0 0 12px 0;">Recommendations</h2>
      <ol style="color:#64748B;font-size:13px;line-height:1.6;padding-left:20px;margin:0 0 24px 0;">
        ${recommendations.map(r => `<li style="margin-bottom:6px;">${escapeHtml(r)}</li>`).join('')}
      </ol>

      <p style="margin:24px 0 0 0;">
        <a href="https://www.futureinsites.com" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;padding:10px 24px;border-radius:100px;font-size:13px;font-weight:600;">Visit FutureInSites</a>
      </p>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px;border-top:1px solid #E4E7EE;padding-top:16px;">
        This report was generated automatically from your AI Readiness Assessment submission. Your responses were used only to generate this report and were not stored.
      </p>
    </div>
  `;

  const userText = [
    `Your AI Readiness Results`,
    ``,
    `Score: ${overall}/100`,
    `Tier: ${tier.label}`,
    ``,
    `Section Scores:`,
    ...Object.entries(sectionNames).map(([k, v]) => `  ${v}: ${sectionScores[k]}`),
    ``,
    `Recommendations:`,
    ...recommendations.map((r, i) => `${i + 1}. ${r}`),
    ``,
    `Full report attached as PDF.`,
    ``,
    `futureinsites.com`,
  ].join('\n');

  const pdfAttachment = {
    filename: `AI-Readiness-Report-${overall}.pdf`,
    content: pdfBase64,
    content_type: 'application/pdf',
  };

  const userResult = await sendEmail({
    apiKey: RESEND_API_KEY,
    from: FROM,
    to: [email],
    subject: `Your AI Readiness Assessment Results -- Score: ${overall}/100`,
    html: userHtml,
    text: userText,
    attachments: [pdfAttachment],
  });

  if (!userResult.ok) {
    return res.status(502).json({ ok: false, error: 'Could not send results email. Please try again.' });
  }

  // ── Email 2: To FIS team ──
  const answersSummary = Object.entries(a)
    .filter(([k]) => k.startsWith('q'))
    .map(([k, v]) => {
      const val = Array.isArray(v) ? v.join(', ') : String(v);
      return `${k}: ${val}`;
    })
    .join('\n');

  const fisHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#140F0F;font-size:14px;line-height:1.55;">
      <h2 style="margin:0 0 4px 0;">New AI Readiness Submission</h2>
      <p style="color:#64748B;margin:0 0 16px 0;">${tier.label} | Score: ${overall}/100</p>

      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px 0;">
        ${[['Name', name], ['Email', email], ['Phone', phone], ['Company', company],
           ['Industry', industry], ['Company Size', companySize], ['Role', role],
           ['Tier', tier.label], ['Score', `${overall}/100`]].filter(([_, v]) => v).map(([k, v]) => `
          <tr>
            <td style="padding:3px 14px 3px 0;color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;">${k}</td>
            <td style="padding:3px 0;color:#140F0F;">${escapeHtml(v)}</td>
          </tr>
        `).join('')}
      </table>

      <div style="border-top:1px solid #E4E7EE;padding-top:12px;margin-bottom:16px;">
        <div style="color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;margin-bottom:6px;">Section Scores</div>
        ${Object.entries(sectionNames).map(([k, v]) => `<div style="font-size:13px;">${escapeHtml(v)}: ${sectionScores[k]}</div>`).join('')}
      </div>

      <div style="border-top:1px solid #E4E7EE;padding-top:12px;margin-bottom:16px;">
        <div style="color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;margin-bottom:6px;">Recommendations</div>
        <ol style="color:#140F0F;font-size:13px;padding-left:18px;margin:0;">
          ${recommendations.map(r => `<li style="margin-bottom:4px;">${escapeHtml(r)}</li>`).join('')}
        </ol>
      </div>

      ${opportunityAreas.length ? `
      <div style="border-top:1px solid #E4E7EE;padding-top:12px;margin-bottom:16px;">
        <div style="color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;margin-bottom:6px;">Where They Think AI Could Help</div>
        <ul style="color:#140F0F;font-size:13px;padding-left:18px;margin:0;">
          ${opportunityAreas.map(o => `<li style="margin-bottom:4px;">${escapeHtml(o)}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div style="border-top:1px solid #E4E7EE;padding-top:12px;">
        <div style="color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;margin-bottom:6px;">Raw Answers</div>
        <pre style="font-size:11px;color:#64748B;white-space:pre-wrap;margin:0;">${escapeHtml(answersSummary)}</pre>
      </div>

      <p style="margin-top:18px;color:#94a3b8;font-size:12px;">Submitted via the AI Readiness Assessment on futureinsites.com/ai-readiness</p>
    </div>
  `;

  const fisText = [
    `New AI Readiness Submission`,
    `Tier: ${tier.label} | Score: ${overall}/100`,
    ``,
    ...`Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company}\nIndustry: ${industry}\nCompany Size: ${companySize}\nRole: ${role}`.split('\n').filter(l => !l.endsWith(': ')),
    ``,
    `Section Scores:`,
    ...Object.entries(sectionNames).map(([k, v]) => `  ${v}: ${sectionScores[k]}`),
    ``,
    `Recommendations:`,
    ...recommendations.map((r, i) => `${i + 1}. ${r}`),
    ``,
    ...(opportunityAreas.length
      ? [`Where They Think AI Could Help:`, ...opportunityAreas.map(o => `  - ${o}`), ``]
      : []),
    `Raw Answers:`,
    answersSummary,
    ``,
    `Submitted via futureinsites.com/ai-readiness`,
  ].join('\n');

  const fisResult = await sendEmail({
    apiKey: RESEND_API_KEY,
    from: FROM,
    to: fisEmails,
    subject: `AI Readiness: ${company || 'Anonymous'} | ${tier.label} | Score: ${overall}/100`,
    html: fisHtml,
    text: fisText,
    attachments: [pdfAttachment], // share the same PDF
  });

  if (!fisResult.ok) {
    console.error('ai-readiness: FIS team email failed but user email sent');
  }

  // Return score + tier so the page can show results inline without a redirect
  return res.status(200).json({
    ok: true,
    score: overall,
    tier: tier,
    sectionScores: sectionScores,
    sectionNames: sectionNames,
    recommendations: recommendations,
  });
};
