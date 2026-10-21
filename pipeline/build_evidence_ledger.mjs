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

let md = `# WHITEFOX Real Estate — Master Raw Evidence Ledger (Empirical GEO / AEO Audit)

- **Target Entity:** WHITEFOX Real Estate (\`https://www.whitefoxrealestate.com.au/\`)
- **Primary Category:** \`${CFG.vertical || CFG.primaryCategory}\` (Prestige & Luxury Residential Sales, Off-Market Prestige Transactions, Buyer's Advocacy, Boutique Property Management)
- **Generated At:** \`${metrics.generatedAt}\`
- **Empirical Study Architecture:**
  - **280 Live AI Responses** across **8 Australian Prestige Property Markets** (\`Melbourne\`, \`Sydney\`, \`Brisbane\`, \`Gold Coast\`, \`Perth\`, \`Adelaide\`, \`Mornington Peninsula\`, \`National Australia\`) $\\times$ **7 Buyer-Intent Prompt Archetypes** $\\times$ **5 AI Engines** (\`ChatGPT\`, \`Perplexity\`, \`Google AI Mode\`, \`Google Gemini 2.5 Flash\`, \`Anthropic Claude Sonnet 4.6\`).
  - **56 Live Google Organic SERPs** (\`depth=20\`) paired 1:1 with the 56 city $\\times$ prompt cells.
  - **8 Live Google Maps 20-Packs** + **14 Individual WHITEFOX Branch Google Business Profile (GBP) Audits** with verified Google CIDs.
  - **Firecrawl Technical & JSON-LD Schema Crawl** across \`https://www.whitefoxrealestate.com.au/\` (200 mapped URLs, 21 deep-scraped pages including all 16 Australian \`/office/*\` branch pages).
  - **15-Month Historical LLM Mentions Curve (\`Aug 2025 – Oct 2026\`)** via DataForSEO \`/v3/ai_optimization/llm_mentions/historical/live\`.
  - **12-Month AI Keyword Demand Series (\`Oct 2025 – Sep 2026\`)** via DataForSEO \`/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live\`.

---

## 1. Executive Headline Metrics

| Metric | Value | Notes |
|---|---|---|
| **Total AI Answers Audited ($N$)** | \`${metrics.totalAnswers}\` | 8 markets $\\times$ 7 prompt categories $\\times$ 5 AI engines |
| **WHITEFOX AI Mention Rate** | **\`${metrics.wfMentioned} / ${metrics.totalAnswers}\` (\`${metrics.wfRatePct}%\`)** | Mentioned in ${metrics.wfMentioned} of ${metrics.totalAnswers} responses |
| **WHITEFOX Top-3 Shortlist Rate** | **\`${metrics.wfTop3} / ${metrics.totalAnswers}\` (\`${metrics.wfTop3Pct}%\`)** | Ranked #1, #2, or #3 in ${metrics.wfTop3} responses |
| **WHITEFOX #1 Primary Recommendation** | **\`${metrics.wfNum1} / ${metrics.totalAnswers}\` (\`${metrics.wfNum1Pct}%\`)** | First-named agency in ${metrics.wfNum1} responses |
| **WHITEFOX Direct Domain Citation Rate** | **\`${metrics.wfCited} / ${metrics.totalAnswers}\` (\`${metrics.wfCitedPct}%\`)** | \`whitefoxrealestate.com.au\` cited in ${metrics.wfCited} responses (\`${citations.clientDomainCitations}\` total links out of \`${citations.totalCitations}\`) |
| **Google Organic Top-10 SERP Presence** | **\`${metrics.serpTop10Count} / ${metrics.totalSerps}\` (\`${((metrics.serpTop10Count / metrics.totalSerps) * 100).toFixed(1)}%\`)** | Top-20 presence: \`${metrics.serpTop20Count} / ${metrics.totalSerps}\` |

---

## 2. Platform Breakdown (5 AI Engines)

| AI Engine | Model / Endpoint | Answers | WHITEFOX Mentions | Share of Voice (%) | Top-3 Shortlist | #1 Rank | Direct Citations | Avg Chars | Avg Citations |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
`;

for (const [plat, d] of Object.entries(metrics.byPlat)) {
  md += `| **${plat.toUpperCase()}** | Live API | ${d.total} | ${d.mentioned} | **${d.ratePct}%** | ${d.top3} (${d.top3Pct}%) | ${d.num1} | ${d.cited} | ${d.avgChars} | ${d.avgCitations} |\n`;
}

md += `\n---\n\n## 3. Geographic Breakdown (8 Australian Luxury Property Markets)\n\n| Market | State | Answers | WHITEFOX Mentions | Share (%) | Top-3 | #1 | Organic Top-10 (/7) | GBP Branches | GBP Reviews | Top Local AI Leader |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n`;

for (const [cid, d] of Object.entries(metrics.byCity)) {
  const leader = d.topFirms?.[0] ? `${d.topFirms[0].name} (${d.topFirms[0].count}/35, ${d.topFirms[0].pct}%)` : 'None';
  md += `| **${d.name}** | ${d.state} | ${d.total} | ${d.mentioned} | **${d.ratePct}%** | ${d.top3} | ${d.num1} | ${d.serpTop10}/7 | ${d.gbp?.branchCount || 0} | ${d.gbp?.totalReviews || 0} | ${leader} |\n`;
}

md += `\n---\n\n## 4. Buyer-Intent Prompt Category Breakdown (7 Archetypes)\n\n| Prompt ID | Category | Answers | WHITEFOX Mentions | Share (%) | Top-3 | #1 | Category AI Leader |\n|---|---|---:|---:|---:|---:|---:|---|\n`;

for (const [pid, d] of Object.entries(metrics.byCat)) {
  const leader = d.topFirms?.[0] ? `${d.topFirms[0].name} (${d.topFirms[0].count}/40, ${d.topFirms[0].pct}%)` : 'None';
  md += `| \`${pid}\` | **${d.category}** | ${d.total} | ${d.mentioned} | **${d.ratePct}%** | ${d.top3} | ${d.num1} | ${leader} |\n`;
}

md += `\n---\n\n## 5. National Luxury Real Estate AI Leaderboard (Top 20 Entities Across 280 Answers)\n\n| Rank | Agency / Entity | Total Mentions (/280) | Share of Voice (%) | Top-3 Shortlists | #1 Ranks | ChatGPT | Perplexity | AI Mode | Gemini | Claude |\n|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n`;

metrics.leaderboard.slice(0, 20).forEach((f, idx) => {
  md += `| ${idx + 1} | **${f.name}** | ${f.mentions} | **${f.sharePct}%** | ${f.top3} (${f.top3Pct}%) | ${f.num1} | ${f.byPlat.chatgpt || 0} | ${f.byPlat.perplexity || 0} | ${f.byPlat.aimode || 0} | ${f.byPlat.gemini || 0} | ${f.byPlat.claude || 0} |\n`;
});

md += `\n---\n\n## 6. Live IRLS Logistic Regression Results ($N = ${metrics.irls.n}$, Positive Mentions = ${metrics.irls.positives})\n\n| Predictor | Coefficient ($\\hat{\\beta}$) | Std. Error (SE) | Wald $z$ | Odds Ratio (OR) | 95% CI | $p$-Value |\n|---|---:|---:|---:|---:|---|---:|\n`;

for (const c of metrics.irls.coefficients) {
  md += `| **${c.name}** | \`${c.beta >= 0 ? '+' : ''}${c.beta.toFixed(2)}\` | \`${c.se.toFixed(2)}\` | \`${c.z.toFixed(2)}\` | \`${c.or ? c.or + 'x' : '—'}\` | \`${c.ci95 ? '[' + c.ci95[0] + 'x, ' + c.ci95[1] + 'x]' : '—'}\` | \`${c.pValue}\` |\n`;
}

md += `\n---\n\n## 7. Critical Technical & Schema Forensics (\`site_audit.json\`)\n\n1. **\`Organization.sameAs\` Schema Contamination (Smoking Gun):**\n   - On every audited page of \`https://www.whitefoxrealestate.com.au/\`, the \`Organization\` JSON-LD block (\`@id: "https://whitefoxrealestate.com.au#organization"\`) declares:\n     \`\`\`json\n     {\n       "@type": "Organization",\n       "@id": "https://whitefoxrealestate.com.au#organization",\n       "name": "WHITEFOX ",\n       "url": "https://whitefoxrealestate.com.au",\n       "sameAs": [\n         "https://www.facebook.com/MarshallWhiteRE/",\n         "https://twitter.com/marshallwhitere"\n       ]\n     }\n     \`\`\`\n   - This WordPress Yoast SEO template copy-paste artifact explicitly instructs Google's Knowledge Graph and LLM entity resolvers that WHITEFOX Real Estate is \`sameAs\` arch-rival **Marshall White** (\`MarshallWhiteRE\`).\n2. **Zero \`RealEstateAgent\` / \`LocalBusiness\` Schema Across All 16 Australian Office Pages:**\n   - Every \`/office/*\` page emits only generic \`WebPage\`, \`BreadcrumbList\`, \`WebSite\`, and the contaminated \`Organization\` schema—zero \`RealEstateAgent\`, zero \`PostalAddress\`, zero \`GeoCoordinates\`, zero \`AggregateRating\`.\n3. **Broken Core Brand URL (\`/about\` Returns HTTP 404):**\n   - \`https://www.whitefoxrealestate.com.au/about\` returns \`HTTP 404 Page not found\`.\n\n---\n\n## 8. 14-Branch Google Business Profile (GBP) Telemetry (\`maps_audit.json\`)\n\n| Branch Label | Market | GBP Title | Rating | Reviews | Address | Phone | Google CID |\n|---|---|---|---:|---:|---|---|---|\n`;

for (const b of (mapsAudit.whitefoxBranches || [])) {
  md += `| **${b.label || b.title}** | \`${b.city || b.market}\` | ${b.title || '—'} | ${b.rating !== null ? b.rating + '★' : 'Unrated'} | ${b.reviews || 0} | ${b.address || '—'} | ${b.phone || '—'} | \`${b.cid || '—'}\` |\n`;
}

md += `\n---\n\n## 9. 15-Month Historical AI Mentions (\`hist.json\` — Aug 2025 to Oct 2026)\n\n| Domain | ${histMonths.join(' | ')} |\n|---|${histMonths.map(() => '---:').join('|')}|\n`;

for (const [dom, d] of Object.entries(histDomains)) {
  md += `| \`${dom}\` | ${d.mentions.join(' | ')} |\n`;
}

md += `\n---\n\n## 10. Complete 280-Answer Empirical Audit Log (\`ans_full.json\`)\n\n| # | Market | Prompt ID | Engine | WHITEFOX Mentioned | Rank | Cited | Entities Extracted | Snippet |\n|---:|---|---|---|---|---:|---|---|---|\n`;

ansFull.forEach((a, i) => {
  const ents = a.mentions.slice(0, 5).join(', ') || 'None';
  const snip = (a.snippet || '').slice(0, 140).replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  md += `| ${i + 1} | ${a.cityName} | \`${a.pk}\` | \`${a.plat}\` | ${a.wfMentioned ? '**YES**' : 'No'} | ${a.wfRank || '—'} | ${a.wfCited ? 'YES' : 'No'} | ${ents} | ${snip}... |\n`;
});

fs.writeFileSync('WHITEFOX_REAL_ESTATE_RAW_EVIDENCE_LEDGER.md', md);
console.log('Wrote WHITEFOX_REAL_ESTATE_RAW_EVIDENCE_LEDGER.md (' + md.length + ' bytes)');
