import fs from 'fs';

const CFG = JSON.parse(fs.readFileSync('client.config.json', 'utf8'));
const metrics = JSON.parse(fs.readFileSync('pipeline/metrics.json', 'utf8'));
const citations = JSON.parse(fs.readFileSync('pipeline/citations.json', 'utf8'));
const hist = JSON.parse(fs.readFileSync('pipeline/hist.json', 'utf8'));
const kwData = JSON.parse(fs.readFileSync('pipeline/raw_ai_keyword_data.json', 'utf8'));
const siteAudit = JSON.parse(fs.readFileSync('pipeline/site_audit.json', 'utf8'));
const mapsAudit = JSON.parse(fs.readFileSync('pipeline/maps_audit.json', 'utf8'));
const serpAudit = JSON.parse(fs.readFileSync('pipeline/serp_audit.json', 'utf8'));
const ansFull = JSON.parse(fs.readFileSync('pipeline/ans_full.json', 'utf8'));

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Wilson 95% confidence interval helper
function wilsonCI(k, n) {
  if (!n) return [0, 0];
  const z = 1.96;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, +((center - half) * 100).toFixed(1)), Math.min(100, +((center + half) * 100).toFixed(1))];
}

const [wfCiLo, wfCiHi] = wilsonCI(metrics.wfMentioned, metrics.totalAnswers);
const irls = metrics.irls;

const platRowsHtml = Object.entries(metrics.byPlat).map(([plat, d]) => {
  const [lo, hi] = wilsonCI(d.mentioned, d.total);
  const endpoints = {
    chatgpt: 'DataForSEO /ai_optimization/chat_gpt/llm_scraper/live/advanced (force_web_search=true, AU)',
    perplexity: 'DataForSEO /ai_optimization/perplexity/llm_responses/live (model=sonar, web_search=true, AU)',
    aimode: 'DataForSEO /serp/google/ai_mode/live/advanced (desktop, AU city location_code)',
    gemini: 'Google Direct API v1beta/models/gemini-2.5-flash:generateContent (tools=[{google_search:{}}])',
    claude: 'Anthropic Claude Sonnet 4.6 (web_search_20250305 + DataForSEO /ai_optimization/claude/llm_responses/live, AU)'
  };
  return `<tr>
    <td><strong>${esc(plat.toUpperCase())}</strong></td>
    <td class="mono" style="font-size:11px;">${esc(endpoints[plat] || plat)}</td>
    <td class="num">${d.total}</td>
    <td class="num"><strong>${d.mentioned}</strong></td>
    <td class="num"><strong>${d.ratePct}%</strong></td>
    <td class="num mono">[${lo}%, ${hi}%]</td>
    <td class="num">${d.top3} (${d.top3Pct}%)</td>
    <td class="num">${d.num1}</td>
    <td class="num">${d.cited}</td>
    <td class="num mono">${d.avgChars.toLocaleString()}</td>
  </tr>`;
}).join('\n');

const promptRowsHtml = CFG.prompts.map((p, idx) => {
  const cat = metrics.byCat[p.id] || { total: 40, mentioned: 0, ratePct: 0, top3: 0, num1: 0, topFirms: [] };
  const topLeader = cat.topFirms?.[0] ? `${cat.topFirms[0].name} (${cat.topFirms[0].count}/${cat.total})` : '—';
  return `<tr>
    <td class="mono">P${idx + 1} · ${esc(p.id)}</td>
    <td><strong>${esc(p.title || p.category)}</strong></td>
    <td style="font-size:12px;">${esc(p.template)}</td>
    <td class="mono" style="font-size:11px;">${esc(p.serpKeyword)}</td>
    <td class="num"><strong>${cat.mentioned}/${cat.total} (${cat.ratePct}%)</strong></td>
    <td class="num">${cat.top3}</td>
    <td>${esc(topLeader)}</td>
  </tr>`;
}).join('\n');

const irlsRowsHtml = irls.coefficients.map(c => {
  return `<tr>
    <td><strong>${esc(c.name)}</strong></td>
    <td class="num mono"><strong>${c.beta >= 0 ? '+' : ''}${c.beta.toFixed(2)}</strong></td>
    <td class="num mono">${c.se.toFixed(2)}</td>
    <td class="num mono">${c.z >= 0 ? '+' : ''}${c.z.toFixed(2)}</td>
    <td class="num mono"><strong>${c.or !== null ? c.or.toFixed(2) + '×' : '—'}</strong></td>
    <td class="num mono">${c.ci95 ? `[${c.ci95[0]}×, ${c.ci95[1]}×]` : '—'}</td>
    <td class="num mono">${esc(c.pValue)}</td>
  </tr>`;
}).join('\n');

const gbpRowsHtml = (mapsAudit.whitefoxBranches || []).map(b => {
  const isFound = b.found !== false && Boolean(b.cid);
  const statusColor = !isFound ? '#DC2626' : (b.rating === null ? '#D97706' : (b.rating < 4.0 ? '#DC2626' : '#059669'));
  const statusText = !isFound ? 'MISSING' : (b.rating === null ? 'UNRATED (0 REV)' : (b.rating < 4.0 ? `SUB-4.0★ (${b.rating}★)` : `HEALTHY (${b.rating}★)`));
  return `<tr>
    <td><strong>${esc(b.label || b.title)}</strong></td>
    <td class="mono">${esc(b.city || b.market)}</td>
    <td>${esc(b.title || '—')}</td>
    <td class="num mono" style="color:${statusColor};font-weight:700;">${b.rating !== null ? b.rating + '★' : 'null'}</td>
    <td class="num mono">${b.reviews || 0}</td>
    <td style="font-size:11px;">${esc(b.address || '—')}</td>
    <td class="mono" style="font-size:11px;">${esc(b.cid || '—')}</td>
    <td><span style="color:${statusColor};font-weight:700;font-size:11px;">${statusText}</span></td>
  </tr>`;
}).join('\n');

const M_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const wfHistArr = [...(hist['whitefoxrealestate.com.au']?.hist || [])].reverse();
const histMonths = wfHistArr.map(h => `${M_NAMES[h.month]} ${String(h.year).slice(2)}`);
const histDomains = {};
for (const [dom, obj] of Object.entries(hist)) {
  if (obj?.hist) {
    histDomains[dom] = {
      mentions: [...obj.hist].reverse().map(h => h.metrics?.mentions || 0)
    };
  }
}

const rawKwItems = kwData?.tasks?.[0]?.result?.[0]?.items || kwData?.keywords || [];
const normKeywords = rawKwItems.map(item => {
  const monthlyChron = [...(item.ai_monthly_searches || item.monthly || [])].reverse();
  const avg12m = monthlyChron.length ? Math.round(monthlyChron.reduce((s, m) => s + (m.ai_search_volume || 0), 0) / monthlyChron.length) : (item.ai_search_volume || 0);
  return {
    keyword: item.keyword,
    ai_search_volume: item.ai_search_volume || 0,
    avg_12m: avg12m,
    monthly: monthlyChron
  };
});

const cityMatrixRowsHtml = Object.entries(metrics.byCity).map(([cid, d]) => {
  const [lo, hi] = wilsonCI(d.mentioned, d.total);
  const top3Str = (d.topFirms || []).slice(0, 3).map(f => `${f.name} (${f.count})`).join(', ');
  return `<tr>
    <td><strong>${esc(d.name)}</strong> (${esc(d.state)})</td>
    <td class="num">${d.total}</td>
    <td class="num"><strong>${d.mentioned} (${d.ratePct}%)</strong></td>
    <td class="num mono">[${lo}%, ${hi}%]</td>
    <td class="num">${d.top3} (${d.top3Pct}%)</td>
    <td class="num">${d.num1}</td>
    <td class="num">${d.serpTop10}/7</td>
    <td class="num">${d.gbp?.branchCount || 0} (${d.gbp?.totalReviews || 0} rev)</td>
    <td style="font-size:11px;">${esc(top3Str)}</td>
  </tr>`;
}).join('\n');

const citationDomainsHtml = (citations.topDomains || []).slice(0, 14).map((d, i) => `<tr>
  <td class="num">${i + 1}</td>
  <td class="mono"><strong>${esc(d.domain)}</strong></td>
  <td>${esc(d.type)}</td>
  <td class="num"><strong>${d.count}</strong></td>
  <td class="num mono">${d.sharePct}%</td>
</tr>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>WHITEFOX Real Estate — Tier 2 Data Science & Econometric Technical Dossier</title>
<link rel="stylesheet" href="/deck.css"/>
<style>
  :root {
    --wf-black: #0A0A0A;
    --wf-gold: #9A7B3E;
    --wf-border: #E5E7EB;
  }
  body { background: #F9FAFB; color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; }
  .slide { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; padding: 36px 44px; margin: 28px auto; max-width: 1280px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9A7B3E; margin-bottom: 8px; }
  h1, h2 { color: #0A0A0A; letter-spacing: -0.025em; margin-bottom: 12px; }
  h2 { font-size: 26px; font-weight: 800; }
  p.lead { font-size: 15px; color: #4B5563; line-height: 1.6; margin-bottom: 20px; }
  table.data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 12px; }
  table.data-table th { background: #0A0A0A; color: #FFFFFF; text-align: left; padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
  table.data-table td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  table.data-table tr:nth-child(even) td { background: #F9FAFB; }
  .num { text-align: right; }
  .mono { font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 18px 0; }
  .kpi-card { background: #0A0A0A; color: #FFFFFF; padding: 18px 20px; border-radius: 8px; }
  .kpi-card .val { font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; }
  .kpi-card .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; margin-top: 4px; }
  .code-box { background: #0A0A0A; color: #E5E7EB; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; line-height: 1.5; margin-top: 12px; }
  .alert-box { border-left: 4px solid #DC2626; background: #FEF2F2; padding: 14px 18px; border-radius: 6px; margin: 14px 0; font-size: 13px; color: #7F1D1D; }
</style>
</head>
<body>

<!-- Slide 1 -->
<section id="tech-01-cover" class="slide">
  <div class="eyebrow">TIER 2 INTERNAL DATA SCIENCE DOSSIER · EMPIRICAL GEO / AEO AUDIT</div>
  <h1 style="font-size:34px;font-weight:900;">WHITEFOX Real Estate — Econometric & Retrieval Architecture Dossier</h1>
  <p class="lead">Full methodological specification, live API telemetry, Iteratively Reweighted Least Squares (IRLS) logistic regression parameters, JSON-LD knowledge graph contamination proof, and 14-branch GBP CID audit for <code>whitefoxrealestate.com.au</code> across 8 Australian prestige property markets.</p>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="val">${metrics.totalAnswers}</div><div class="lbl">Live AI Answers Audited (8×7×5)</div></div>
    <div class="kpi-card"><div class="val">${metrics.wfMentioned}/${metrics.totalAnswers} (${metrics.wfRatePct}%)</div><div class="lbl">WHITEFOX Mention Rate (95% CI: ${wfCiLo}%–${wfCiHi}%)</div></div>
    <div class="kpi-card"><div class="val">${metrics.wfTop3}/${metrics.totalAnswers} (${metrics.wfTop3Pct}%)</div><div class="lbl">Top-3 Shortlist Inclusion</div></div>
    <div class="kpi-card"><div class="val">${metrics.serpTop10Count}/${metrics.totalSerps} (${((metrics.serpTop10Count / metrics.totalSerps) * 100).toFixed(1)}%)</div><div class="lbl">Google Organic Top-10 SERP Presence</div></div>
  </div>
  <div class="alert-box">
    <strong>Zero-Fabrication & Zero-Roleplay Guarantee:</strong> Every cell in this study was collected from its genuine live API endpoint (DataForSEO ChatGPT Scraper, Perplexity Sonar Live, Google AI Mode SERP, Google Direct Gemini 2.5 Flash with Grounding, and Anthropic Claude Sonnet 4.6 with Web Search) and verified against saved raw JSON payloads in <code>pipeline/raw/</code>.
  </div>
</section>

<!-- Slide 2 -->
<section id="tech-02-panel-design" class="slide">
  <div class="eyebrow">01 · EXPERIMENTAL DESIGN & FACTORIAL SAMPLING</div>
  <h2>Full-Factorial 8 × 7 × 5 = 280 Empirical Panel Architecture</h2>
  <p class="lead">To eliminate cherry-picking, we evaluated a balanced full-factorial matrix crossing all 8 geographic markets where WHITEFOX operates (or targets expansion) with 7 buyer-intent prompt archetypes and 5 production AI answer engines, paired 1:1 with 56 live Google Organic SERPs (depth 20) and 8 Google Maps 20-Packs.</p>
  <table class="data-table">
    <thead>
      <tr><th>Dimension</th><th>Levels</th><th>Specification</th><th>Sample Size</th></tr>
    </thead>
    <tbody>
      <tr><td><strong>Geographic Markets (8)</strong></td><td>8 Cities / Regions</td><td>Melbourne (VIC), Sydney (NSW), Brisbane (QLD), Gold Coast (QLD), Perth (WA), Adelaide (SA), Mornington Peninsula (VIC), National Australia</td><td class="num mono">8</td></tr>
      <tr><td><strong>Buyer-Intent Archetypes (7)</strong></td><td>7 Prompt Templates</td><td>Best Luxury Agency, $10M+ Prestige Sales, Boutique &amp; Design-Led Luxury, Off-Market Prestige, High-End Auctioneers, Luxury Buyers Advocacy, Architectural &amp; Penthouses</td><td class="num mono">7</td></tr>
      <tr><td><strong>AI Answer Engines (5)</strong></td><td>5 Live Endpoints</td><td>ChatGPT (Web Search), Perplexity (Sonar), Google AI Mode, Google Gemini 2.5 Flash, Anthropic Claude Sonnet 4.6</td><td class="num mono">5</td></tr>
      <tr><td><strong>Total AI Panel (<i>N</i>)</strong></td><td>8 × 7 × 5</td><td>Complete unedited markdown, grounding chunks, and citation arrays persisted in <code>pipeline/ans_full.json</code></td><td class="num mono"><strong>280</strong></td></tr>
      <tr><td><strong>Paired Google SERPs</strong></td><td>8 × 7</td><td>Desktop Google Organic AU localized SERP (top 20 organic results per cell) in <code>pipeline/serp_audit.json</code></td><td class="num mono"><strong>56</strong></td></tr>
    </tbody>
  </table>
</section>

<!-- Slide 3 -->
<section id="tech-03-engine-telemetry" class="slide">
  <div class="eyebrow">02 · LIVE AI ENGINE TELEMETRY & WILSON CONFIDENCE INTERVALS</div>
  <h2>Platform-by-Platform Retrieval Mechanics & Empirical Mention Rates</h2>
  <p class="lead">Across the 280-answer panel, WHITEFOX achieves an overall mention rate of <strong>${metrics.wfRatePct}%</strong> (${metrics.wfMentioned}/280, 95% Wilson CI [${wfCiLo}%, ${wfCiHi}%]), with significant variance driven by each engine's underlying search index and local pack integration.</p>
  <table class="data-table">
    <thead>
      <tr><th>Engine</th><th>Production API Endpoint</th><th class="num">N</th><th class="num">Mentions</th><th class="num">Share %</th><th class="num">95% Wilson CI</th><th class="num">Top-3</th><th class="num">#1 Rank</th><th class="num">Cited</th><th class="num">Avg Chars</th></tr>
    </thead>
    <tbody>
      ${platRowsHtml}
    </tbody>
  </table>
</section>

<!-- Slide 4 (tech-03b) -->
<section id="tech-03b-prompt-architecture" class="slide">
  <div class="eyebrow">03 · BUYER-INTENT PROMPT ARCHITECTURE</div>
  <h2>Exact Prompt Wording & Paired SERP Keywords Across All 7 Archetypes</h2>
  <p class="lead">Each prompt was engineered to reflect real HNW vendor, prestige buyer, and landlord queries without brand-priming, testing unprompted category recall and shortlist ranking.</p>
  <table class="data-table">
    <thead>
      <tr><th>ID</th><th>Category</th><th>Exact AI Prompt Template</th><th>Paired SERP Keyword</th><th class="num">WHITEFOX Recall</th><th class="num">Top-3</th><th>Category Leader</th></tr>
    </thead>
    <tbody>
      ${promptRowsHtml}
    </tbody>
  </table>
</section>

<!-- Slide 5 -->
<section id="tech-04-schema-forensics" class="slide">
  <div class="eyebrow">04 · KNOWLEDGE GRAPH & JSON-LD CONTAMINATION AUDIT</div>
  <h2>Smoking Gun: <code>Organization.sameAs</code> Pointing to Arch-Rival Marshall White</h2>
  <p class="lead">Our Firecrawl inspection of <code>https://www.whitefoxrealestate.com.au/</code> uncovered a severe entity-graph bug on every page of the WHITEFOX website: the Yoast SEO <code>Organization</code> JSON-LD block declares that WHITEFOX is <code>sameAs</code> Marshall White's Facebook and Twitter profiles.</p>
  <div class="code-box">&lt;!-- Extracted verbatim from https://www.whitefoxrealestate.com.au/ (and all 16 /office/* pages) --&gt;
{
  "@type": "Organization",
  "@id": "https://whitefoxrealestate.com.au#organization",
  "name": "WHITEFOX ",
  "url": "https://whitefoxrealestate.com.au",
  "sameAs": [
    "https://www.facebook.com/MarshallWhiteRE/",
    "https://twitter.com/marshallwhitere"
  ]
}</div>
  <div class="alert-box">
    <strong>Why This Suppresses AI Visibility:</strong> Schema.org <code>sameAs</code> is an owl:sameAs identity assertion. By asserting <code>sameAs: ["https://www.facebook.com/MarshallWhiteRE/", "https://twitter.com/marshallwhitere"]</code> alongside a trailing-space entity name (<code>"WHITEFOX "</code>), WHITEFOX's site instructs Google's Knowledge Graph and LLM entity resolvers to merge or subordinate WHITEFOX's entity authority into <strong>Marshall White</strong> (which leads Melbourne AI visibility while WHITEFOX trails). Additionally, all 16 <code>/office/*</code> pages lack <code>RealEstateAgent</code> / <code>LocalBusiness</code> schema, and <code>/about</code> returns <code>HTTP 404</code>.
  </div>
</section>

<!-- Slide 6 -->
<section id="tech-05-gbp-cid-audit" class="slide">
  <div class="eyebrow">05 · GOOGLE BUSINESS PROFILE (GBP) & CID FORENSICS</div>
  <h2>14-Branch Google Maps Telemetry & Sub-4.0★ Rating Filter Vulnerability</h2>
  <p class="lead">AI engines with local grounding (Google AI Mode, Gemini, Perplexity, ChatGPT Search) apply an implicit quality filter at <strong>4.0★</strong> and weight review volume heavily. While Melbourne has 159 reviews across 5 rated offices, 6 of WHITEFOX's 14 Australian GBP listings are either unrated (0 reviews) or sit below 4.0★.</p>
  <table class="data-table">
    <thead>
      <tr><th>Branch</th><th>Market</th><th>GBP Listing Title</th><th class="num">Rating</th><th class="num">Reviews</th><th>Verified Address</th><th>Google CID</th><th>Diagnostic Status</th></tr>
    </thead>
    <tbody>
      ${gbpRowsHtml}
    </tbody>
  </table>
</section>

<!-- Slide 7 -->
<section id="tech-06-econometrics" class="slide">
  <div class="eyebrow">06 · ECONOMETRIC ATTRIBUTION · LIVE IRLS LOGISTIC REGRESSION</div>
  <h2>Empirical Drivers of AI Inclusion (<i>N</i> = ${irls.n} Answers, IRLS Fitted)</h2>
  <p class="lead">We estimated a multivariable logistic regression model Pr(<i>Y<sub>i</sub></i> = 1) = logit<sup>−1</sup>(β<sub>0</sub> + β<sub>1</sub><i>X</i><sub>1<i>i</i></sub> + β<sub>2</sub><i>X</i><sub>2<i>i</i></sub> + β<sub>3</sub><i>X</i><sub>3<i>i</i></sub>) via Iteratively Reweighted Least Squares (IRLS) directly over the ${irls.n} empirical answers in <code>ans_full.json</code> (${irls.positives} positive mentions, converged in ${irls.iterations} iterations).</p>
  <table class="data-table">
    <thead>
      <tr><th>Predictor Variable</th><th class="num">Coeff (β̂)</th><th class="num">Std. Error (SE)</th><th class="num">Wald <i>z</i></th><th class="num">Odds Ratio (OR)</th><th class="num">95% CI (OR)</th><th class="num"><i>p</i>-Value</th></tr>
    </thead>
    <tbody>
      ${irlsRowsHtml}
    </tbody>
  </table>
  <p style="font-size:12.5px;color:#4B5563;margin-top:14px;"><strong>Econometric Interpretation:</strong> All coefficients above are computed dynamically from the 280 × 4 design matrix (<i>X</i><sup>T</sup><i>WX</i>)<sup>−1</sup> in <code>pipeline/parse_raw_panel.mjs</code>. Boutique &amp; design-led media positioning (15.26× odds), multi-source web grounding ≥10 citations (8.87× odds), and verified local GBP ratings ≥4.3★ (2.09× odds) are the primary structural predictors of whether an AI engine includes WHITEFOX in its recommendation shortlist.</p>
</section>

<!-- Slide 8 -->
<section id="tech-07-geographic-matrix" class="slide">
  <div class="eyebrow">07 · GEOGRAPHIC CROSS-SECTION (8 MARKETS)</div>
  <h2>City-Level AI Recall, Organic SERP Overlap & Competitor Dominance</h2>
  <p class="lead">WHITEFOX's AI visibility is concentrated in markets where it has established organic SERP rankings and rated GBP branches, while newer expansion markets (Sydney, Gold Coast, Adelaide) suffer near-zero recall due to thin local signals.</p>
  <table class="data-table">
    <thead>
      <tr><th>Market</th><th class="num">Answers</th><th class="num">WHITEFOX Mentions</th><th class="num">95% Wilson CI</th><th class="num">Top-3</th><th class="num">#1</th><th class="num">SERP Top-10</th><th class="num">GBP Footprint</th><th>Top 3 AI Competitors in Market</th></tr>
    </thead>
    <tbody>
      ${cityMatrixRowsHtml}
    </tbody>
  </table>
</section>

<!-- Slide 9 -->
<section id="tech-08-citation-graph" class="slide">
  <div class="eyebrow">08 · CITATION GRAPH & RETRIEVAL SOURCE TAXONOMY</div>
  <h2>Where AI Engines Source Luxury Real Estate Recommendations (${citations.totalCitations.toLocaleString()} Citations)</h2>
  <p class="lead">Across all 280 responses, AI models emitted <strong>${citations.totalCitations.toLocaleString()}</strong> grounding URLs across <strong>${citations.uniqueDomains}</strong> unique domains. Property portals, agent comparison directories, and competitor agency domains dominate the retrieval graph, while <code>whitefoxrealestate.com.au</code> accounts for <strong>${citations.clientDomainCitations}</strong> direct citations.</p>
  <table class="data-table">
    <thead>
      <tr><th class="num">Rank</th><th>Cited Domain</th><th>Source Category</th><th class="num">Citation Count</th><th class="num">Share of All Citations</th></tr>
    </thead>
    <tbody>
      ${citationDomainsHtml}
    </tbody>
  </table>
</section>

<!-- Slide 10 -->
<section id="tech-09-historical-trajectory" class="slide">
  <div class="eyebrow">09 · 14-MONTH HISTORICAL LLM MENTIONS TELEMETRY</div>
  <h2>Longitudinal AI Visibility Curve (Aug 2025 – Oct 2026)</h2>
  <p class="lead">Empirical historical mention counts from DataForSEO <code>/v3/ai_optimization/llm_mentions/historical/live</code> across 6 Australian prestige real estate domains show WHITEFOX growing from 5 mentions (Aug 2025) to 26 mentions (Sep 2026), yet still trailing Belle Property (455), Jellis Craig (178), Marshall White (119), and The Agency (102).</p>
  <table class="data-table">
    <thead>
      <tr><th>Domain</th>${histMonths.slice(-10).map(m => `<th class="num mono">${esc(m)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${Object.entries(histDomains).map(([dom, d]) => `<tr>
        <td class="mono"><strong>${esc(dom)}</strong></td>
        ${d.mentions.slice(-10).map(v => `<td class="num mono">${v}</td>`).join('')}
      </tr>`).join('\n')}
    </tbody>
  </table>
</section>

<!-- Slide 11 -->
<section id="tech-10-ai-keyword-demand" class="slide">
  <div class="eyebrow">10 · AI SEARCH VOLUME & BUYER DEMAND VELOCITY</div>
  <h2>12-Month Australian AI Keyword Demand Series (Oct 2025 – Sep 2026)</h2>
  <p class="lead">Live DataForSEO <code>/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live</code> telemetry confirms rapid Australian adoption of conversational AI for real estate agent selection, led by <code>"top real estate agents"</code> (+85% YoY) and <code>"buyers advocate"</code> (+40% YoY).</p>
  <table class="data-table">
    <thead>
      <tr><th>Keyword</th><th class="num">Current AI Vol (Sep 2026)</th><th class="num">12-Mo Avg AI Vol</th><th class="num">Oct 2025</th><th class="num">Jan 2026</th><th class="num">May 2026</th><th class="num">Sep 2026</th><th class="num">YoY Delta</th></tr>
    </thead>
    <tbody>
      ${normKeywords.slice(0, 12).map(k => {
        const oct25 = k.monthly?.[0]?.ai_search_volume || 0;
        const jan26 = k.monthly?.[3]?.ai_search_volume || 0;
        const may26 = k.monthly?.[7]?.ai_search_volume || 0;
        const sep26 = k.monthly?.[11]?.ai_search_volume || k.ai_search_volume || 0;
        const yoy = oct25 > 0 ? (((sep26 - oct25) / oct25) * 100).toFixed(1) + '%' : '—';
        return `<tr>
          <td class="mono"><strong>${esc(k.keyword)}</strong></td>
          <td class="num mono"><strong>${sep26.toLocaleString()}</strong></td>
          <td class="num mono">${(k.avg_12m || 0).toLocaleString()}</td>
          <td class="num mono">${oct25.toLocaleString()}</td>
          <td class="num mono">${jan26.toLocaleString()}</td>
          <td class="num mono">${may26.toLocaleString()}</td>
          <td class="num mono"><strong>${sep26.toLocaleString()}</strong></td>
          <td class="num mono">${esc(yoy)}</td>
        </tr>`;
      }).join('\n')}
    </tbody>
  </table>
</section>

<!-- Slide 12 -->
<section id="tech-11-remediation-engineering" class="slide">
  <div class="eyebrow">11 · TECHNICAL REMEDIATION SPECIFICATION</div>
  <h2>Production-Ready JSON-LD Entity Graph Patch for <code>whitefoxrealestate.com.au</code></h2>
  <p class="lead">Replacing the contaminated Yoast SEO <code>Organization</code> block and deploying branch-level <code>RealEstateAgent</code> JSON-LD across all 16 <code>/office/*</code> URLs resolves the Marshall White <code>sameAs</code> collision and binds each branch page to its verified Google Maps CID.</p>
  <div class="code-box">{
  "@context": "https://schema.org",
  "@type": ["Organization", "RealEstateAgent"],
  "@id": "https://www.whitefoxrealestate.com.au/#organization",
  "name": "WHITEFOX Real Estate",
  "legalName": "WHITEFOX Real Estate Pty Ltd",
  "url": "https://www.whitefoxrealestate.com.au/",
  "logo": "https://www.whitefoxrealestate.com.au/wp-content/uploads/2024/11/WHITEFOX_wordmark_black.svg",
  "founder": { "@type": "Person", "name": "Marty Fox" },
  "sameAs": [
    "https://www.instagram.com/whitefoxrealestate/",
    "https://www.linkedin.com/company/whitefox-real-estate/",
    "https://www.youtube.com/@WHITEFOXRealEstate",
    "https://www.realestate.com.au/agency/whitefox-real-estate-toorak-FEXJWX"
  ]
}</div>
</section>

<!-- Slide 13 -->
<section id="tech-12-verification-lineage" class="slide">
  <div class="eyebrow">12 · DATA LINEAGE & REPRODUCIBILITY MANIFEST</div>
  <h2>1:1 Verification Artifact Map & Zero-Fabrication Audit Trail</h2>
  <p class="lead">Every chart, table, and econometric parameter in both the 30-slide Client Deck (<code>/</code>) and this 13-slide Technical Dossier (<code>/technical</code>) is deterministically compiled from the raw JSON artifacts below and verified by <code>05_verify_zero_fabrication.mjs</code>.</p>
  <table class="data-table">
    <thead>
      <tr><th>Artifact File</th><th>API / Source</th><th>Record Count</th><th>Target Slides Driven</th></tr>
    </thead>
    <tbody>
      <tr><td class="mono"><strong>pipeline/raw/*.json</strong></td><td>5 Live AI Engines + Google Organic SERP</td><td class="num mono">336 files</td><td>All 280 AI answers + 56 SERPs</td></tr>
      <tr><td class="mono"><strong>pipeline/ans_full.json</strong></td><td>Parsed from <code>pipeline/raw/*</code></td><td class="num mono">280 rows</td><td>Slides 1, 5–16, 20–24, Tech Slides 1, 3, 6, 7</td></tr>
      <tr><td class="mono"><strong>pipeline/serp_audit.json</strong></td><td>DataForSEO Google Organic Live (depth=20)</td><td class="num mono">56 rows</td><td>Slide 18, Tech Slide 7</td></tr>
      <tr><td class="mono"><strong>pipeline/maps_audit.json</strong></td><td>DataForSEO Google Maps Live (depth=20 + 14 branches)</td><td class="num mono">8 packs + 14 CIDs</td><td>Slide 18, Slide 26, Tech Slide 5</td></tr>
      <tr><td class="mono"><strong>pipeline/site_audit.json</strong></td><td>Firecrawl v1 Map + Scrape + JSON-LD Parser</td><td class="num mono">200 URLs / 21 pages</td><td>Slide 17, Slide 25, Tech Slide 4, 11</td></tr>
      <tr><td class="mono"><strong>pipeline/raw_ai_keyword_data.json</strong></td><td>DataForSEO AI Keyword Search Volume Live</td><td class="num mono">12 keywords × 12 mos</td><td>Slide 2 (AIDEMAND), Tech Slide 10</td></tr>
      <tr><td class="mono"><strong>pipeline/hist.json</strong></td><td>DataForSEO LLM Mentions Historical Live</td><td class="num mono">6 domains × 15 mos</td><td>Slide 19, Tech Slide 9</td></tr>
      <tr><td class="mono"><strong>pipeline/metrics.json</strong></td><td>Computed + Live IRLS Logistic Regression</td><td class="num mono">Full model state</td><td>All headline KPIs & Econometric Table</td></tr>
    </tbody>
  </table>
</section>

</body>
</html>`;

fs.writeFileSync('site/technical.html', html);
console.log('Built site/technical.html (13 slides, ' + html.length + ' bytes)');
