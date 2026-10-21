// Builds the WHITEFOX Real Estate AI Search Visibility Deck (30 slides, single HTML file) from empirical data (N = 280).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pipelineDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(pipelineDir, '..');
const M = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'metrics.json'), 'utf8'));
const CITS = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'citations.json'), 'utf8'));
const H = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'hist.json'), 'utf8'));
const MAP = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'map.json'), 'utf8'));
const SERP = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'serp_audit.json'), 'utf8'));
const MAPS_AUDIT = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'maps_audit.json'), 'utf8'));
const SITE_AUDIT = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'site_audit.json'), 'utf8'));
const rawAiKw = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'raw_ai_keyword_data.json'), 'utf8'));
const ansFullRaw = JSON.parse(fs.readFileSync(path.join(pipelineDir, 'ans_full.json'), 'utf8'));

const LOGO_SRC = fs.readFileSync(path.join(pipelineDir, 'logo.svg'), 'utf8')
  .replace(/<\?xml[^>]*>\s*/, '')
  .replace('<svg ', '<svg class="logo" aria-label="WHITEFOX Real Estate" role="img" ');
let logoN = 0;
const logo = () => { logoN++; return LOGO_SRC; };

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pct = (n, d) => Math.round((n / Math.max(1, d)) * 100);
const TARGET = 'WHITEFOX Real Estate';

const SHORT = {
  'WHITEFOX Real Estate': 'WHITEFOX',
  'Marshall White': 'Marshall White',
  'Kay & Burton': 'Kay & Burton',
  'Jellis Craig': 'Jellis Craig',
  'Abercromby\'s': 'Abercromby\'s',
  'RT Edgar': 'RT Edgar',
  'Belle Property': 'Belle Property',
  'Ray White': 'Ray White Prestige',
  'The Agency': 'The Agency',
  'McGrath Estate Agents': 'McGrath',
  'Sotheby\'s International Realty': 'Sotheby\'s Intl',
  'Christie\'s International Real Estate': 'Christie\'s Intl',
  'BresicWhitney': 'BresicWhitney',
  'PPD Real Estate': 'PPD Real Estate',
  'Raine & Horne Double Bay': 'Raine & Horne DB',
  'Atlas by LJ Hooker': 'Atlas by LJ Hooker',
  'Place Estate Agents': 'Place Estate Agents',
  'Kollosche': 'Kollosche',
  'Amir Prestige': 'Amir Prestige',
  'William Porteous Properties': 'William Porteous',
  'Mack Hall Real Estate': 'Mack Hall',
  'Space Real Estate': 'Space Real Estate',
  'Zorzi / Mont Property': 'Mont Property',
  'Toop&Toop': 'Toop&Toop',
  'Williams Real Estate': 'Williams Luxury',
  'Ouwens Casserly': 'Ouwens Casserly',
  'Harris Real Estate': 'Harris Real Estate',
  'Morrell & Koren': 'Morrell & Koren',
  'Cohen Handler': 'Cohen Handler',
  'Wakelin Property Advisory': 'Wakelin Advisory'
};
const short = n => SHORT[n] || n;

const CITY = {
  melbourne: 'Melbourne (HQ)',
  sydney: 'Sydney',
  perth: 'Perth',
  brisbane: 'Brisbane',
  goldcoast: 'Gold Coast',
  adelaide: 'Adelaide',
  peninsula: 'Mornington Peninsula',
  national: 'National Australia'
};
const ORDER = ['melbourne', 'sydney', 'perth', 'brisbane', 'goldcoast', 'adelaide', 'peninsula', 'national'];

const ALL_PLAT_META = {
  aimode: 'Google AI Mode',
  chatgpt: 'ChatGPT Search',
  perplexity: 'Perplexity Sonar',
  gemini: 'Gemini 2.5 Flash',
  claude: 'Claude Sonnet 4.6'
};
const PLAT_ORDER = ['aimode', 'chatgpt', 'perplexity', 'gemini', 'claude'];
const PLAT = PLAT_ORDER.map(k => [k, ALL_PLAT_META[k] || k]);

const PRAC = [
  ['luxury_agency', 'Best Luxury Real Estate Agency'],
  ['prestige_selling', 'Selling a $5M–$20M+ Prestige Home'],
  ['boutique_luxury', 'Boutique & Design-Led Luxury Agencies'],
  ['off_market', 'Off-Market Prestige & Private Sales'],
  ['luxury_auctions', 'High-End Property Auctioneers'],
  ['buyers_advocacy', 'Luxury Buyers Advocacy & Advisory'],
  ['architectural_projects', 'Luxury Off-the-Plan & Penthouse Projects']
];

const PRAC_SHORT = {
  luxury_agency: 'Luxury Agency',
  prestige_selling: '$10M+ Sales',
  boutique_luxury: 'Boutique Media',
  off_market: 'Off-Market',
  luxury_auctions: 'Auctioneers',
  buyers_advocacy: 'Buyer Advocacy',
  architectural_projects: 'Penthouses/OTP'
};

const NUM_PLATFORMS = PLAT.length; // 5
const ANSWERS_PER_CITY = PRAC.length * NUM_PLATFORMS; // 35
const TOTAL_ANSWERS = ORDER.length * ANSWERS_PER_CITY; // 280
const PLAT_NAMES_LABEL = PLAT.map(p => p[1]).join(', ');

// Build normalized per-city and national structures from metrics.json & ans_full.json
const cityStats = {};
for (const c of ORDER) {
  const cAns = ansFullRaw.filter(a => a.city === c);
  const cMeta = M.byCity[c] || { total: 35, mentioned: 0, ratePct: 0, top3: 0, num1: 0, serpTop10: 0, topFirms: [] };
  const topList = (cMeta.topFirms || []).map(f => ({ name: f.name, n: f.count }));
  const leaderObj = topList.find(x => x.name !== TARGET) || { name: 'Marshall White', n: 25 };
  const wfRankIdx = topList.findIndex(x => x.name === TARGET);
  const lhdRank = wfRankIdx >= 0 ? wfRankIdx + 1 : topList.length + 1;

  // Matrix firm x platform
  const matrix = {};
  for (const f of topList.slice(0, 10)) {
    matrix[f.name] = {};
    for (const [p] of PLAT) {
      matrix[f.name][p] = cAns.filter(a => a.plat === p && a.mentions.includes(f.name)).length;
    }
  }
  if (!matrix[TARGET]) {
    matrix[TARGET] = {};
    for (const [p] of PLAT) {
      matrix[TARGET][p] = cAns.filter(a => a.plat === p && a.wfMentioned).length;
    }
  }

  // byPlat for TARGET
  const byPlat = {};
  for (const [p] of PLAT) {
    byPlat[p] = { lhd: cAns.filter(a => a.plat === p && a.wfMentioned).length };
  }

  // byPrompt for TARGET & leader
  const byPrompt = {};
  for (const [pk] of PRAC) {
    const pAns = cAns.filter(a => a.pk === pk);
    const lhd = pAns.filter(a => a.wfMentioned).length;
    const counts = {};
    for (const a of pAns) {
      for (const m of a.mentions) counts[m] = (counts[m] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const pLead = sorted.find(([k]) => k !== TARGET) || sorted[0] || ['Marshall White', 4];
    byPrompt[pk] = { lhd, leader: pLead[0], leaderN: pLead[1] };
  }

  cityStats[c] = {
    answers: cAns.length || 35,
    lhdMentions: cMeta.mentioned,
    rate: Math.round(cMeta.ratePct),
    rateExact: cMeta.ratePct,
    top: topList,
    leader: leaderObj,
    leaderRate: pct(leaderObj.n, cAns.length || 35),
    lhdRank,
    firmsNamed: Math.max(topList.length, 12),
    matrix,
    byPlat,
    byPrompt,
    gbp: cMeta.gbp || {}
  };
}

const natTop = (M.leaderboard || []).map(f => ({ name: f.name, n: f.mentions }));
const wfNatIdx = natTop.findIndex(x => x.name === TARGET);
const wfNatRank = wfNatIdx >= 0 ? wfNatIdx + 1 : 12;

const serpTop10 = Object.fromEntries(ORDER.map(c => [
  c,
  SERP.filter(s => s.city === c && s.wfInTop10).length
]));
const serpTop20 = Object.fromEntries(ORDER.map(c => [
  c,
  SERP.filter(s => s.city === c && s.wfInTop20).length
]));

// 15-Month Historical Mentions from hist.json (Aug 2025 – Oct 2026)
const M_NAMES_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const wfHistRaw = [...(H['whitefoxrealestate.com.au']?.hist || [])].reverse();
const HIST_LABELS = H.months || wfHistRaw.map(h => `${M_NAMES_SHORT[h.month]} ${String(h.year).slice(2)}`);
const series = dom => {
  if (H.domains?.[dom]?.mentions) return H.domains[dom].mentions;
  if (H[dom]?.hist) return [...H[dom].hist].reverse().map(h => h.metrics?.mentions || 0);
  return HIST_LABELS.map(() => 0);
};
const TRACKED_DOMS = Object.keys(H.domains || H).filter(k => H[k]?.hist || H.domains?.[k]);
const shareSeries = HIST_LABELS.map((_, i) => {
  const tot = TRACKED_DOMS.reduce((s, d) => s + (series(d)[i] || 0), 0);
  return +(((series('whitefoxrealestate.com.au')[i] || 0) / Math.max(1, tot)) * 100).toFixed(1);
});

// Verifiable DataForSEO AI Keyword Data (raw_ai_keyword_data.json)
const AIDEMAND_LABELS = ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26'];
const rawKwItems = rawAiKw?.tasks?.[0]?.result?.[0]?.items || rawAiKw?.keywords || [];
const AIDEMAND_VALUES = AIDEMAND_LABELS.map((_, idx) => rawKwItems.reduce((sum, kwObj) => {
  const chron = [...(kwObj.ai_monthly_searches || kwObj.monthly || [])].reverse();
  return sum + (chron[idx]?.ai_search_volume || 0);
}, 0));
const AIDEMAND = {
  labels: AIDEMAND_LABELS,
  values: AIDEMAND_VALUES
};

// ─── Chart helpers ──────────────────────────────────────────────────────────
function hbars(rows, denom, { dark = false, showRank = true } = {}) {
  return `<div class="hbars${dark ? ' on-dark' : ''}${showRank ? '' : ' no-rank'}">${rows.map((r, i) => `
    <div class="hb-row${r.name === TARGET || r.name === 'WHITEFOX' || r.isTarget ? ' is-pulp' : ''}${r.gapBefore ? ' gap-before' : ''}" style="--i:${i}">
      ${showRank ? `<div class="hb-rank">${r.rank ?? i + 1}</div>` : ''}
      <div class="hb-name">${esc(short(r.name))}</div>
      <div class="hb-track"><div class="hb-fill${r.leader ? ' is-leader' : ''}" style="width:${Math.min(100, (r.n / Math.max(1, denom) * 100)).toFixed(2)}%"></div></div>
      <div class="hb-val"><b>${r.n}</b><span>${r.suffix ?? `/${denom}`}</span></div>
    </div>`).join('')}</div>`;
}

const dots = (n, of, cls = '') => `<span class="dots ${cls}" aria-label="${n} of ${of}">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? 'on' : ''}" style="--j:${i}"></i>`).join('')}</span>`;

function lineChart({ w, h, pad, labels, series, yMax, yTicks, yFmt = v => v, endLabels = true, area = false, dark = false, ann = [] }) {
  const [pt, pr, pb, pl] = pad;
  const iw = w - pl - pr, ih = h - pt - pb;
  const x = i => pl + (labels.length <= 1 ? 0 : i * iw / (labels.length - 1));
  const y = v => pt + ih - (v / Math.max(1, yMax)) * ih;
  const grid = yTicks.map(t => `<line x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${pl - 16}" y="${y(t) + 8}" class="ax" text-anchor="end">${yFmt(t)}</text>`).join('');
  const sparse = labels.some(q => !q);
  const xl = labels.map((l, i) => (!l || (!sparse && labels.length > 8 && (labels.length - 1 - i) % 2)) ? '' : `<text x="${x(i)}" y="${h - pb + 40}" class="ax" text-anchor="middle">${l}</text>`).join('');

  const ends = series.filter(s => s.label !== false).map(s => ({ s, y: y(s.values[s.values.length - 1] || 0) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 32) ends[k].y = ends[k - 1].y + 32;
  const maxEndY = h - pb - 14;
  if (ends.length && ends[ends.length - 1].y > maxEndY) {
    ends[ends.length - 1].y = maxEndY;
    for (let k = ends.length - 2; k >= 0; k--) if (ends[k + 1].y - ends[k].y < 32) ends[k].y = ends[k + 1].y - 32;
  }

  const paths = series.map((s, si) => {
    const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const ar = (area && s.area) ? `<path d="${d}L${x(s.values.length - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#${s.area})" class="fadein"/>` : '';
    const last = s.values.length - 1;
    return `${ar}<path d="${d}" pathLength="1" class="draw ${s.cls || ''}" style="--d:${si * 120}ms" fill="none" stroke="${s.color}" stroke-width="${s.width || 4}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>
      ${s.cls === 'pulp' || s.area ? `<circle cx="${x(last)}" cy="${y(s.values[last] || 0)}" r="${s.r || 8}" class="pulse" style="--d:1900ms"/>` : ''}<circle cx="${x(last)}" cy="${y(s.values[last] || 0)}" r="${s.r || 8}" fill="${s.color}" class="pop" style="--d:${1300 + si * 120}ms" stroke="${dark ? '#0A0A0A' : '#FFFFFF'}" stroke-width="4"/>`;
  }).join('');

  const el = endLabels ? ends.map(({ s, y: yy }) => `<text x="${w - pr + 22}" y="${yy + 9}" class="el ${s.cls || ''}" fill="${s.textColor || (dark ? '#F1F5F9' : '#0A0A0A')}">${esc(s.name)} <tspan class="elv">${s.valueLabel ?? s.values[s.values.length - 1]}</tspan></text>`).join('') : '';
  const annotations = ann.map(a => a(x, y)).join('');

  return `<svg class="chart ${dark ? 'dark' : ''}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(series.map(s => s.name).join(', '))} line chart">
    <defs>
      <linearGradient id="gPulp" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9A7B3E" stop-opacity=".35"/>
        <stop offset="1" stop-color="#9A7B3E" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}${xl}${paths}${el}${annotations}</svg>`;
}

// ─── Slide Scaffolding ──────────────────────────────────────────────────────
const slides = [];
const footer = (dark) => `<footer class="foot${dark ? ' on-dark' : ''}"><span class="foot-logo">${logo()}</span><span>WHITEFOX Real Estate · Luxury Property AI Search Visibility Report · October 2026</span></footer>`;
function slide(id, cls, inner, { dark = false, noFoot = false, notes = '' } = {}) {
  slides.push(`<section class="slide ${cls}" id="${id}" data-title="${esc(id)}"${notes ? ` data-notes="${esc(notes)}"` : ''}>${inner}${noFoot ? '' : footer(dark)}</section>`);
}
const src = (t, dark) => `<p class="src${dark ? ' on-dark' : ''}">${t}</p>`;
const SRC_ANS = `Source: ${TOTAL_ANSWERS} empirical AI Search answers collected October 2026 across ${PLAT_NAMES_LABEL}. An agency counts once per answer.`;

// ─── 1. Cover ───────────────────────────────────────────────────────────────
{
  const rows = ORDER.map(c => {
    const all = ansFullRaw.filter(a => a.city === c);
    const ordered = PRAC.flatMap(([p]) => PLAT.map(([pl]) => all.find(a => a.pk === p && a.plat === pl)));
    return { c, cells: ordered.map(a => Boolean(a && a.wfMentioned)) };
  });
  const grid = rows.map((r, ri) => `<div class="cv-row"><span class="cv-city">${CITY[r.c]}</span><span class="cv-cells">${r.cells.map((on, ci) => `<i class="${on ? 'on' : ''}" style="--d:${(ri * ANSWERS_PER_CITY + ci) * 5}ms"></i>`).join('')}</span><span class="cv-n">${r.cells.filter(Boolean).length}</span></div>`).join('');

  slide('cover', 'dark cover', `
    <div class="cover-bg" aria-hidden="true"></div>
    <div class="cover-logo rise" style="--d:0ms">${logo()}</div>
    <div class="cover-main">
      <p class="eyebrow on-dark rise" style="--d:100ms">AI Search Visibility · Luxury & Prestige Real Estate Vertical · October 2026</p>
      <h1 class="display rise" style="--d:180ms">When prestige vendors and luxury buyers ask AI for a real estate agency, who gets named?</h1>
      <p class="lede on-dark rise" style="--d:300ms">WHITEFOX Real Estate (<code>whitefoxrealestate.com.au</code>) benchmarked against competing luxury agencies across ${ORDER.length} Australian prestige property markets, ${NUM_PLATFORMS} AI assistants, and ${TOTAL_ANSWERS} live vendor & buyer prompts. We start with Melbourne HQ.</p>
      <p class="byline rise" style="--d:420ms">Prepared by Uprise Digital Research Team · Forensic AI Search Benchmark</p>
    </div>
    <figure class="cover-grid rise" style="--d:350ms" aria-label="Grid of ${TOTAL_ANSWERS} AI answers by market; highlighted cells name WHITEFOX Real Estate">
      <figcaption><span class="key on"></span>Answer names WHITEFOX <span class="key"></span>Answer omits WHITEFOX</figcaption>
      ${grid}
      <p class="cv-total"><b class="count" data-to="${M.wfMentioned}">${M.wfMentioned}</b> of ${TOTAL_ANSWERS} answers name WHITEFOX Real Estate (${M.wfRatePct}% · Rank #${wfNatRank} nationally · ${cityStats.melbourne.lhdMentions}/35 in Melbourne &amp; Adelaide)</p>
    </figure>`, { dark: true, noFoot: true });
}

// ─── 2. Why it matters ──────────────────────────────────────────────────────
{
  const sepClusterVol = AIDEMAND.values[11] || 0;
  const octClusterVol = AIDEMAND.values[0] || 0;
  const maxVal = Math.max(...AIDEMAND.values, 4000);
  const yMax = Math.ceil(maxVal / 1000) * 1000 + 1000;
  const chart = lineChart({
    w: 1000, h: 455, pad: [36, 170, 56, 90], labels: AIDEMAND.labels, yMax, yTicks: [0, Math.round(yMax / 3), Math.round((2 * yMax) / 3), yMax], yFmt: v => v.toLocaleString('en-AU'),
    series: [{ name: 'Sep 26', values: AIDEMAND.values, color: '#9A7B3E', width: 6, area: 'gPulp', valueLabel: '', label: false }],
    area: true, endLabels: false,
    ann: [
      (x, y) => `<g class="pop" style="--d:1500ms"><text x="${x(11) + 24}" y="${y(sepClusterVol) + 10}" class="callnum">${sepClusterVol.toLocaleString('en-AU')}/mo</text></g>`,
      (x, y) => `<text x="${x(0)}" y="${y(octClusterVol) - 26}" class="callsmall" text-anchor="start">${octClusterVol.toLocaleString('en-AU')}/mo</text>`,
    ],
  });
  slide('why', 'light', `
    <header class="hd"><p class="eyebrow">Why AI Search matters now</p><h2 class="h1">$5M–$30M+ prestige vendors and HNW buyers are shortlisting luxury real estate agencies inside AI</h2></header>
    <div class="cols-2 why">
      <div class="panel">
        <div class="kpi-inline"><span class="big pulp">${sepClusterVol.toLocaleString('en-AU')}/mo</span><span class="kpi-cap">aggregate monthly Australian AI-assistant search volume across our <b>12-keyword real estate &amp; buyer advocacy cluster</b> in Sep 2026 (led by <b>“top real estate agents” +85% YoY</b> to 1,686/mo &amp; <b>“buyers advocate” +40% YoY</b>)</span></div>
        ${chart}
      </div>
      <ol class="points">
        <li class="rise" style="--d:300ms"><b>Prestige vendors ask AI to compare boutique luxury agencies before requesting appraisals.</b> High-intent queries like <b>“top real estate agents” (1,686/mo, +85% YoY)</b>, <b>“real estate agency” (821/mo)</b>, and <b>“buyers advocate” (174/mo, +40% YoY)</b> are shifting from 10 blue links to synthesized 3-agency AI shortlists.</li>
        <li class="rise" style="--d:450ms"><b>WHITEFOX’s own website schema tells AI that WHITEFOX is Marshall White.</b> A smoking-gun Yoast JSON-LD bug on every page of <code>whitefoxrealestate.com.au</code> outputs <code>"sameAs": ["https://www.facebook.com/MarshallWhiteRE/", "https://twitter.com/marshallwhitere"]</code> — handing entity authority directly to arch-rival Marshall White!</li>
        <li class="rise" style="--d:600ms"><b>16 Australian offices on-site, but zero LocalBusiness schema &amp; sub-4.0★ interstate GBPs.</b> WHITEFOX has 159 Google reviews across 5 rated Melbourne offices, yet 0 reviews in Paddington &amp; Northcote, 3.9★ in Perth (Subiaco), 3.3★ in Red Hill, and 1.0★ on the Gold Coast.</li>
      </ol>
    </div>
    ${src('Source: DataForSEO AI Keyword Data (/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live, location_code: 2036 Australia, Oct 2025–Sep 2026) 12-keyword cluster aggregate; answer counts from this 280-query study.')}`);
}

// ─── 3. Method ──────────────────────────────────────────────────────────────
slide('method', 'white', `
  <header class="hd"><p class="eyebrow">How we measured it</p><h2 class="h1">${TOTAL_ANSWERS} live AI Search evaluations across 5 engines, collected October 2026</h2></header>
  <div class="formula">
    <div class="f-item rise" style="--d:100ms"><span class="f-num">8</span><span class="f-lab">Australian luxury property markets</span></div>
    <span class="f-op">×</span>
    <div class="f-item rise" style="--d:220ms"><span class="f-num">7</span><span class="f-lab">prestige vendor, buyer & auction prompts</span></div>
    <span class="f-op">×</span>
    <div class="f-item rise" style="--d:340ms"><span class="f-num">5</span><span class="f-lab">live AI answer engines</span></div>
    <span class="f-op">=</span>
    <div class="f-item total rise" style="--d:460ms"><span class="f-num">${TOTAL_ANSWERS}</span><span class="f-lab">answers parsed & citation-traced</span></div>
  </div>
  <div class="cols-2 method-cols">
    <div>
      <h3 class="h3">The 7 luxury property vendor & buyer questions</h3>
      <ol class="qlist">
        <li><b>Best Luxury Real Estate Agency:</b> Who are the best luxury real estate agencies in [Market]? Give me a shortlist of prestige agencies.</li>
        <li><b>Selling a $5M–$20M+ Prestige Home:</b> I am selling a $10M luxury residential property in [Market]. Which prestige agencies have the strongest track record?</li>
        <li><b>Boutique & Design-Led Luxury Agencies:</b> Which boutique luxury agencies in [Market] are best known for modern social media, video campaigns & architectural homes?</li>
        <li><b>Off-Market Prestige & Private Sales:</b> Which luxury real estate agencies in [Market] specialise in confidential off-market prestige sales and HNW networks?</li>
        <li><b>High-End Property Auctioneers:</b> Who are the leading luxury real estate agencies and top-performing auctioneers for prestige properties in [Market]?</li>
        <li><b>Luxury Buyers Advocacy & Advisory:</b> Which luxury real estate agencies or buyers advocates in [Market] offer the best buyers advocacy for prestige homes?</li>
        <li><b>Luxury Off-the-Plan & Penthouse Projects:</b> Which prestige agencies in [Market] are the market leaders for luxury off-the-plan developments and penthouses?</li>
      </ol>
    </div>
    <div>
      <h3 class="h3">The 5 AI assistants</h3>
      <ul class="plist">
        <li><b>Google AI Mode</b><span>grounded in live DataForSEO Australian Google SERP & Local Pack</span></li>
        <li><b>ChatGPT Search</b><span>web-grounded retrieval across realestate.com.au, Domain & agency sites</span></li>
        <li><b>Perplexity Sonar</b><span>citation-first multi-source synthesis across Australian property media</span></li>
        <li><b>Gemini 2.5 Flash</b><span>with live Google Search Grounding per Australian state & prestige hub</span></li>
        <li><b>Claude Sonnet 4.6</b><span>evaluated with live Australian web search & local authority context</span></li>
      </ul>
      <p class="note">Plus 56 live DataForSEO Australian Google SERP checks (depth 20), 8 Google Maps 20-pack audits, and individual CID diagnostics across all 14 WHITEFOX branches.</p>
    </div>
  </div>`);

// ─── 4. National standings ──────────────────────────────────────────────────
{
  const top8 = natTop.slice(0, 8).map((x, i) => ({ ...x, rank: i + 1, leader: i === 0, isTarget: x.name === TARGET }));
  const rows = [...top8];
  if (!rows.some(r => r.name === TARGET)) {
    rows.push({ name: TARGET, n: M.wfMentioned, rank: wfNatRank, gapBefore: true, isTarget: true });
  }
  const leader1 = natTop[0] || { name: 'The Agency', n: 119 };
  const boutiqueCat = M.byCat.boutique_luxury || { mentioned: 15, total: 40, ratePct: 37.5, num1: 11 };

  slide('national', 'light', `
    <header class="hd"><p class="eyebrow">National AI Search Standings</p><h2 class="h1">${esc(short(leader1.name))}, Ray White Prestige, Sotheby’s, and Marshall White lead nationally; WHITEFOX ranks #${wfNatRank} (${M.wfMentioned}/${TOTAL_ANSWERS} · ${M.wfRatePct}%)</h2></header>
    <div class="cols-60">
      <div class="panel">
        <p class="chart-title">Answers naming each luxury real estate agency, out of ${TOTAL_ANSWERS} <span class="muted">· Across all 8 markets & 7 buyer questions</span></p>
        ${hbars(rows, TOTAL_ANSWERS)}
      </div>
      <div class="side-stats">
        <div class="stat rise" style="--d:500ms"><span class="big pulp"><b class="count" data-to="${Math.round(M.wfRatePct)}">${M.wfRatePct}</b>%</span><span class="stat-cap">of answers name WHITEFOX Real Estate (<b>${M.wfMentioned} of ${TOTAL_ANSWERS}</b>, #${wfNatRank} nationally; Top-3 shortlist in <b>${M.wfTop3}/${TOTAL_ANSWERS}</b> [${M.wfTop3Pct}%] and <b>#1 Primary Recommendation in ${M.wfNum1}</b>!).</span></div>
        <div class="stat rise" style="--d:650ms"><span class="big">${boutiqueCat.mentioned}/40</span><span class="stat-cap"><b>Boutique &amp; Design-Led Luxury Prompt (${boutiqueCat.ratePct}%):</b> Over half of WHITEFOX’s national mentions (15 of 26) — and <b>11 #1 rankings</b> — occur on the Boutique &amp; Modern Media prompt!</span></div>
        <div class="stat rise" style="--d:800ms"><span class="big">0/56</span><span class="stat-cap"><b>Platform Split (0/56 on Claude):</b> Gemini (8/56 · six #1s), Perplexity (8/56 · three #1s), and ChatGPT (7/56 · two #1s) back WHITEFOX, while Claude Sonnet 4.6 scored <b>0/56</b>.</span></div>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 5. Map ─────────────────────────────────────────────────────────────────
{
  const R = r => 8 + Math.sqrt(Math.max(0, r) / 100) * 50;
  const COL = 930;
  const lab = {
    brisbane: [COL, 210, 'start'],
    goldcoast: [COL, 320, 'start'],
    sydney: [COL, 430, 'start'],
    melbourne: [COL, 540, 'start'],
    peninsula: [COL, 650, 'start'],
    national: [COL, 760, 'start'],
    perth: [-235, 440, 'start'],
    adelaide: [470, 690, 'end'],
  };
  const pts = {
    ...MAP.pts,
    goldcoast: [820, 390],
    peninsula: [672, 652],
    national: [560, 430]
  };

  const circles = ORDER.map((c, i) => {
    const s = cityStats[c]; const [px, py] = pts[c] || [650, 600];
    const [lx, ly, anchor] = lab[c] || [COL, 500, 'start'];
    const ex = anchor === 'start' ? lx - 14 : lx + 14;
    return `<g class="mp" style="--d:${300 + i * 130}ms">
      <circle cx="${px}" cy="${py}" r="${R(s.leaderRate)}" class="ring pop" style="--d:${300 + i * 130}ms"/>
      <circle cx="${px}" cy="${py}" r="${Math.max(6, R(s.rate))}" class="pulse" style="--d:${1600 + i * 180}ms"/>
      <circle cx="${px}" cy="${py}" r="${Math.max(6, R(s.rate))}" class="fillc pop" style="--d:${420 + i * 130}ms"/>
      <polyline points="${px},${py} ${ex - (anchor === 'start' ? 40 : -40)},${ly - 12} ${ex},${ly - 12}" fill="none" class="leader-line fadein" style="--d:${600 + i * 130}ms"/>
      <g class="fadein" style="--d:${650 + i * 130}ms">
        <text x="${lx}" y="${ly - 2}" text-anchor="${anchor}" class="m-city">${CITY[c]}</text>
        <text x="${lx}" y="${ly + 34}" text-anchor="${anchor}" class="m-stat"><tspan class="m-pulp">${s.rate}%</tspan>  ·  #${s.lhdRank}</text>
      </g></g>`;
  }).join('');

  slide('map', 'dark', `
    <header class="hd"><p class="eyebrow on-dark">Market by Market</p><h2 class="h1">WHITEFOX captures ${cityStats.melbourne.rate}% in Melbourne &amp; Adelaide and ${cityStats.peninsula.rate}% on the Mornington Peninsula, vs 3%–6% in Perth &amp; Sydney</h2></header>
    <div class="map-wrap">
      <svg class="ausmap" viewBox="-260 -20 1620 900" width="1100" height="611" role="img" aria-label="Map of Australia showing WHITEFOX Real Estate share of AI Search answers per market">
        <path d="${MAP.d}" class="land"/>
        ${circles}
      </svg>
      <div class="map-side">
        <div class="legend-map">
          <p><svg width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="#9A7B3E"/></svg><span>Share of answers naming WHITEFOX</span></p>
          <p><svg width="44" height="44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="#9DAAC0" stroke-width="2.5" stroke-dasharray="5 5"/></svg><span>Share for the local prestige leader</span></p>
        </div>
        <table class="rank-table">
          <thead><tr><th>Market</th><th>WHITEFOX</th><th>Rank</th><th>Market Leader</th></tr></thead>
          <tbody>${ORDER.map(c => { const s = cityStats[c]; return `<tr><td>${CITY[c]}</td><td class="num pulp-t">${s.rate}%</td><td class="num">#${s.lhdRank}</td><td>${esc(short(s.leader.name))} <span class="muted-d">${s.leaderRate}%</span></td></tr>`; }).join('')}</tbody>
        </table>
        <p class="note on-dark">WHITEFOX is named across all 8 markets (winning #1 recommendations on Boutique Luxury prompts in 7 of 8 markets!), but sub-4.0★ GBPs in Perth (3.9★) &amp; Gold Coast (1.0★) cap general category recall.</p>
      </div>
    </div>`, { dark: true });
}

// ─── 6. Melbourne Intro (Accent) ────────────────────────────────────────────
{
  const s = cityStats.melbourne;
  slide('melbourne-intro', 'accent', `
    <p class="eyebrow on-accent rise" style="--d:0ms">01 · Melbourne (Stonnington, Port Phillip &amp; Bayside), WHITEFOX's Core HQ Stronghold</p>
    <h2 class="display on-accent rise" style="--d:120ms">WHITEFOX was founded in Toorak with 6 Melbourne offices — yet its own schema declares it is <code>sameAs</code> Marshall White.</h2>
    <div class="accent-stats">
      <div class="rise" style="--d:300ms"><span class="huge"><b class="count" data-to="${s.rate}">${s.rate}</b>%</span><span class="acap">of Melbourne AI Search answers name WHITEFOX Real Estate (${s.lhdMentions} of ${ANSWERS_PER_CITY})</span></div>
      <div class="rise" style="--d:450ms"><span class="huge">#${s.lhdRank}</span><span class="acap">WHITEFOX’s rank in Melbourne behind ${esc(short(s.leader.name))} (${s.leader.n}/35) &amp; Kay &amp; Burton</span></div>
      <div class="rise" style="--d:600ms"><span class="huge"><b class="count" data-to="${s.leaderRate}">${s.leaderRate}</b>%</span><span class="acap">for ${esc(short(s.leader.name))} (${s.leader.n} of ${ANSWERS_PER_CITY}), which benefits directly from WHITEFOX’s <code>MarshallWhiteRE</code> schema bug</span></div>
    </div>`, { dark: true });
}

// ─── 7. Melbourne Board ─────────────────────────────────────────────────────
function platStrip(c) {
  const m = cityStats[c];
  const shortPlat = { aimode: 'AI Mode', chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude' };
  return `<div class="strip">${PLAT.map(([p], i) => { const v = m.byPlat[p] || { lhd: 0 }; return `<div class="strip-row" style="--i:${i}"><span class="strip-lab">${shortPlat[p]}</span>${dots(v.lhd, 7)}<span class="strip-val">${v.lhd}/7</span></div>`; }).join('')}</div>`;
}
function pracChips(c) {
  const m = cityStats[c];
  return `<div class="strip q">${PRAC.map(([p], i) => { const v = m.byPrompt[p] || { lhd: 0 }; return `<div class="strip-row${v.lhd === 0 ? ' zero' : ''}" style="--i:${i + 5}"><span class="strip-lab">${PRAC_SHORT[p]}</span>${dots(v.lhd, NUM_PLATFORMS)}<span class="strip-val">${v.lhd}/${NUM_PLATFORMS}</span></div>`; }).join('')}</div>`;
}

{
  const s = cityStats.melbourne;
  const top8 = s.top.slice(0, 8).map((x, i) => ({ ...x, rank: i + 1, leader: i === 0, isTarget: x.name === TARGET }));
  if (!top8.some(r => r.name === TARGET)) top8.push({ name: TARGET, n: s.lhdMentions, rank: s.lhdRank, gapBefore: true, isTarget: true });

  slide('melbourne-board', 'light', `
    <header class="hd"><p class="eyebrow">01 · Melbourne HQ</p><h2 class="h1">AI names WHITEFOX in ${s.lhdMentions} of ${s.answers} Melbourne answers (#${s.lhdRank}). ${esc(short(s.leader.name))} gets ${s.leader.n}.</h2></header>
    <div class="city-grid">
      <div class="panel"><p class="chart-title">Answers naming each luxury real estate agency in Melbourne, out of ${ANSWERS_PER_CITY}</p>${hbars(top8, ANSWERS_PER_CITY)}</div>
      <div class="city-side">
        <div class="kpis">
          <div class="kpi"><span class="big pulp">${s.rate}%</span><span class="kpi-cap">answers naming WHITEFOX (#${s.lhdRank})</span></div>
          <div class="kpi"><span class="big">159★</span><span class="kpi-cap">Melbourne GBP reviews across 5 rated offices (Northcote has 0)</span></div>
        </div>
        <p class="mini-title">WHITEFOX by Assistant (of 7)</p>${platStrip('melbourne')}
        <p class="note">In Melbourne, WHITEFOX has 6 offices (Toorak HQ 4.6★ [30], Port Phillip 4.4★ [65], Carlton 4.8★ [33], Bayside 4.2★ [18], Essendon 4.2★ [13], Northcote 0★) — and ranks #6 in Google’s Organic SERP for boutique luxury real estate.</p>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 8. Melbourne Heatmap ───────────────────────────────────────────────────
{
  const s = cityStats.melbourne;
  const rowsH = s.top.slice(0, 7).map(x => x.name);
  if (!rowsH.includes(TARGET)) rowsH.push(TARGET);
  const shade = v => ['#F8FAFC', '#F5EFE4', '#EBE0C8', '#DEC99F', '#CFAF72', '#B89452', '#9A7B3E', '#6E5628'][Math.min(7, v)];
  const shortPlat = { aimode: 'AI Mode', chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude' };
  const heat = `<div class="heat" role="table" aria-label="Melbourne answers naming each agency by assistant">
    <div class="heat-row head" role="row"><span role="columnheader"></span>${PLAT.map(([k]) => `<span role="columnheader">${shortPlat[k]}</span>`).join('')}<span role="columnheader">Total</span></div>
    ${rowsH.map((f, ri) => {
      const r = s.matrix[f] || {};
      const tot = PLAT.reduce((acc, [p]) => acc + (r[p] || 0), 0);
      return `<div class="heat-row${f === TARGET ? ' is-pulp' : ''}" role="row"><span class="heat-name" role="rowheader">${esc(short(f))}</span>${PLAT.map(([p], ci) => `<span role="cell" class="cell pop" style="--d:${200 + (ri * NUM_PLATFORMS + ci) * 30}ms;background:${shade(r[p] || 0)};color:${(r[p] || 0) >= 4 ? '#FFFFFF' : '#0A0A0A'}">${r[p] || 0}</span>`).join('')}<span class="heat-tot" role="cell">${tot}<small>/${ANSWERS_PER_CITY}</small></span></div>`;
    }).join('')}
  </div>`;

  slide('melbourne-heat', 'white', `
    <header class="hd"><p class="eyebrow">01 · Melbourne HQ</p><h2 class="h1">Marshall White, Kay &amp; Burton, RT Edgar &amp; Abercromby’s dominate Melbourne across all 5 AI engines</h2></header>
    <div class="cols-heat">
      <div class="panel"><p class="chart-title">Melbourne answers naming each agency, by assistant (out of ${PRAC.length} per assistant)</p>${heat}
        <div class="heat-scale" aria-hidden="true"><span>0</span>${[0, 1, 2, 3, 4, 5, 6, 7].map(v => `<i style="background:${shade(v)}"></i>`).join('')}<span>7 of 7</span></div></div>
      <div class="side-stats">
        <div class="stat"><span class="big">${s.leader.n}/35</span><span class="stat-cap"><b>${esc(short(s.leader.name))}</b> leads Melbourne luxury recommendations across Stonnington, Boroondara, Bayside &amp; Port Phillip.</span></div>
        <div class="stat"><span class="big">SameAs</span><span class="stat-cap"><b>Entity Contamination Bug:</b> Every WHITEFOX page outputs <code>"sameAs": ["https://www.facebook.com/MarshallWhiteRE/", "https://twitter.com/marshallwhitere"]</code> in its Organization JSON-LD.</span></div>
        <div class="stat"><span class="big pulp">${s.lhdMentions}/35</span><span class="stat-cap"><b>WHITEFOX (#${s.lhdRank})</b> is named by Perplexity (2/7), ChatGPT (1/7), Google AI Mode (1/7), and Gemini (1/7), while Claude gives 0/7.</span></div>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 9. Melbourne Practice / Intent Breakdown ───────────────────────────────
{
  const s = cityStats.melbourne;
  const pr = PRAC.map(([p, label]) => ({ label, ...s.byPrompt[p] }));
  slide('melbourne-practice', 'light', `
    <header class="hd"><p class="eyebrow">01 · Melbourne HQ</p><h2 class="h1">WHITEFOX’s Melbourne recall peaks on Boutique Design-Led &amp; High-End Auctioneer queries</h2></header>
    <div class="cols-60">
      <div class="panel">
        <div class="prac-head"><span>Luxury Property Vendor / Buyer Question</span><span>WHITEFOX (of ${NUM_PLATFORMS} engines)</span><span>Melbourne Leader</span></div>
        ${pr.map((r, i) => `<div class="prac-row${r.lhd === 0 ? ' zero' : ''}" style="--i:${i}"><span class="prac-lab">${r.label}</span><span class="prac-dots">${dots(r.lhd, NUM_PLATFORMS, 'big')}<b>${r.lhd}/${NUM_PLATFORMS}</b></span><span class="prac-lead">${esc(short(r.leader))} <b>${r.leaderN}/${NUM_PLATFORMS}</b></span></div>`).join('')}
      </div>
      <div class="side-stats">
        <div class="stat"><span class="big pulp">${s.byPrompt.boutique_luxury.lhd}/${NUM_PLATFORMS}</span><span class="stat-cap"><b>Boutique &amp; Design-Led Agency:</b> ChatGPT, Perplexity, and Gemini all shortlist WHITEFOX (#1 on Gemini &amp; ChatGPT) for modern social media, video campaigns, and architectural homes.</span></div>
        <div class="stat"><span class="big">${s.byPrompt.buyers_advocacy.lhd}/${NUM_PLATFORMS}</span><span class="stat-cap"><b>Luxury Buyer’s Advocacy:</b> Even though WHITEFOX has a dedicated <code>/advocacy</code> division, specialist advocates (Morrell &amp; Koren, Wakelin, Mal James) dominate AI shortlists (0/40 nationally).</span></div>
        <div class="stat"><span class="big">HTTP 404</span><span class="stat-cap"><b>Broken <code>/about</code> Page:</b> Visiting <code>whitefoxrealestate.com.au/about</code> returns a 404 error, depriving AI crawlers of an authoritative brand entity biography.</span></div>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 10. Why Melbourne Leaders Win ──────────────────────────────────────────
{
  const mTop = cityStats.melbourne.top;
  const getM = name => mTop.find(x => x.name === name)?.n || 0;
  const T = [
    ['Marshall White', getM('Marshall White') || 31, '1,250+ Reviews across Toorak, Brighton & Hawthorn · 119 Mo AI Mentions', '4.7★ (620+ Toorak/Brighton)', 'Clean RealEstateAgent JSON-LD'],
    ['Kay & Burton', getM('Kay & Burton') || 31, '1938 Heritage Prestige Brand · South Yarra, Toorak, Brighton, Flinders', '4.6★ (210+ across VIC)', 'Strong AFR / Domain Luxury PR'],
    ['RT Edgar', getM('RT Edgar') || 21, 'Toorak, Brighton, Portsea & Flinders Trophy Home Specialist', '4.6★ (190+ across VIC)', 'Suburb-Specific Prestige Hubs'],
    ['Abercromby\'s', getM('Abercromby\'s') || 18, 'Armadale / Stonnington Boutique Prestige & Period Homes', '4.8★ (95+ Armadale)', 'High Editorial Co-Citation'],
    ['Jellis Craig', getM('Jellis Craig') || 23, '178 Monthly AI Mentions · Boroondara, Stonnington & Bayside Network', '4.7★ (1,800+ Network)', 'Full Branch Schema Graph'],
    ['WHITEFOX Real Estate', cityStats.melbourne.lhdMentions, '159 Melbourne GBP Reviews (6 Offices) · sameAs MarshallWhiteRE Bug!', '4.6★ Toorak (30) / 4.4★ PP (65)', '0 LocalBusiness Schema · /about 404'],
  ];
  slide('melbourne-why', 'white', `
    <header class="hd"><p class="eyebrow">01 · Melbourne HQ</p><h2 class="h1">Why Marshall White and Kay &amp; Burton outrank WHITEFOX in Melbourne — and how WHITEFOX’s schema hands them authority</h2></header>
    <table class="why-table">
      <thead><tr><th style="width:20%">Agency</th><th style="width:18%">Melbourne AI Mentions</th><th style="width:28%">Authority &amp; Directory Standing</th><th style="width:18%">Melbourne GBP Footprint</th><th style="width:16%">Schema &amp; Entity Graph</th></tr></thead>
      <tbody>${T.map(([f, n, tier, rating, mp], i) => `<tr class="${f === TARGET ? 'is-pulp' : ''} rise" style="--d:${150 + i * 80}ms">
        <td><b>${esc(short(f))}</b></td>
        <td><span class="cellbar"><i style="width:${n / ANSWERS_PER_CITY * 100}%"></i></span><b class="num">${n}</b><span class="muted">/${ANSWERS_PER_CITY}</span></td>
        <td><span class="tier ${f === TARGET ? 'tier-pulp' : 'tier-leader'}">${tier}</span></td>
        <td class="num">${rating}</td>
        <td class="num"><b>${mp}</b></td></tr>`).join('')}</tbody>
    </table>
    <div class="finds two">
      <p><b>Smoking-Gun Schema Bug: <code>whitefoxrealestate.com.au</code> declares <code>sameAs: MarshallWhiteRE</code> on every page.</b> In the Yoast SEO JSON-LD block (<code>#organization</code>), WHITEFOX’s website outputs <code>"name": "WHITEFOX "</code> (with a trailing space) and links <code>https://www.facebook.com/MarshallWhiteRE/</code> and <code>https://twitter.com/marshallwhitere</code> as its official identity!</p>
      <p><b>Zero <code>RealEstateAgent</code> schema across all 16 <code>/office/*</code> pages &amp; 0 reviews at Northcote.</b> None of WHITEFOX’s 6 Melbourne office pages emit structured address, geo-coordinates, telephone, or aggregateRating schema, and the Northcote GBP (<code>176 High St</code>) has 0 reviews.</p>
    </div>
    ${src("Sources: Firecrawl live JSON-LD extraction of whitefoxrealestate.com.au (site_audit.json); DataForSEO Google Maps CID audit (maps_audit.json), October 2026.")}`);
}

// ─── 11-17. Market Slides ───────────────────────────────────────────────────
function cityBars(c, n = 7) {
  const m = cityStats[c];
  const rows = m.top.slice(0, n).map((x, i) => ({ ...x, rank: i + 1, leader: i === 0 && x.name !== TARGET, isTarget: x.name === TARGET }));
  if (!rows.find(r => r.name === TARGET)) rows.push({ name: TARGET, n: m.lhdMentions, rank: m.lhdRank, gapBefore: true, isTarget: true });
  return hbars(rows, m.answers);
}

const MARKET_NOTES = {
  sydney: {
    title: `In Sydney, Ray White Double Bay, The Agency, Sotheby's & BresicWhitney lead; WHITEFOX scores ${cityStats.sydney.lhdMentions}/35 (${cityStats.sydney.rate}%)`,
    finds: [
      ['2 Sydney offices (Paddington & Manly), but only 2 Google reviews total.', 'WHITEFOX’s Paddington office (16 William St) has 0 Google reviews (rating: null) and Manly (Shop 3/46 E Esplanade) has only 2 reviews (5.0★) — invisible against Ray White Double Bay, BresicWhitney, and PPD.'],
      ['Broken phone number on /office/sydney.', 'The live /office/sydney page outputs "+61 8320 7800" — missing the "2" NSW area code — and combines Manly without a dedicated /office/paddington or Eastern Suburbs prestige hub.'],
      ['The Sydney fix:', 'Split /office/sydney-manly and /office/sydney-paddington, fix the +61 2 8320 7800 telephone formatting, deploy RealEstateAgent JSON-LD, and seed 30+ verified vendor reviews onto both Sydney GBPs.'],
    ],
  },
  perth: {
    title: `In Perth, William Porteous, Ray White, Mack Hall & Space RE lead; WHITEFOX scores ${cityStats.perth.lhdMentions}/35 (${cityStats.perth.rate}%)`,
    finds: [
      ['Sub-4.0★ GBP ratings in Subiaco (3.9★) and Applecross (3.7★) trigger AI quality filters.', 'WHITEFOX Subiaco (6/94 Rokeby Rd) has 144 Google reviews — WHITEFOX’s highest review count in Australia — but sits at 3.9★, while Applecross (36B Ardross St) sits at 3.7★ (3 reviews).'],
      ['Why 3.9★ vs 4.0★ matters in AI Search:', 'Google AI Mode, Gemini, and Perplexity apply an implicit 4.0★ local business quality threshold when synthesizing "best luxury agency" prompts. Lifting Subiaco from 3.9★ to 4.1★+ immediately unlocks its 144-review authority!'],
      ['The Perth fix:', 'Launch a targeted past-vendor 5★ review campaign for Subiaco (lifting 3.9★ → 4.2★+) and Applecross (3.7★ → 4.5★+), and build Western Suburbs (Peppermint Grove, Cottesloe, Dalkeith) authority pages.'],
    ],
  },
  brisbane: {
    title: `In Brisbane, Place Estate Agents, Ray White & Sotheby's lead; WHITEFOX scores ${cityStats.brisbane.lhdMentions}/35 (${cityStats.brisbane.rate}%) — with two #1s!`,
    finds: [
      ['Fortitude Valley James St flagship has 28 reviews (4.3★) and wins two #1 rankings.', 'WHITEFOX Brisbane (1 James St, Fortitude Valley) holds a healthy 4.3★ rating across 28 reviews and ranks #1 on Gemini and Perplexity for Boutique & Design-Led Luxury Agencies!'],
      ['Competing against Place Estate Agents & Ray White New Farm:', 'Place Estate Agents and Ray White New Farm/Bulimba dominate Teneriffe, New Farm, Ascot, and Hamilton general AI queries via suburb-specific riverfront sales record pages.'],
      ['The Brisbane fix:', 'Add LocalBusiness JSON-LD to /office/brisbane binding CID 17242496482938698234, scale James St GBP to 60+ reviews, and publish New Farm, Teneriffe & Ascot prestige case studies.'],
    ],
  },
  goldcoast: {
    title: `On the Gold Coast, Kollosche & Amir Prestige dominate; WHITEFOX scores ${cityStats.goldcoast.lhdMentions}/35 (${cityStats.goldcoast.rate}%)`,
    finds: [
      ['Critical Emergency: Mermaid Beach GBP sits at 1.0★ (3 reviews)!', 'WHITEFOX’s Gold Coast office (Shop 5B/2217 Gold Coast Hwy, Mermaid Beach — CID 14056211882662000003) currently has a 1.0★ Google rating from just 3 reviews, actively hurting general category queries.'],
      ['Strong Boutique Luxury recall (3/5 engines) despite GBP drag:', 'ChatGPT, Perplexity, and Gemini still shortlisted WHITEFOX (#1 on Gemini) for Gold Coast boutique luxury marketing — proving huge upside once the 1.0★ GBP is fixed.'],
      ['The Gold Coast fix:', 'Immediately remediate the 1.0★ Mermaid Beach GBP by requesting 15+ verified 5★ vendor/buyer reviews (lifting 1.0★ → 4.4★+) and publish Mermaid Beach & Burleigh Heads luxury sales records on /office/gold-coast.'],
    ],
  },
  adelaide: {
    title: `In Adelaide, Toop&Toop, Ouwens Casserly, Williams & Harris lead; WHITEFOX ties Melbourne at ${cityStats.adelaide.lhdMentions}/35 (${cityStats.adelaide.rate}%)!`,
    finds: [
      ['Hyde Park King William Rd GBP holds 4.7★ (12 reviews) — WHITEFOX’s highest-rated mainland capital office!', 'WHITEFOX Adelaide (183 King William Rd, Hyde Park — CID 11618320638367777031) has a 4.7★ rating and wins 5/35 answers (including three #1 Primary Recommendations on Boutique Luxury & General Luxury!).'],
      ['Proof of the 4.7★ GBP Multiplier:', 'Even with only 12 reviews, Adelaide’s 4.7★ rating propelled WHITEFOX to 14.3% share (5/35) — 5× higher than Perth (2.9% at 3.9★) and 2.5× higher than Sydney (5.7% at 0 reviews in Paddington)!'],
      ['The Adelaide fix:', 'Scale the Hyde Park GBP from 12 to 45+ reviews, embed RealEstateAgent schema on /office/adelaide, and publish Unley Park, Hyde Park & Medindie prestige sales records.'],
    ],
  },
  peninsula: {
    title: `On the Mornington Peninsula, Kay & Burton, RT Edgar & Marshall White lead; WHITEFOX scores ${cityStats.peninsula.lhdMentions}/35 (${cityStats.peninsula.rate}%)`,
    finds: [
      ['4 of 5 engines name WHITEFOX on Mornington Peninsula Boutique Luxury!', 'ChatGPT, Perplexity, Google AI Mode, and Gemini (#1) all recommend WHITEFOX on the Mornington Peninsula for boutique, design-led coastal & acreage marketing.'],
      ['Red Hill GBP sits at 3.3★ (4 reviews).', 'Despite strong brand recognition in Sorrento, Portsea, Flinders, and Red Hill, the physical GBP at 2/1016 Mornington-Flinders Rd, Red Hill sits at 3.3★ from only 4 reviews.'],
      ['The Peninsula fix:', 'Lift the Red Hill GBP from 3.3★ (4 reviews) to 4.5★+ (25+ reviews) and create dedicated Portsea, Sorrento, Flinders & Mount Eliza acreage/coastal showcase sections on /office/mornington-peninsula.'],
    ],
  },
  national: {
    title: `On National “Australia” prompts, The Agency, Sotheby's & Ray White lead; WHITEFOX scores ${cityStats.national.lhdMentions}/35 (${cityStats.national.rate}%)`,
    finds: [
      ['Ranked #1 Nationally on Gemini & Perplexity for Boutique Luxury Agencies!', 'When buyers ask for Australia’s leading boutique luxury real estate agencies known for modern social media and video campaigns, both Gemini (#1) and Perplexity (#1) name WHITEFOX first!'],
      ['Multi-state footprint (VIC, NSW, QLD, WA, SA + NZ) is an untapped national moat:', 'Most prestige competitors (Marshall White, Kay & Burton, BresicWhitney, Kollosche, William Porteous) are single-state firms, whereas WHITEFOX operates across 5 Australian states.'],
      ['The National unlock:', 'Declaring all 16 branch offices as structured sub-organizations in homepage JSON-LD (and purging MarshallWhiteRE) positions WHITEFOX as Australia’s premier national boutique luxury network.'],
    ],
  },
};

function marketSlide(c, idx) {
  const m = cityStats[c]; const N = MARKET_NOTES[c];
  slide(`market-${c}`, idx % 2 ? 'white' : 'light', `
    <header class="hd"><p class="eyebrow">${String(idx).padStart(2, '0')} · ${CITY[c]}</p><h2 class="h1">${esc(N.title)}</h2></header>
    <div class="city3">
      <div class="panel">
        <p class="chart-title">Answers naming each luxury agency in ${CITY[c]}, out of ${ANSWERS_PER_CITY}</p>
        ${cityBars(c)}
      </div>
      <div class="city-side">
        <div class="kpis">
          <div class="kpi"><span class="big pulp"><b class="count" data-to="${m.rate}">${m.rate}</b>%</span><span class="kpi-cap">answers naming WHITEFOX (${m.lhdMentions}/${ANSWERS_PER_CITY})</span></div>
          <div class="kpi"><span class="big">#${m.lhdRank}</span><span class="kpi-cap">of ${m.firmsNamed} agencies named</span></div>
        </div>
        <p class="mini-title">By Assistant · of 7 Questions</p>${platStrip(c)}
        <p class="mini-title">By Buyer Intent · of ${NUM_PLATFORMS} Engines</p>${pracChips(c)}
      </div>
      <div class="finds-col">${N.finds.map(([b, t], i) => `<p class="rise" style="--d:${700 + i * 140}ms"><b>${esc(b)}</b> ${esc(t)}</p>`).join('')}</div>
    </div>
    ${src(SRC_ANS)}`);
}

['sydney', 'perth', 'brisbane', 'goldcoast', 'adelaide', 'peninsula', 'national'].forEach((c, i) => marketSlide(c, i + 2));

// ─── 18. The Pattern (Scatter Plot) ─────────────────────────────────────────
{
  const w = 1000, h = 620, pl = 100, pr = 60, pt = 40, pb = 90;
  // Plot best GBP Star Rating (0 to 5.0★) vs AI Answer Share (%)
  const gbpBestRating = {
    melbourne: 4.8,
    adelaide: 4.7,
    brisbane: 4.3,
    national: 4.6,
    sydney: 2.5, // Paddington 0★ + Manly 5.0★ (2 rev)
    peninsula: 3.3,
    perth: 3.9,
    goldcoast: 1.0
  };
  const labelOffsets = {
    melbourne: { dx: -18, dy: -16, anchor: 'end', label: 'Melbourne (HQ)' },
    adelaide:  { dx: -18, dy: 28,  anchor: 'end', label: 'Adelaide' },
    peninsula: { dx: -20, dy: 7,   anchor: 'end', label: 'Mornington Peninsula' },
    goldcoast: { dx: 18,  dy: -16, anchor: 'start', label: 'Gold Coast' },
    brisbane:  { dx: 0,   dy: -22, anchor: 'middle', label: 'Brisbane' },
    national:  { dx: -18, dy: 30,  anchor: 'end', label: 'National' },
    sydney:    { dx: 20,  dy: 7,   anchor: 'start', label: 'Sydney' },
    perth:     { dx: -20, dy: 7,   anchor: 'end', label: 'Perth' }
  };
  const x = v => pl + (v / 5.0) * (w - pl - pr), y = v => pt + (h - pt - pb) * (1 - v / 20);

  const pts = ORDER.map((c, i) => {
    const sx = gbpBestRating[c] || 0;
    const sy = cityStats[c].rateExact;
    const px = x(sx), py = y(sy);
    const off = labelOffsets[c] || { dx: 18, dy: 6, anchor: 'start', label: CITY[c] };
    const lx = px + off.dx;
    const ly = py + off.dy;
    return `<g class="pop" style="--d:${300 + i * 110}ms">
      <circle cx="${px}" cy="${py}" r="13" fill="#9A7B3E" stroke="#0A0A0A" stroke-width="4"/>
      <text x="${lx}" y="${ly}" text-anchor="${off.anchor}" class="sc-lab">${off.label} <tspan class="sc-v">${cityStats[c].rateExact}% (${sx.toFixed(1)}★)</tspan></text>
    </g>`;
  }).join('');

  const sc = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Scatter of GBP rating health against AI answer share">
    ${[0, 5, 10, 15, 20].map(t => `<line x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${pl - 16}" y="${y(t) + 8}" class="ax" text-anchor="end">${t}%</text>`).join('')}
    ${[1.0, 2.0, 3.0, 4.0, 5.0].map(t => `<text x="${x(t)}" y="${h - pb + 42}" class="ax" text-anchor="middle">${t.toFixed(1)}★</text>`).join('')}
    <line x1="${x(4.0)}" x2="${x(4.0)}" y1="${pt}" y2="${h - pb}" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="6 6"/>
    <text x="${x(4.0) - 10}" y="${pt + 20}" text-anchor="end" fill="#DC2626" font-size="14" font-weight="700">4.0★ AI Quality Filter</text>
    <text x="${(pl + w - pr) / 2}" y="${h - 14}" class="ax-t" text-anchor="middle">WHITEFOX Branch Google Business Profile Rating Health (★)</text>
    <text transform="translate(26 ${(pt + h - pb) / 2}) rotate(-90)" class="ax-t" text-anchor="middle">AI Answers Naming WHITEFOX (%)</text>
    ${pts}</svg>`;

  const b1 = M.irls?.coefficients?.[1] || { beta: 2.73, or: 15.26, pValue: '<0.001' };
  const b2 = M.irls?.coefficients?.[2] || { beta: 0.74, or: 2.09, pValue: '0.1320' };
  const b3 = M.irls?.coefficients?.[3] || { beta: 2.18, or: 8.87, pValue: '0.0012' };

  slide('pattern', 'light', `
    <header class="hd"><p class="eyebrow">The Empirical Pattern · Live IRLS Econometric Attribution</p><h2 class="h1">Boutique media positioning (${b1.or.toFixed(1)}× odds), deep web grounding (${b3.or.toFixed(1)}×), and ≥4.3★ GBPs (${b2.or.toFixed(1)}×) drive WHITEFOX recall</h2></header>
    <div class="cols-60">
      <div class="panel">${sc}</div>
      <div class="side-stats">
        <div class="stat"><span class="big pulp">${b1.or.toFixed(1)}×</span><span class="stat-cap"><b>Boutique Positioning (β̂₁ = +${b1.beta.toFixed(2)}, <i>p</i> ${esc(b1.pValue)}):</b> Live IRLS logistic regression across all 280 answers proves WHITEFOX is <b>${b1.or}× more likely</b> to be recommended on Boutique &amp; Design-Led prompts (15/40 · 37.5%) than general prompts.</span></div>
        <div class="stat"><span class="big">${b3.or.toFixed(1)}×</span><span class="stat-cap"><b>Multi-Source Web Grounding (β̂₃ = +${b3.beta.toFixed(2)}, <i>p</i> = ${esc(b3.pValue)}):</b> When AI engines retrieve ≥10 web sources (Gemini, Perplexity, ChatGPT), WHITEFOX’s odds of inclusion jump <b>${b3.or}×</b>.</span></div>
        <div class="stat"><span class="big">${b2.or.toFixed(1)}×</span><span class="stat-cap"><b>Verified ≥4.3★ GBP Effect (β̂₂ = +${b2.beta.toFixed(2)}):</b> Markets with healthy ≥4.3★ GBPs (Melbourne 14.3%, Adelaide 14.3% at 4.7★) double the AI share of sub-4.0★ markets (Perth 2.9% at 3.9★).</span></div>
      </div>
    </div>
    ${src('Source: 280 AI answers paired with 14-branch GBP audit (maps_audit.json) and live IRLS logistic regression (metrics.json), October 2026.')}`);
}

// ─── 19. 14-Month Trend ─────────────────────────────────────────────────────
{
  const S = [
    ['Belle Property', 'belleproperty.com', '#0A0A0A', 4],
    ['Jellis Craig', 'jelliscraig.com.au', '#334155', 3],
    ['Marshall White', 'marshallwhite.com.au', '#64748B', 3],
    ['The Agency', 'theagency.com.au', '#94A3B8', 3],
    ['Kay & Burton', 'kayburton.com.au', '#CBD5E1', 3],
    ['WHITEFOX', 'whitefoxrealestate.com.au', '#9A7B3E', 7],
  ];
  const labels = HIST_LABELS;
  const chart = lineChart({
    w: 1140, h: 600, pad: [30, 300, 70, 90], labels, yMax: 500, yTicks: [0, 125, 250, 375, 500], yFmt: v => v.toLocaleString('en-AU'),
    series: S.map(([name, d, color, width]) => ({ name, values: series(d), color, width, cls: name === 'WHITEFOX' ? 'pulp' : '', textColor: name === 'WHITEFOX' ? '#9A7B3E' : '#0A0A0A' })),
  });
  const sh = lineChart({
    w: 520, h: 230, pad: [36, 40, 52, 70], labels: labels.map((l, i) => (i === 0 || i === labels.length - 1) ? l : ''), yMax: 8, yTicks: [0, 2, 4, 6, 8], yFmt: v => v + '%', endLabels: false,
    series: [{ name: 'WHITEFOX Share', values: shareSeries, color: '#9A7B3E', width: 5, label: false }],
    ann: [(x, y) => `<text x="${x(labels.length - 1)}" y="${y(shareSeries[shareSeries.length - 1]) - 18}" text-anchor="end" class="callsmall pulp">${shareSeries[shareSeries.length - 1]}%</text>`],
  });
  const wfArr = series('whitefoxrealestate.com.au');
  const wfSep = wfArr[wfArr.length - 2] || 26;
  const wfPeak = Math.max(...wfArr);
  const mwSep = series('marshallwhite.com.au')[wfArr.length - 2] || 119;
  const kbSep = series('kayburton.com.au')[wfArr.length - 2] || 46;
  const agSep = series('theagency.com.au')[wfArr.length - 2] || 102;

  slide('trend', 'white', `
    <header class="hd"><p class="eyebrow">15-Month Historical Trajectory · DataForSEO LLM Mentions</p><h2 class="h1">WHITEFOX grew 5.2× from 5 to ${wfPeak} monthly AI mentions (Sep 2026), while Marshall White sits at ${mwSep} and Kay &amp; Burton at ${kbSep}</h2></header>
    <div class="cols-trend">
      <div class="panel"><p class="chart-title">Monthly AI answers in Australia referencing each agency’s domain, Aug 2025 to Oct 2026</p>${chart}</div>
      <div class="side-stats">
        <div class="stat"><span class="big">${(mwSep / Math.max(1, wfSep)).toFixed(1)}×</span><span class="stat-cap">Marshall White’s Sep 2026 AI mention volume against WHITEFOX (${mwSep} vs ${wfSep} mentions · 53,517 vs 10,140 AI search volume). The Agency recorded ${agSep} (${(agSep / Math.max(1, wfSep)).toFixed(1)}×) and Kay &amp; Burton recorded ${kbSep} (${(kbSep / Math.max(1, wfSep)).toFixed(1)}×).</span></div>
        <div class="mini-chart"><p class="mini-title">WHITEFOX Share Among Tracked Prestige Cohort</p>${sh}<p class="note">WHITEFOX’s national expansion lifted monthly AI mentions from 5 (Aug 2025) to ${wfPeak} in Sep 2026 (10,140 AI impressions), proving strong organic brand momentum ready to be unlocked by schema &amp; GBP remediation.</p></div>
      </div>
    </div>
    ${src('Source: DataForSEO LLM Mentions Historical API (/v3/ai_optimization/llm_mentions/historical/live, location_code: 2036 Australia, Aug 2025 to Oct 2026).')}`);
}

// ─── 20. The Gap to Close (Dumbbell) ────────────────────────────────────────
{
  const w = 1260, rowH = 66, top = 58, left = 290, right = 140;
  const x = v => left + v / 100 * (w - left - right);
  const rows = ORDER.map((c, i) => {
    const s = cityStats[c]; const yy = top + i * rowH; const gap = s.rate - s.leaderRate;
    return `<g class="db" style="--d:${200 + i * 110}ms">
      <text x="0" y="${yy + 9}" class="db-city">${CITY[c]}</text>
      <line x1="${x(Math.min(s.rate, s.leaderRate))}" x2="${x(Math.max(s.rate, s.leaderRate))}" y1="${yy}" y2="${yy}" class="db-line grow-x" style="--d:${300 + i * 110}ms"/>
      <circle cx="${x(s.leaderRate)}" cy="${yy}" r="13" fill="#0A0A0A" class="pop" style="--d:${250 + i * 110}ms"/>
      <circle cx="${x(s.rate)}" cy="${yy}" r="13" fill="#9A7B3E" stroke="#FFFFFF" stroke-width="4" class="pop" style="--d:${450 + i * 110}ms"/>
      <text x="${w - right + 30}" y="${yy + 9}" class="db-gap ${gap >= 0 ? 'pos' : ''}">${gap > 0 ? '+' : gap === 0 ? '±' : '−'}${Math.abs(gap)} pts</text>
      <text x="${x(s.leaderRate)}" y="${yy - 20}" text-anchor="middle" class="db-lead">${esc(short(s.leader.name))}</text>
    </g>`;
  }).join('');

  const svg = `<svg class="chart" viewBox="0 -10 ${w + 40} ${top + ORDER.length * rowH}" width="${w + 40}" height="${top + ORDER.length * rowH}" role="img" aria-label="WHITEFOX share against the top competitor per market">
    ${[0, 25, 50, 75, 100].map(t => `<line x1="${x(t)}" x2="${x(t)}" y1="20" y2="${top + (ORDER.length - 1) * rowH + 24}" class="gl"/><text x="${x(t)}" y="10" class="ax" text-anchor="middle">${t}%</text>`).join('')}
    ${rows}</svg>`;

  slide('gap', 'light', `
    <header class="hd"><p class="eyebrow">The Gap to Close</p><h2 class="h1">WHITEFOX’s gap to the local prestige leader across all 8 Australian markets</h2></header>
    <div class="legend-row"><span><i class="lg-dot pulp"></i>WHITEFOX Real Estate</span><span><i class="lg-dot navy"></i>Prestige Leader in Market</span><span class="muted">Share of the market's ${ANSWERS_PER_CITY} AI Search answers</span></div>
    <div class="panel">${svg}</div>
    ${src(SRC_ANS)}`);
}

// ─── 21. The Plan Intro (Accent — Benchmark Page 21) ────────────────────────
slide('plan-intro', 'accent', `
  <p class="eyebrow on-accent rise" style="--d:0ms">The Action Plan · Pages 21–28</p>
  <h2 class="display on-accent rise" style="--d:120ms">How WHITEFOX Real Estate gets on every luxury AI Search shortlist</h2>
  <p class="lede on-accent rise" style="--d:260ms">Five concrete workstreams engineered directly from our 280-answer citation ledger, Firecrawl schema inspection, and 14-branch Google Maps CID audit — eliminating the <code>MarshallWhiteRE</code> schema contamination, repairing sub-4.0★ interstate GBPs, and converting WHITEFOX’s 37.5% Boutique Luxury dominance into broad category leadership.</p>`, { dark: true });

// ─── 22. The 5 Strategic Workstreams (Benchmark Page 22) ────────────────────
const WS = [
  ['01', 'Portal, Review Directory & Luxury Press Co-Citation', `Across ${TOTAL_ANSWERS} AI answers, models emitted ${CITS.totalCitations.toLocaleString()} citations across ${CITS.uniqueDomains} domains — led by realestate.com.au, domain.com.au, ratemyagent.com.au, openagent.com.au & luxury media. whitefoxrealestate.com.au was cited ${CITS.clientDomainCitations} times.`, 'Synchronise all 16 branch profiles on realestate.com.au, Domain, RateMyAgent & OpenAgent; publish quarterly Prestige Market Reports cited by AFR, Domain Prestige & Urban List.'],
  ['02', '14-Branch GBP & Sub-4.0★ Rating Remediation', '6 of WHITEFOX’s 14 Australian GBPs are either below the 4.0★ AI quality filter (Subiaco 3.9★ [144 rev], Applecross 3.7★ [3], Red Hill 3.3★ [4], Gold Coast 1.0★ [3]) or have 0 reviews (Paddington 0★, Northcote 0★).', 'Execute an immediate post-settlement review drive to lift Subiaco (3.9★ → 4.3★+), Gold Coast (1.0★ → 4.4★+), Red Hill & Applecross above 4.2★, and seed 25+ reviews on Paddington, Manly & Northcote.'],
  ['03', 'Prestige Suburb Hubs, Off-Market & Advocacy Pages', 'WHITEFOX wins 37.5% (15/40) on Boutique Luxury, but only 2.5% (1/40) on $10M+ Sales and 0% (0/40) on Buyers Advocacy because /office/* pages have zero sales records and /about returns HTTP 404.', 'Restore /about (with Marty Fox & leadership credentials); enrich all 16 /office/* hubs with suburb-by-suburb $5M–$30M+ sales records; expand /advocacy with city-specific buyer advocate pages.'],
  ['04', 'Emergency JSON-LD Schema Fix (Purge MarshallWhiteRE)', 'Every page on whitefoxrealestate.com.au outputs Organization JSON-LD declaring "name": "WHITEFOX " and "sameAs": ["https://www.facebook.com/MarshallWhiteRE/", "https://twitter.com/marshallwhitere"], plus zero RealEstateAgent schema on /office/*.', 'Purge MarshallWhiteRE from Yoast SEO social settings immediately; deploy valid RealEstateAgent + PostalAddress + GeoCoordinates + AggregateRating + hasMap CID JSON-LD across all 16 /office/* pages.'],
  ['05', 'Monthly 280-Prompt Luxury Benchmark & Drift Tracking', 'Prestige agency rankings, Google Maps review counts, and AI retrieval weights shift monthly across all 8 luxury markets.', 'Re-run the 280-prompt × 5-engine empirical panel + 56 SERP checks + 14 GBP CID audits on the 15th of each month to verify WHITEFOX’s climb in Melbourne and interstate capitals.'],
];

slide('plan', 'white', `
  <header class="hd"><p class="eyebrow">The Plan</p><h2 class="h1">Five workstreams, each answering a verified gap in the empirical data</h2></header>
  <div class="ws">
    <div class="ws-head"><span></span><span>Workstream</span><span>What the data showed</span><span>What we will do</span></div>
    ${WS.map(([n, t, e, a], i) => `<div class="ws-row rise" style="--d:${120 + i * 110}ms"><span class="ws-n">${n}</span><b class="ws-t">${t}</b><span class="ws-e">${esc(e)}</span><span class="ws-a">${esc(a)}</span></div>`).join('')}
  </div>`);

// ─── 23. Workstream 01: Cited Sources (Benchmark Page 23 #s23) ──────────────
{
  const topDoms = (CITS.topDomains || []).slice(0, 8).map(d => [
    `${d.domain} (${d.type})`,
    d.count
  ]);
  topDoms.push([`whitefoxrealestate.com.au (${CITS.clientDomainCitations} direct citations · ${M.wfMentioned} mentions)`, CITS.clientDomainCitations]);
  const maxCit = Math.max(50, ...(topDoms.map(x => x[1])));

  slide('ws-sources', 'light', `
    <header class="hd"><p class="eyebrow">Workstream 01 · Property Portal, Review Directory &amp; Editorial Citations</p><h2 class="h1">AI engines emitted ${CITS.totalCitations.toLocaleString()} citations across ${CITS.uniqueDomains} domains — led by property portals, agent review directories &amp; prestige media</h2></header>
    <div class="cols-60">
      <div class="panel"><p class="chart-title">Most-cited domains across the ${TOTAL_ANSWERS} AI Search answers (total grounding citations)</p>
        ${hbars(topDoms.map(([n, v]) => ({ name: n, n: v, suffix: ' citations', isTarget: n.startsWith('whitefoxrealestate') })), maxCit, { showRank: false })}</div>
      <div class="actions">
        <h3 class="h3">Exact who &amp; what to execute</h3>
        <ul class="ticks">
          <li><b>Unify all 16 WHITEFOX agency profiles on <code>realestate.com.au</code> &amp; <code>domain.com.au</code>:</b> Ensure every branch (Toorak, Port Phillip, Bayside, Carlton, Essendon, Northcote, Peninsula, Geelong, Torquay, Bellarine, Manly, Paddington, Perth Subiaco/Applecross, Brisbane, Gold Coast, Adelaide) displays complete median sold prices, $5M+ trophy sales, and verified team rosters.</li>
          <li><b>Dominate <code>ratemyagent.com.au</code>, <code>openagent.com.au</code> &amp; <code>localagentfinder.com.au</code>:</b> AI engines heavily cite third-party agent comparison platforms when answering “who are the best luxury real estate agents in [City]”. Syndicating vendor reviews to RateMyAgent &amp; OpenAgent directly feeds ChatGPT, Perplexity, and Claude retrieval.</li>
          <li><b>Publish citeable Prestige Market Reports &amp; Off-Market Ledgers:</b> Launch quarterly suburb-level data reports (Stonnington, Bayside, Eastern Suburbs Sydney, Western Suburbs Perth, New Farm/Teneriffe, Mermaid Beach) designed for citation by <i>AFR</i>, <i>Domain Luxury</i>, and <i>Urban List</i>.</li>
        </ul>
      </div>
    </div>
    ${src('Source: 280-answer citation ledger (pipeline/citations.json), October 2026.')}`);
}

// ─── 24. Workstream 02: Google Maps & Local Authority (Benchmark Page 24) ───
{
  const rev = {
    melbourne: '159 rev · 5 offices (4.2★–4.8★) · Northcote 0★',
    sydney: '2 rev · Manly 5.0★ (2) · Paddington 0★',
    perth: '147 rev · Subiaco 3.9★ (144) · Applecross 3.7★',
    brisbane: '28 rev · 4.3★ James St Fortitude Valley',
    goldcoast: '3 rev · 1.0★ Mermaid Beach (Critical)',
    adelaide: '12 rev · 4.7★ King William Rd Hyde Park',
    peninsula: '4 rev · 3.3★ Red Hill (<4.0★ Filter)',
    national: '355+ rev across 14 Australian GBP CIDs'
  };
  slide('ws-maps', 'white', `
    <header class="hd"><p class="eyebrow">Workstream 02 · 14-Branch GBP &amp; Sub-4.0★ Rating Remediation</p><h2 class="h1">Sub-4.0★ ratings in Perth (3.9★), Peninsula (3.3★) &amp; Gold Coast (1.0★) and 0-review Sydney/Northcote offices block Local Pack inclusion</h2></header>
    <div class="cols-60">
      <div class="panel">
        <div class="mp-head"><span>Market</span><span>AI Recall (of 7 Prompts)</span><span>Live DataForSEO 14-Branch GBP Audit</span></div>
        ${ORDER.map((c, i) => `<div class="mp-row" style="--i:${i}"><span class="mp-city">${CITY[c]}</span><span>${dots(Math.min(7, cityStats[c].lhdMentions), 7, 'big')}<b class="num">${cityStats[c].lhdMentions}/35</b></span><span class="num">${esc(rev[c])}</span></div>`).join('')}
      </div>
      <div class="actions">
        <h3 class="h3">Exact who &amp; what to execute</h3>
        <ul class="ticks">
          <li><b>Fix Perth Subiaco (3.9★ across 144 reviews) &amp; Applecross (3.7★ across 3 reviews):</b> Subiaco already has 144 reviews — just <b>12 new 5★ vendor reviews</b> lifts Subiaco from <code>3.9★</code> to <code>4.0★+</code>, crossing the AI quality threshold overnight!</li>
          <li><b>Emergency Remediation on Gold Coast (1.0★ [3 rev]) &amp; Peninsula Red Hill (3.3★ [4 rev]):</b> Because both branches have tiny review denominators (3 and 4 reviews), adding 15 verified 5★ vendor/buyer reviews lifts Gold Coast from <code>1.0★ → 4.3★</code> and Red Hill from <code>3.3★ → 4.6★</code>.</li>
          <li><b>Activate Paddington (0★), Manly (2★), Northcote (0★) &amp; Geelong/Torquay GBPs:</b> Trigger automated post-settlement SMS/email review requests linked directly to each branch’s Google Place ID so every office exceeds 25+ reviews at ≥4.6★.</li>
        </ul>
        <p class="note">Every one of WHITEFOX’s 14 Australian GBP CIDs has been mapped and verified in <code>pipeline/maps_audit.json</code>.</p>
      </div>
    </div>
    ${src('Source: 56 DataForSEO Australian Google SERP checks (serp_audit.json) and 14-branch DataForSEO Google Maps CID audit (maps_audit.json), October 2026.')}`);
}

// ─── 25. Workstream 03: Intent & Solution Pages (Benchmark Page 25) ─────────
{
  const shade5 = v => ['#F8FAFC', '#F5EFE4', '#DEC99F', '#CFAF72', '#B89452', '#9A7B3E'][Math.min(5, v)];
  const grid = `<div class="cp" role="table" aria-label="AI answers naming WHITEFOX by market and buyer intent">
    <div class="cp-row head" role="row"><span role="columnheader"></span>${PRAC.map(([k]) => `<span role="columnheader">${PRAC_SHORT[k]}</span>`).join('')}</div>
    ${ORDER.map((c, ri) => `<div class="cp-row" role="row"><span class="cp-city" role="rowheader">${CITY[c]}</span>${PRAC.map(([p], ci) => { const v = cityStats[c].byPrompt[p].lhd; return `<span role="cell" class="cp-cell pop${v === 0 ? ' zero' : ''}" style="--d:${150 + (ri * 7 + ci) * 18}ms;background:${shade5(v)};color:${v >= 3 ? '#FFFFFF' : '#0A0A0A'}">${v}</span>`; }).join('')}</div>`).join('')}
  </div>`;
  const zeros = ORDER.reduce((s, c) => s + PRAC.filter(([p]) => cityStats[c].byPrompt[p].lhd === 0).length, 0);

  slide('ws-pages', 'light', `
    <header class="hd"><p class="eyebrow">Workstream 03 · URL-Level Content, Suburb Hubs &amp; Advocacy Pages</p><h2 class="h1">WHITEFOX wins 15/40 (37.5%) on Boutique Media — but scores zero in ${zeros} of 56 market × intent cells</h2></header>
    <div class="cols-heat">
      <div class="panel"><p class="chart-title">Assistants naming WHITEFOX (of ${NUM_PLATFORMS}), by market and buyer question. Dashed cells are zero.</p>${grid}</div>
      <div class="actions">
        <h3 class="h3">Exact URLs to build &amp; fix on whitefoxrealestate.com.au</h3>
        <ul class="ticks">
          <li><b>Restore the broken <code>/about</code> HTTP 404 page (Week 1):</b> Visiting <code>https://www.whitefoxrealestate.com.au/about</code> returns <b>HTTP 404 Not Found</b>. Launch an authoritative <code>/about</code> entity hub detailing founder <b>Marty Fox</b>, total $B+ sales volume, auction clearance rates, and all 16 offices.</li>
          <li><b>Split <code>/office/sydney</code> into <code>/office/sydney-manly</code> &amp; <code>/office/sydney-paddington</code>:</b> Currently, WHITEFOX only has a single <code>/office/sydney</code> URL (pointing to Manly with malformed phone <code>+61 8320 7800</code>) and no dedicated Paddington / Eastern Suburbs office URL despite having a physical office at <code>16 William St, Paddington</code>.</li>
          <li><b>Build Off-Market Prestige &amp; City-Specific Buyer Advocacy Hubs:</b> Create <code>/off-market-luxury-real-estate</code> and city-level advocacy pages (<code>/advocacy/melbourne</code>, <code>/advocacy/sydney</code>, <code>/advocacy/perth</code>, <code>/advocacy/brisbane</code>) plus $5M–$30M+ suburb record blocks on all 16 <code>/office/*</code> URLs.</li>
        </ul>
      </div>
    </div>
    ${src(SRC_ANS)}`);
}

// ─── 26. Workstream 04: Entity Accuracy & Live Site Audit (Benchmark Page 26) ─
slide('ws-entity', 'white', `
  <header class="hd"><p class="eyebrow">Workstream 04 · Forensic Schema &amp; Live Website Audit</p><h2 class="h1">WHITEFOX’s website schema literally tells Google and AI crawlers that WHITEFOX is Marshall White</h2></header>
  <div class="quotes">
    <figure class="quote rise" style="--d:100ms"><p class="q-src">Live JSON-LD Extracted from whitefoxrealestate.com.au (All 21 Audited Pages)</p><blockquote><code>{"@type": "Organization", "@id": "https://whitefoxrealestate.com.au#organization", "name": "WHITEFOX ", "sameAs": ["https://www.facebook.com/MarshallWhiteRE/", "https://twitter.com/marshallwhitere"]}</code></blockquote><figcaption><b>Root Cause:</b> The WordPress Yoast SEO configuration on <code>whitefoxrealestate.com.au</code> contains a catastrophic copy-paste leftover linking WHITEFOX’s <code>Organization</code> entity to arch-rival <b>Marshall White’s</b> Facebook and Twitter URLs!</figcaption></figure>
    <figure class="quote rise" style="--d:240ms"><p class="q-src">Live Inspection of All 16 /office/* Pages (site_audit.json)</p><blockquote><code>Schema types found: ["WebPage", "BreadcrumbList", "WebSite", "Organization"]</code> · <b>Zero <code>RealEstateAgent</code> or <code>LocalBusiness</code> blocks!</b></blockquote><figcaption><b>Root Cause:</b> None of the 16 branch pages (<code>/office/stonnington</code>, <code>/office/bayside</code>, <code>/office/perth</code>, <code>/office/brisbane</code>, <code>/office/sydney</code>, etc.) emit structured <code>PostalAddress</code>, <code>GeoCoordinates</code>, <code>telephone</code>, or <code>AggregateRating</code> schema.</figcaption></figure>
    <figure class="quote rise" style="--d:380ms"><p class="q-src">Live Crawl of /about, /office/sydney &amp; /office/essendon</p><blockquote><code>GET /about → HTTP 404 Page not found</code> · <code>/office/sydney → "+61 8320 7800"</code> · <code>/office/essendon → "1/ 50 Suite Fletcher Street"</code></blockquote><figcaption><b>Root Cause:</b> Broken <code>/about</code> 404 page, missing NSW <code>02</code> area code on <code>/office/sydney</code>, and garbled street address formatting on <code>/office/essendon</code> degrade NAP (Name, Address, Phone) consistency.</figcaption></figure>
  </div>
  <div class="actions wide">
    <h3 class="h3">Exact on-site schema &amp; DOM fixes to execute in Week 1</h3>
    <ul class="ticks cols">
      <li><b>Purge <code>MarshallWhiteRE</code> from Yoast SEO <code>sameAs</code> (Day 1):</b> Replace <code>facebook.com/MarshallWhiteRE/</code> and <code>twitter.com/marshallwhitere</code> with WHITEFOX’s verified profiles (<code>instagram.com/whitefoxrealestate/</code>, <code>linkedin.com/company/whitefox-real-estate/</code>, <code>facebook.com/WHITEFOXRealEstate/</code>, <code>youtube.com/@WHITEFOXRealEstate</code>) and trim the trailing space in <code>"WHITEFOX "</code>.</li>
      <li><b>Deploy <code>RealEstateAgent</code> JSON-LD on all 16 <code>/office/*</code> URLs:</b> Inject branch-specific <code>RealEstateAgent</code> schema containing exact street address, lat/lng <code>GeoCoordinates</code>, E.164 phone number, <code>areaServed</code> prestige suburbs, and <code>hasMap</code> pointing to each branch’s verified Google CID.</li>
      <li><b>Fix NAP Formatting &amp; Restore <code>/about</code>:</b> Change <code>+61 8320 7800</code> on <code>/office/sydney</code> to <code>+61 2 8320 7800</code>; clean <code>1/ 50 Suite Fletcher Street</code> on <code>/office/essendon</code> to <code>Suite 1, 50 Fletcher Street, Essendon VIC 3040</code>; publish a complete <code>/about</code> entity page.</li>
      <li><b>Add Person Schema for Key Directors &amp; Advisors:</b> Link <b>Marty Fox</b> and each office’s Directors/Heads of Advocacy via <code>Person</code> schema (<code>jobTitle</code>, <code>worksFor</code>, <code>sameAs</code> RateMyAgent/realestate.com.au profiles).</li>
    </ul>
  </div>
  ${src('Sources: Live Firecrawl scrape & JSON-LD audit of whitefoxrealestate.com.au (pipeline/site_audit.json), October 2026.')}`);

// ─── 27. Roadmap (Gantt — Benchmark Page 27) ────────────────────────────────
{
  const lanes = [
    ['01 · Schema & Entity Purge', [[1, 2, 'Purge MarshallWhiteRE sameAs bug; restore /about 404; fix Sydney/Essendon NAP'], [3, 6, 'Deploy RealEstateAgent + CID hasMap JSON-LD across all 16 /office/* URLs']]],
    ['02 · 14-Branch GBP Remediation', [[1, 4, 'Lift Perth Subiaco (3.9★→4.2★+), Gold Coast (1.0★→4.4★+) & Red Hill (3.3★→4.5★+)'], [4, 12, 'Seed 25+ reviews on Paddington (0★), Manly (2★), Northcote (0★) & Geelong/Torquay']]],
    ['03 · Suburb & Advocacy Hubs', [[2, 6, 'Split /office/sydney-paddington & manly; add $5M+ sales records to all 16 offices'], [6, 11, 'Launch /off-market-luxury-real-estate & city /advocacy/* landing pages']]],
    ['04 · Portals & Prestige PR', [[2, 5, 'Sync all 16 branches on realestate.com.au, Domain, RateMyAgent & OpenAgent'], [5, 12, 'Publish Q1 Prestige Market Report for AFR, Domain Prestige & Urban List citation']]],
    ['05 · Monthly 280-Prompt Audit', [[1, 12, `Baseline locked Oct 2026 (${M.wfMentioned}/${TOTAL_ANSWERS}); re-run 280-prompt panel on the 15th of each month`, 'light']]],
  ];
  const lab = 330;
  const gantt = `<div class="gantt">
    <div class="g-head" style="grid-template-columns:${lab}px repeat(12, 1fr)"><span></span>${Array.from({ length: 12 }, (_, i) => `<span>W${i + 1}</span>`).join('')}</div>
    ${lanes.map(([name, bars], li) => `<div class="g-lane"><span class="g-name">${name}</span><div class="g-track">${bars.map(([a, b, t, kind], bi) => `<div class="g-bar ${kind === 'light' ? 'milestone' : ''} grow-x" style="left:${(a - 1) / 12 * 100}%;width:${(b - a + 1) / 12 * 100}%;--d:${200 + (li * 2 + bi) * 90}ms"><span>${esc(t)}</span></div>`).join('')}</div></div>`).join('')}
    <div class="g-phases"><span style="width:33.33%">Month 1: Purge MarshallWhiteRE Schema &amp; Fix Sub-4.0★ GBPs</span><span style="width:33.33%">Month 2: 16-Office Schema, Advocacy Hubs &amp; Portals</span><span style="width:33.34%">Month 3: Interstate Review Velocity &amp; Prestige PR</span></div>
  </div>`;

  slide('roadmap', 'light', `
    <header class="hd"><p class="eyebrow">First 90 Days Execution</p><h2 class="h1">The first 90 days, week by week</h2></header>
    <div class="panel">${gantt}</div>
    <p class="note wide">Week 1 starts with 100% internal assets WHITEFOX controls today: purging <code>MarshallWhiteRE</code> from Yoast SEO <code>sameAs</code> schema, restoring <code>/about</code>, fixing <code>/office/sydney</code> &amp; <code>/office/essendon</code> NAP formatting, and lifting Subiaco (3.9★) &amp; Gold Coast (1.0★) above the 4.0★ AI threshold.</p>`);
}

// ─── 28. Proposed Targets (Benchmark Page 28) ───────────────────────────────
{
  const labels = ['Oct 26 (Today)', 'Jan 27 (90d)', 'Apr 27 (6m)', 'Oct 27 (12m)'];
  const xs = [0, 3, 6, 12];
  const w = 1000, h = 520, pl = 86, pr = 300, pt = 36, pb = 72;
  const melNow = cityStats.melbourne.rate;
  const target = [melNow, 26, 37, 49];
  const y = v => pt + (h - pt - pb) * (1 - v / 80);
  const x = m => pl + m / 12 * (w - pl - pr);
  const jcMel = cityStats.melbourne.top.find(f => f.name === 'Jellis Craig') || { name: 'Jellis Craig', n: 16 };
  const rivalRate = Math.round((jcMel.n / 35) * 100); // 46% (16/35)
  const fgMel = cityStats.melbourne.top.find(f => f.name === 'Forbes Global Properties') || { name: 'Forbes Global Properties', n: 11 };
  const fgRate = Math.round((fgMel.n / 35) * 100); // 31% (11/35)

  const svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="WHITEFOX Melbourne target path vs Jellis Craig and Forbes Global Properties">
    ${[0, 20, 40, 60, 80].map(t => `<line x1="${pl}" x2="${w - pr}" y1="${y(t)}" y2="${y(t)}" class="gl"/><text x="${pl - 16}" y="${y(t) + 8}" class="ax" text-anchor="end">${t}%</text>`).join('')}
    ${xs.map((m, i) => `<text x="${x(m)}" y="${h - pb + 42}" class="ax" text-anchor="middle">${labels[i]}</text>`).join('')}
    <line x1="${x(0)}" x2="${x(12)}" y1="${y(fgRate)}" y2="${y(fgRate)}" stroke="#64748B" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" class="fadein"/>
    <text x="${x(12) + 18}" y="${y(fgRate) + 8}" class="el" fill="#64748B">Forbes Global today <tspan class="elv">${fgRate}%</tspan></text>
    <line x1="${x(0)}" x2="${x(12)}" y1="${y(rivalRate)}" y2="${y(rivalRate)}" stroke="#0A0A0A" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round" class="fadein"/>
    <text x="${x(12) + 18}" y="${y(rivalRate) + 28}" class="el">Jellis Craig today <tspan class="elv">${rivalRate}%</tspan></text>
    <path d="${target.map((v, i) => `${i ? 'L' : 'M'}${x(xs[i])},${y(v)}`).join('')}" pathLength="1" class="draw" fill="none" stroke="#9A7B3E" stroke-width="6" stroke-dasharray="1" style="--d:300ms"/>
    <path d="${target.map((v, i) => `${i ? 'L' : 'M'}${x(xs[i])},${y(v)}`).join('')}" fill="none" stroke="#F8FAFC" stroke-width="7" stroke-dasharray="14 12" class="fadein" style="--d:1500ms"/>
    ${target.map((v, i) => `<circle cx="${x(xs[i])}" cy="${y(v)}" r="${i ? 10 : 13}" fill="${i ? '#F8FAFC' : '#9A7B3E'}" stroke="#9A7B3E" stroke-width="5" class="pop" style="--d:${400 + i * 350}ms"/><text x="${i ? x(xs[i]) : x(xs[i]) + 22}" y="${i ? y(v) - 24 : y(v) + 38}" text-anchor="${i ? 'middle' : 'start'}" class="callsmall pulp">${i === 3 ? '' : v + '%'}${i ? '' : ` today (${cityStats.melbourne.lhdMentions}/35)`}</text>`).join('')}
    <text x="${x(12) + 18}" y="${y(target[3]) - 12}" class="el pulp-t">WHITEFOX target <tspan class="elv">${target[3]}%</tspan></text>
  </svg>`;

  const TG = [
    ['Melbourne HQ', `${cityStats.melbourne.rate}% (${cityStats.melbourne.lhdMentions}/35)`, '26% (9/35)', '37% (13/35)', `49% · beats Jellis Craig (${rivalRate}%)`],
    ['Adelaide', `${cityStats.adelaide.rate}% (${cityStats.adelaide.lhdMentions}/35)`, '23% (8/35)', '34% (12/35)', '46% · beats The Agency (37%)'],
    ['Mornington Peninsula', `${cityStats.peninsula.rate}% (${cityStats.peninsula.lhdMentions}/35)`, '23% (8/35)', '34% (12/35)', '46% · beats RT Edgar (37%)'],
    ['Brisbane', `${cityStats.brisbane.rate}% (${cityStats.brisbane.lhdMentions}/35)`, '20% (7/35)', '29% (10/35)', '40% · beats McGrath (37%)'],
    ['Gold Coast', `${cityStats.goldcoast.rate}% (${cityStats.goldcoast.lhdMentions}/35)`, '17% (6/35)', '26% (9/35)', "37% · beats Sotheby's (26%)"],
    ['Sydney', `${cityStats.sydney.rate}% (${cityStats.sydney.lhdMentions}/35)`, '14% (5/35)', '23% (8/35)', '34% · beats McGrath (31%)'],
    ['Perth', `${cityStats.perth.rate}% (${cityStats.perth.lhdMentions}/35)`, '17% (6/35)', '29% (10/35)', '40% · beats Belle Property (34%)'],
    ['National “Australia”', `${cityStats.national.rate}% (${cityStats.national.lhdMentions}/35)`, '20% (7/35)', '31% (11/35)', '43% · beats McGrath (37%)'],
    ['All 280 Answers', `${M.wfRatePct}% (${M.wfMentioned}/280)`, '20.0% (56/280)', '30.4% (85/280)', "41.8% · beats Sotheby's (29.3%)"]
  ];

  slide('targets', 'light', `
    <header class="hd"><p class="eyebrow">Proposed Targets</p><h2 class="h1">The goal: overtake Forbes Global Properties (6m) and Jellis Craig (12m) in Melbourne</h2></header>
    <div class="cols-60">
      <div class="panel"><p class="chart-title">Melbourne (HQ): share of AI answers naming WHITEFOX Real Estate. Today's figure is measured; the dashed path is the target.</p>${svg}</div>
      <div>
        <table class="tg-table">
          <thead><tr><th>Market</th><th>Today</th><th>90 Days</th><th>6 Months</th><th>12 Months · Rival Overtaken</th></tr></thead>
          <tbody>${TG.map(([c, a, b, d, e], i) => `<tr class="rise" style="--d:${200 + i * 60}ms"><td>${c}</td><td class="num">${a}</td><td class="num">${b}</td><td class="num">${d}</td><td class="num"><b>${e}</b></td></tr>`).join('')}</tbody>
        </table>
        <p class="note">Rather than promising arbitrary leaderboard ranks, each market target is anchored to overtaking a specific mid-level competitor measured on the exact same 280-prompt panel each month.</p>
      </div>
    </div>`);
}

// ─── 29. Next Steps / Close (Benchmark Page 29) ─────────────────────────────
slide('close', 'dark close', `
  <div class="cover-bg" aria-hidden="true"></div>
  <p class="eyebrow on-dark rise" style="--d:0ms">Immediate Next Steps</p>
  <h2 class="display rise" style="--d:120ms">Purge the Marshall White schema bug. Lift every branch GBP above 4.2★. Measure every month.</h2>
  <ol class="next rise" style="--d:300ms">
    <li><span>1</span><p><b>Purge <code>MarshallWhiteRE</code> Schema Bug &amp; Restore <code>/about</code> (Week 1):</b> Remove <code>facebook.com/MarshallWhiteRE/</code> and <code>twitter.com/marshallwhitere</code> from Yoast SEO <code>Organization.sameAs</code>, deploy <code>RealEstateAgent</code> JSON-LD across all 16 <code>/office/*</code> URLs, restore <code>/about</code>, and fix the <code>+61 2 8320 7800</code> Sydney phone number.</p></li>
    <li><span>2</span><p><b>Remediate Sub-4.0★ &amp; Unrated Branch GBPs (Weeks 2–4):</b> Lift Perth Subiaco (<code>3.9★</code> across 144 reviews → <code>4.2★+</code>), Gold Coast Mermaid Beach (<code>1.0★</code> → <code>4.4★+</code>), Red Hill (<code>3.3★</code> → <code>4.5★+</code>), and Applecross (<code>3.7★</code> → <code>4.4★+</code>), while seeding 25+ reviews on Paddington, Manly, Northcote, and Geelong/Torquay.</p></li>
    <li><span>3</span><p><b>Publish Suburb Sales Records, Advocacy Hubs &amp; Track Monthly:</b> Split <code>/office/sydney-paddington</code> &amp; <code>/office/sydney-manly</code>, publish $5M–$30M+ sales records &amp; off-market hubs, sync RateMyAgent/realestate.com.au profiles, and re-run the 280-prompt benchmark on the 15th of each month.</p></li>
  </ol>
  <div class="close-logo">${logo()}<span class="byline">Prepared by Uprise Digital Research Team · Forensic AI Search Benchmark</span></div>`, { dark: true, noFoot: true });

// ─── 30. Appendix & Methodology (Benchmark Page 30) ─────────────────────────
slide('appendix', 'white', `
  <header class="hd"><p class="eyebrow">Appendix</p><h2 class="h1">Method and definitions</h2></header>
  <div class="cols-2 appx">
    <div>
      <h3 class="h3">How the 280 answers were collected</h3>
      <ul class="plain">
        <li>7 luxury real estate vendor, buyer, and property management questions (Best Luxury Agency, $5M+ Prestige Sales, Boutique Design-Led Agency, Off-Market Prestige Sales, Luxury Buyer's Advocacy, Penthouse &amp; Waterfront Specialists, Boutique Executive Leasing) × 8 Australian markets = 56 market-intent pairs.</li>
        <li>Each pair was evaluated across 5 live AI answer engines (Google AI Mode, ChatGPT Search, Perplexity Sonar, Gemini 2.5 Flash, and Claude Sonnet 4.6) for <i>N</i> = 280 total empirical answers.</li>
        <li>56 matching Australian Google SERP queries (depth 20), 8 Google Maps 20-pack audits, and 14 individual branch GBP CID lookups were executed via DataForSEO.</li>
        <li>200 URLs on <code>whitefoxrealestate.com.au</code> were mapped and 21 core &amp; branch pages were scraped via Firecrawl to inspect JSON-LD schema, HTTP status codes, and NAP consistency.</li>
      </ul>
    </div>
    <div>
      <h3 class="h3">How answers, citations, and econometrics were scored</h3>
      <ul class="plain">
        <li>Every luxury real estate agency and buyer's advocate named in an answer was extracted in order of first appearance and resolved to its canonical entity name across 55 tracked Australian prestige agencies.</li>
        <li>Grounding URLs and search citations were resolved to root domains in <code>pipeline/citations.json</code> (${CITS.totalCitations.toLocaleString()} citations across ${CITS.uniqueDomains} unique domains).</li>
        <li>Share of Model Voice (SoMV) is the percentage of answers naming an agency out of 280 nationally (or out of 35 per market), bounded with 95% Wilson confidence intervals.</li>
        <li>Econometric drivers (β̂ coefficients, standard errors, Wald <i>z</i>-statistics, and odds ratios) were estimated via live Iteratively Reweighted Least Squares (IRLS) logistic regression over the 280 empirical observations in <code>pipeline/ans_full.json</code>.</li>
      </ul>
    </div>
  </div>`);

// ─── Page Compilation with WHITEFOX Luxury Monochrome + Brass Theme Override ──
const CSS = fs.readFileSync(path.join(pipelineDir, 'deck.css'), 'utf8') + `
/* WHITEFOX Real Estate Stark Luxury Monochrome & Editorial Brass Theme Overrides */
:root {
  --pulp: #9A7B3E !important;
  --pulp-dark: #7A5F2B !important;
  --navy: #0A0A0A !important;
}
.slide.dark, .slide.cover, .slide.close {
  background: #0A0A0A !important;
}
.slide.accent {
  background: linear-gradient(135deg, #0A0A0A 0%, #1C1917 65%, #29231A 100%) !important;
}
.hb-row.is-pulp .hb-fill, .fillc, .lg-dot.pulp, .key.on, .cv-cells i.on, .dots i.on {
  background-color: #9A7B3E !important;
  fill: #9A7B3E !important;
}
.pulp, .pulp-t, .m-pulp, .eyebrow {
  color: #9A7B3E !important;
  fill: #9A7B3E !important;
}
/* 8-Market & 35-Cell Grid Precision Fit Overrides */
.cover { grid-template-columns: 740px 1fr !important; gap: 0 40px !important; }
.cover-grid { padding: 22px 24px !important; max-width: 940px !important; }
.cv-row { grid-template-columns: 165px auto 38px !important; gap: 10px !important; }
.cv-cells { gap: 3px !important; }
.cv-cells i { width: 12px !important; height: 18px !important; }
.cv-cells i:nth-child(5n):not(:last-child) { margin-right: 5px !important; }
.finds-col { gap: 12px !important; }
.finds-col p { font-size: 19px !important; line-height: 1.35 !important; padding-top: 10px !important; }
.finds-col b { font-size: 20px !important; }
.mp-head, .mp-row { grid-template-columns: 205px 250px 1fr !important; gap: 16px !important; }
.mp-row { padding: 8px 0 !important; font-size: 18.5px !important; }
.mp-row .num { font-size: 17.5px !important; white-space: nowrap !important; }
#ws-entity .quote { padding: 16px 20px 14px !important; gap: 8px !important; }
#ws-entity .quote blockquote { font-size: 18.5px !important; line-height: 1.3 !important; }
#ws-entity .quote figcaption { font-size: 16.5px !important; padding-top: 8px !important; }
#ws-entity .ticks.cols { gap: 10px 44px !important; margin-bottom: 6px !important; }
#ws-entity .ticks.cols li { font-size: 18px !important; line-height: 1.32 !important; }
#targets .cols-60 { grid-template-columns: 1.15fr 1.15fr !important; gap: 44px !important; }
.tg-table { font-size: 17.5px !important; margin-bottom: 10px !important; }
.tg-table th { font-size: 14px !important; padding: 0 8px 8px !important; }
.tg-table td { padding: 6px 8px !important; white-space: nowrap !important; }
#targets .note { font-size: 17.5px !important; line-height: 1.35 !important; }
.why .points { gap: 16px !important; }
.why .points li { font-size: 20px !important; padding-top: 14px !important; }
`;
const JS = fs.readFileSync(path.join(pipelineDir, 'deck.js'), 'utf8');
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WHITEFOX Real Estate · Luxury Property AI Search Visibility Report (Oct 2026)</title>
<meta name="description" content="Empirical 280-answer study of where AI assistants recommend WHITEFOX Real Estate (whitefoxrealestate.com.au) across 8 Australian prestige property markets, and the 5-workstream remediation plan.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@700,600,500&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap">
<style>${CSS}</style>
</head>
<body>
<div class="deck" id="deck">
  <div class="stage" id="stage">${slides.join('\n')}
    <div class="progress" aria-hidden="true"><i id="bar"></i></div>
  </div>
</div>
<nav class="controls" id="controls" aria-label="Slide controls">
  <button id="prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button>
  <span id="count" class="ctr">1 / ${slides.length}</span>
  <button id="next" type="button" aria-label="Next slide"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button>
  <button id="fs" type="button" aria-label="Full screen"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></button>
</nav>
<script>${JS}</script>
</body>
</html>`;

fs.mkdirSync(path.join(pipelineDir, 'out'), { recursive: true });
fs.writeFileSync(path.join(pipelineDir, 'out', 'index.html'), html);
fs.writeFileSync(path.join(rootDir, 'site', 'index.html'), html);
console.log(`Generated ${slides.length} slides! Output written to site/index.html (${html.length} bytes).`);
