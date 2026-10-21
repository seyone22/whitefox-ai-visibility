import fs from 'fs';
import path from 'path';
import { runIrlsLogisticRegression } from 'file:///C:/Users/SGSey/.gemini/config/skills/geo-ai-visibility-audit/scripts/04_compute_metrics_and_irls.mjs';

const CFG = JSON.parse(fs.readFileSync('client.config.json', 'utf8'));
const rawDir = path.resolve('pipeline/raw');
const mapsAudit = JSON.parse(fs.readFileSync('pipeline/maps_audit.json', 'utf8'));

// Comprehensive canonical dictionary of Australian luxury/prestige real estate agencies & buyer's advocates
export const KNOWN_FIRMS = [
  ['WHITEFOX Real Estate', /\bwhite\s*fox(?:\s+real\s+estate|\s+prestige|\s+advisory|\s+advocacy)?\b|whitefoxrealestate\.com\.au/i, 'whitefoxrealestate.com.au'],
  ['Marshall White', /\bmarshall\s+white\b|marshallwhite\.com\.au/i, 'marshallwhite.com.au'],
  ['Kay & Burton', /\bkay\s*(?:&|and)\s*burton\b|kayburton\.com\.au/i, 'kayburton.com.au'],
  ['Jellis Craig', /\bjellis\s+craig\b|jelliscraig\.com\.au/i, 'jelliscraig.com.au'],
  ['Abercromby\'s', /\babercromby'?s\b|abercrombys\.com\.au/i, 'abercrombys.com.au'],
  ['RT Edgar', /\brt\s+edgar\b|\br\.t\.\s*edgar\b|rtedgar\.com\.au/i, 'rtedgar.com.au'],
  ['Belle Property', /\bbelle\s+property\b|\bacton\s*\|\s*belle\s+property\b|belleproperty\.com/i, 'belleproperty.com'],
  ['Ray White', /\bray\s+white(?:\s+double\s+bay|\s+prestige|\s+lower\s+north\s+shore|\s+paddington|\s+new\s+farm|\s+cottesloe|\s+dalkeith|\s+toorak|\s+south\s+yarra)?\b|raywhite\.com|rwdb\.com/i, 'raywhite.com'],
  ['The Agency', /\bthe\s+agency(?:\s+real\s+estate|\s+property|\s+prestige)?\b|theagency\.com\.au/i, 'theagency.com.au'],
  ['McGrath Estate Agents', /\bmcgrath(?:\s+estate\s+agents|\s+real\s+estate|\s+prestige)?\b|mcgrath\.com\.au/i, 'mcgrath.com.au'],
  ['Sotheby\'s International Realty', /\bsotheby'?s(?:\s+international\s+realty)?\b|sothebysrealty\.com\.au/i, 'sothebysrealty.com.au'],
  ['Christie\'s International Real Estate', /\bchristie'?s\s+international\s+real\s+estate\b|christiesrealestate\.com/i, 'christiesrealestate.com'],
  ['BresicWhitney', /\bbresic\s*whitney\b|bresicwhitney\.com\.au/i, 'bresicwhitney.com.au'],
  ['PPD Real Estate', /\bppd\s+real\s+estate\b|ppdre\.com\.au/i, 'ppdre.com.au'],
  ['Raine & Horne Double Bay', /\braine\s*(?:&|and)\s*horne(?:\s+double\s+bay|\s+unlimited|\s+sorrento)?\b|raineandhorne\.com\.au/i, 'raineandhorne.com.au'],
  ['Atlas by LJ Hooker', /\batlas\s+by\s+lj\s+hooker\b|\batlas\s+lower\s+north\s+shore\b|\batlas\s+eastern\s+suburbs\b|atlas\.com\.au/i, 'atlas.com.au'],
  ['Laing+Simmons', /\blaing\s*(?:\+|and|&)\s*simmons\b|lsre\.com\.au/i, 'lsre.com.au'],
  ['CobdenHayson', /\bcobden\s*hayson\b|ch\.com\.au/i, 'ch.com.au'],
  ['Place Estate Agents', /\bplace\s+estate\s+agents\b|\bplace\s+new\s+farm\b|\bplace\s+bulimba\b|\bplace\s+ascot\b|\bplace\s+kangaroo\s+point\b|eplace\.com\.au/i, 'eplace.com.au'],
  ['Kollosche', /\bkollosche\b|kollosche\.com\.au/i, 'kollosche.com.au'],
  ['Amir Prestige', /\bamir\s+prestige\b|amirprestige\.com\.au/i, 'amirprestige.com.au'],
  ['Lucy Cole Prestige', /\blucy\s+cole(?:\s+prestige)?\b|lucycole\.com\.au/i, 'lucycole.com.au'],
  ['William Porteous Properties', /\bwilliam\s+porteous\b|porteous\.com\.au/i, 'porteous.com.au'],
  ['Mack Hall Real Estate', /\bmack\s+hall\b|mackhall\.com\.au/i, 'mackhall.com.au'],
  ['Space Real Estate', /\bspace\s+real\s+estate\b|spacerealesate\.com\.au|spacerealestate\.com\.au/i, 'spacerealestate.com.au'],
  ['Zorzi / Mont Property', /\bmont\s+property\b|montproperty\.com\.au/i, 'montproperty.com.au'],
  ['Dempsey Real Estate', /\bdempsey\s+real\s+estate\b/i, 'dempseyrealestate.com.au'],
  ['Grove', /\bgrove\s+real\s+estate\b/i, 'groverealestate.com.au'],
  ['Toop&Toop', /\btoop\s*(?:&|and|\+)?\s*toop\b|toop\.com\.au/i, 'toop.com.au'],
  ['Williams Real Estate', /\bwilliams\s+real\s+estate\b|\bwilliams\s+luxury\b|williamsrealestate\.com\.au/i, 'williamsrealestate.com.au'],
  ['Ouwens Casserly', /\bouwens\s+casserly\b|\boc\s+real\s+estate\b|ocre\.com\.au/i, 'ocre.com.au'],
  ['Harris Real Estate', /\bharris\s+real\s+estate\b|harrisre\.com\.au/i, 'harrisre.com.au'],
  ['Klemich Real Estate', /\bklemich\b|klemich\.com\.au/i, 'klemich.com.au'],
  ['Fox Real Estate', /\bfox\s+real\s+estate\b|foxrealestate\.com\.au/i, 'foxrealestate.com.au'],
  ['Giordano & Partners', /\bgiordano\s*(?:&|and)\s*partners\b|giordanopartners\.com\.au/i, 'giordanopartners.com.au'],
  ['Booth & Booth', /\bbooth\s*(?:&|and)\s*booth\b/i, 'boothrealty.com.au'],
  ['Woodards', /\bwoodards\b|woodards\.com\.au/i, 'woodards.com.au'],
  ['Nelson Alexander', /\bnelson\s+alexander\b|nelsonalexander\.com\.au/i, 'nelsonalexander.com.au'],
  ['Buxton Real Estate', /\bbuxton(?:\s+real\s+estate|\s+bayside|\s+port\s+phillip|\s+mornington|\s+sorrento)?\b|buxton\.com\.au/i, 'buxton.com.au'],
  ['Hodges Real Estate', /\bhodges(?:\s+real\s+estate|\s+brighton|\s+sandringham)?\b|hodges\.com\.au/i, 'hodges.com.au'],
  ['Fletchers Real Estate', /\bfletchers(?:\s+real\s+estate|\s+sorrento|\s+queenscliff)?\b|fletchers\.net\.au/i, 'fletchers.net.au'],
  ['Nick Johnstone Real Estate', /\bnick\s+johnstone\b|nickjohnstone\.com\.au/i, 'nickjohnstone.com.au'],
  ['Castran Gilbert', /\bcastran(?:\s+gilbert)?\b|castrangilbert\.com\.au/i, 'castrangilbert.com.au'],
  ['Forbes Global Properties', /\bforbes\s+global\s+properties\b|forbesglobalproperties\.com/i, 'forbesglobalproperties.com'],
  ['Peninsula Sotheby\'s', /\bpeninsula\s+sotheby'?s\b/i, 'sothebysrealty.com.au'],
  ['Aqua Real Estate', /\baqua\s+real\s+estate\b|aquarealestate\.com\.au/i, 'aquarealestate.com.au'],
  ['Danckert Real Estate', /\bdanckert\b|danckert\.com\.au/i, 'danckert.com.au'],
  ['Coastyle Real Estate', /\bcoastyle\b/i, 'coastyle.com.au'],
  ['Whitford Property', /\bwhitford(?:\s+property)?\b|whitfordproperty\.com\.au/i, 'whitfordproperty.com.au'],
  ['McCartney Real Estate', /\bmccartney\s+real\s+estate\b|mccartneyrealestate\.com\.au/i, 'mccartneyrealestate.com.au'],
  ['Great Ocean Road Real Estate', /\bgreat\s+ocean\s+road\s+real\s+estate\b/i, 'greatoceanroadrealestate.com.au'],
  ['Links Property', /\blinks\s+property\b|linksproperty\.com\.au/i, 'linksproperty.com.au'],
  ['Gartland', /\bgartland\b|gartland\.com\.au/i, 'gartland.com.au'],
  ['Harcourts', /\bharcourts(?:\s+coastal|\s+property\s+hub|\s+packham|\s+empire|\s+solutions)?\b|harcourts\.net/i, 'harcourts.net'],
  ['LJ Hooker', /\blj\s+hooker\b|ljhooker\.com\.au/i, 'ljhooker.com.au'],
  ['Barry Plant', /\bbarry\s+plant\b|barryplant\.com\.au/i, 'barryplant.com.au'],
  ['BigginScott', /\bbiggin\s*(?:&|and)?\s*scott\b|bigginscott\.com\.au/i, 'bigginscott.com.au'],
  ['Gary Peer', /\bgary\s+peer\b|garypeer\.com\.au/i, 'garypeer.com.au'],
  ['hockingstuart', /\bhocking\s*stuart\b|hockingstuart\.com\.au/i, 'hockingstuart.com.au'],
  ['Greg Hocking', /\bgreg\s+hocking\b|greghocking\.com\.au/i, 'greghocking.com.au'],
  ['Chisholm & Gamon', /\bchisholm\s*(?:&|and)\s*gamon\b|chisholmgamon\.com\.au/i, 'chisholmgamon.com.au'],
  ['Cayzer Real Estate', /\bcayzer\b|cayzer\.com\.au/i, 'cayzer.com.au'],
  // Buyer's Advocates & Advisory
  ['Morrell & Koren', /\bmorrell\s*(?:&|and)\s*koren\b|morrellandkoren\.com/i, 'morrellandkoren.com'],
  ['Cohen Handler', /\bcohen\s+handler\b|cohenhandler\.com\.au/i, 'cohenhandler.com.au'],
  ['Wakelin Property Advisory', /\bwakelin\b|wakelin\.com\.au/i, 'wakelin.com.au'],
  ['Mal James / James Buy Sell', /\bmal\s+james\b|\bjames\s+buyer\s+advocates\b|james\.net\.au/i, 'james.net.au'],
  ['PK Property', /\bpk\s+property\b|pkproperty\.com\.au/i, 'pkproperty.com.au'],
  ['Propertybuyer', /\bpropertybuyer\b|propertybuyer\.com\.au/i, 'propertybuyer.com.au'],
  ['Empower Wealth', /\bempower\s+wealth\b|empowerwealth\.com\.au/i, 'empowerwealth.com.au'],
  ['Metropole Property Strategists', /\bmetropole(?:\s+property)?\b|metropole\.com\.au/i, 'metropole.com.au'],
  ['Cate Bakos Property', /\bcate\s+bakos\b|catebakos\.com\.au/i, 'catebakos.com.au'],
  ['Vendor Advocacy Australia', /\bvendor\s+advocacy\s+australia\b/i, 'vendoradvocacy.com.au'],
  ['Universal Buyers Agents', /\buniversal\s+buyers\s+agents\b|universalbuyersagents\.com\.au/i, 'universalbuyersagents.com.au'],
  ['Streamline Property Buyers', /\bstreamline\s+property\s+buyers\b|streamlineproperty\.com\.au/i, 'streamlineproperty.com.au'],
  ['Property Wizards', /\bproperty\s+wizards\b|propertywizards\.com\.au/i, 'propertywizards.com.au'],
  ['Momentum Wealth', /\bmomentum\s+wealth\b|momentumwealth\.com\.au/i, 'momentumwealth.com.au'],
  ['Resolve Property Solutions', /\bresolve\s+property\s+solutions\b|resolvepropertysolutions\.com\.au/i, 'resolvepropertysolutions.com.au']
];

function cleanDomain(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./i, '').toLowerCase();
  } catch (_) {
    return '';
  }
}

function classifySourceType(domain) {
  if (!domain) return 'Other';
  if (domain === 'whitefoxrealestate.com.au') return 'Client Owned';
  if (/(realestate\.com\.au|domain\.com\.au|homely\.com\.au|allhomes\.com\.au|reiwa\.com\.au|view\.com\.au)/i.test(domain)) return 'Property Portal';
  if (/(ratemyagent\.com\.au|openagent\.com\.au|localagentfinder\.com\.au|whichrealestateagent\.com\.au|agentselect\.com\.au|trustpilot\.com|productreview\.com\.au|birdeye\.com|threebestrated\.com\.au)/i.test(domain)) return 'Agent Review / Comparison';
  if (/(afr\.com|theage\.com\.au|smh\.com\.au|heraldsun\.com\.au|theaustralian\.com\.au|urbanlist\.com|broadsheet\.com\.au|luxurylist\.com\.au|architecturaldigest\.com|vogue\.com\.au|forbes\.com|eliteagent\.com|realestatesource\.com\.au|mansionglobal\.com)/i.test(domain)) return 'Editorial / Media';
  if (/(reiv\.com\.au|reinsw\.com\.au|reiq\.com|reisa\.com\.au|reb\.com\.au)/i.test(domain)) return 'Industry Body';
  if (/(reddit\.com|whirlpool\.net\.au|propertychat\.com\.au|youtube\.com|instagram\.com|facebook\.com|linkedin\.com|tiktok\.com)/i.test(domain)) return 'Social / Forum';
  for (const [, , compDom] of KNOWN_FIRMS) {
    if (compDom && domain.includes(compDom)) return 'Competitor Agency';
  }
  return 'Agency / Directory';
}

function parsePlatformResponse(plat, rawObj) {
  let text = '';
  const citations = [];
  const addCit = (url, title) => {
    if (!url || !/^https?:\/\//i.test(url)) return;
    const domain = cleanDomain(url);
    if (!domain || domain.includes('vertexaisearch.cloud.google.com')) return;
    if (!citations.some(c => c.url === url)) {
      citations.push({ url, domain, title: title || domain, type: classifySourceType(domain) });
    }
  };

  const res = rawObj.result;
  if (!res) return { text, citations };

  if (plat === 'chatgpt') {
    const item = Array.isArray(res) ? res[0] : res;
    text = item?.markdown || '';
    if (!text && Array.isArray(item?.items)) {
      text = item.items.map(x => x.markdown || x.text || '').join('\n');
    }
    for (const s of (item?.sources || [])) addCit(s.url, s.title || s.source_name);
    for (const s of (item?.search_results || [])) addCit(s.url, s.title || s.domain);
  } else if (plat === 'perplexity') {
    const item = Array.isArray(res) ? res[0] : res;
    for (const it of (item?.items || [])) {
      for (const sec of (it?.sections || [])) {
        if (sec.text) text += sec.text + '\n';
        for (const a of (sec.annotations || [])) addCit(a.url, a.title);
      }
    }
  } else if (plat === 'aimode') {
    const item = Array.isArray(res) ? res[0] : res;
    for (const it of (item?.items || [])) {
      if (it.markdown) text += it.markdown + '\n';
      for (const sub of (it.items || [])) {
        if (sub.markdown) text += sub.markdown + '\n';
        for (const r of (sub.references || [])) addCit(r.url, r.title || r.source);
      }
      for (const r of (it.references || [])) addCit(r.url, r.title || r.source);
    }
  } else if (plat === 'gemini') {
    const cand = res.candidates?.[0];
    for (const part of (cand?.content?.parts || [])) {
      if (part.text) text += part.text + '\n';
    }
    const chunks = cand?.groundingMetadata?.groundingChunks || [];
    for (const ch of chunks) {
      if (ch.web?.uri) {
        const title = ch.web.title || '';
        // Gemini grounding chunk title is often the real domain (e.g. "marshallwhite.com.au")
        const domFromTitle = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(title.trim()) ? title.trim().replace(/^www\./i, '').toLowerCase() : '';
        if (domFromTitle) {
          citations.push({
            url: `https://${domFromTitle}`,
            domain: domFromTitle,
            title: title,
            type: classifySourceType(domFromTitle)
          });
        } else {
          addCit(ch.web.uri, title);
        }
      }
    }
  } else if (plat === 'claude') {
    // Handles both Anthropic direct (res.content) and DataForSEO Claude live (res[0].items)
    if (Array.isArray(res.content)) {
      for (const block of res.content) {
        if (block.type === 'text' && block.text) {
          text += block.text + '\n';
          for (const cit of (block.citations || [])) {
            addCit(cit.url, cit.title);
          }
        } else if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
          for (const sr of block.content) {
            addCit(sr.url, sr.title);
          }
        }
      }
    } else {
      const item = Array.isArray(res) ? res[0] : res;
      for (const it of (item?.items || [])) {
        for (const sec of (it?.sections || [])) {
          if (sec.text) text += sec.text + '\n';
          for (const a of (sec.annotations || [])) addCit(a.url, a.title);
        }
      }
    }
  }

  return { text: text.trim(), citations };
}

function extractMentions(text, citations) {
  const hay = (text + ' ' + citations.map(c => c.url + ' ' + c.title).join(' '));
  const found = [];
  for (const [name, rx] of KNOWN_FIRMS) {
    const m = rx.exec(hay);
    if (m) {
      found.push({ name, pos: m.index });
    }
  }
  found.sort((a, b) => a.pos - b.pos);
  return found.map((f, idx) => ({ name: f.name, rank: idx + 1, pos: f.pos }));
}

// 1. Parse all 56 SERPs first so we know organic rankings per (city, prompt)
const serpAudit = [];
const serpLookup = new Map();

for (const city of CFG.cities) {
  for (const prompt of CFG.prompts) {
    const serpFile = path.join(rawDir, `${city.id}__${prompt.id}__serp.json`);
    if (!fs.existsSync(serpFile)) continue;
    const raw = JSON.parse(fs.readFileSync(serpFile, 'utf8'));
    const items = raw.result?.[0]?.items || [];
    const organic = items.filter(x => x.type === 'organic').map((x, idx) => ({
      rank: idx + 1,
      rank_absolute: x.rank_absolute,
      domain: cleanDomain(x.url),
      url: x.url,
      title: x.title
    }));
    const wfHit = organic.find(o => o.domain === 'whitefoxrealestate.com.au');
    const row = {
      city: city.id,
      cityName: city.name,
      pk: prompt.id,
      cat: prompt.category || prompt.title,
      keyword: raw.text,
      wfRank: wfHit ? wfHit.rank : null,
      wfUrl: wfHit ? wfHit.url : null,
      wfInTop10: Boolean(wfHit && wfHit.rank <= 10),
      wfInTop20: Boolean(wfHit && wfHit.rank <= 20),
      top10: organic.slice(0, 10),
      top20: organic.slice(0, 20)
    };
    serpAudit.push(row);
    serpLookup.set(`${city.id}__${prompt.id}`, row);
  }
}

// 2. Map GBP attributes per city from maps_audit.json
const cityGbpMap = new Map();
const cityAlias = { goldcoast: ['goldcoast', 'gold_coast'], peninsula: ['peninsula', 'mornington_peninsula'], national: ['national', 'melbourne'] };
for (const city of CFG.cities) {
  const aliases = cityAlias[city.id] || [city.id];
  const wfBranches = (mapsAudit.whitefoxBranches || []).filter(b => aliases.includes(b.market || b.city));
  const bestReviews = wfBranches.reduce((acc, b) => acc + (b.reviews || 0), 0);
  const ratedBranches = wfBranches.filter(b => typeof b.rating === 'number');
  const maxRating = ratedBranches.length ? Math.max(...ratedBranches.map(b => b.rating)) : 0;
  const minRating = ratedBranches.length ? Math.min(...ratedBranches.map(b => b.rating)) : 0;
  const pack20 = mapsAudit[city.id]?.topCompetitors || [];
  const wfInPack = pack20.find(p => /white\s*fox/i.test(p.title || '') || (p.domain && p.domain.includes('whitefox')));
  cityGbpMap.set(city.id, {
    branchCount: wfBranches.length,
    totalReviews: bestReviews,
    maxRating,
    minRating,
    hasRatedGbp43Plus: maxRating >= 4.3 && bestReviews >= 10,
    inMapsPack20: Boolean(wfInPack),
    mapsPackRank: wfInPack ? wfInPack.rank : null
  });
}

// 3. Parse all 280 AI answers
const ansFull = [];
const citationDomainCounts = new Map();
const citationUrlCounts = new Map();
const citationTypeCounts = new Map();
let totalCitations = 0;

const AI_PLATFORMS = ['chatgpt', 'perplexity', 'aimode', 'gemini', 'claude'];

for (const city of CFG.cities) {
  for (const prompt of CFG.prompts) {
    const serpRow = serpLookup.get(`${city.id}__${prompt.id}`);
    const gbpInfo = cityGbpMap.get(city.id) || {};
    for (const plat of AI_PLATFORMS) {
      const f = path.join(rawDir, `${city.id}__${prompt.id}__${plat}.json`);
      if (!fs.existsSync(f)) continue;
      const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
      const { text, citations } = parsePlatformResponse(plat, raw);
      const mentions = extractMentions(text, citations);
      const wfMention = mentions.find(m => m.name === 'WHITEFOX Real Estate');
      const wfCited = citations.some(c => c.domain === 'whitefoxrealestate.com.au');

      for (const c of citations) {
        totalCitations++;
        citationDomainCounts.set(c.domain, (citationDomainCounts.get(c.domain) || 0) + 1);
        citationUrlCounts.set(c.url, (citationUrlCounts.get(c.url) || 0) + 1);
        citationTypeCounts.set(c.type, (citationTypeCounts.get(c.type) || 0) + 1);
      }

      // Check third-party listicle/portal co-occurrence in citations
      const hasReviewOrPortalCitation = citations.some(c => c.type === 'Property Portal' || c.type === 'Agent Review / Comparison' || c.type === 'Editorial / Media');

      ansFull.push({
        city: city.id,
        cityName: city.name,
        pk: prompt.id,
        cat: prompt.category || prompt.title,
        plat,
        prompt: raw.text,
        at: raw.at,
        cost: raw.cost || 0,
        chars: text.length,
        snippet: text.slice(0, 420).replace(/\s+/g, ' ').trim(),
        text: text,
        fullText: text,
        wfMentioned: Boolean(wfMention),
        wfRank: wfMention ? wfMention.rank : null,
        wfTop3: Boolean(wfMention && wfMention.rank <= 3),
        wfNumber1: Boolean(wfMention && wfMention.rank === 1),
        wfCited,
        mentions: mentions.map(m => m.name),
        mentionRanks: mentions,
        citations,
        citationCount: citations.length,
        // Predictors for live IRLS logistic regression
        inOrganicTop10: Boolean(serpRow?.wfInTop10),
        inOrganicTop20: Boolean(serpRow?.wfInTop20),
        hasThirdPartyCitation: hasReviewOrPortalCitation,
        hasStrongGbpCity: Boolean(gbpInfo.hasRatedGbp43Plus),
        inMapsPack20: Boolean(gbpInfo.inMapsPack20)
      });
    }
  }
}

fs.writeFileSync('pipeline/serp_audit.json', JSON.stringify(serpAudit, null, 2));
fs.writeFileSync('pipeline/ans_full.json', JSON.stringify(ansFull, null, 2));

// 4. Build citations.json
const topDomains = [...citationDomainCounts.entries()]
  .map(([domain, count]) => ({ domain, count, sharePct: +((count / Math.max(1, totalCitations)) * 100).toFixed(2), type: classifySourceType(domain) }))
  .sort((a, b) => b.count - a.count);

const topUrls = [...citationUrlCounts.entries()]
  .map(([url, count]) => ({ url, domain: cleanDomain(url), count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 50);

const byType = [...citationTypeCounts.entries()]
  .map(([type, count]) => ({ type, count, sharePct: +((count / Math.max(1, totalCitations)) * 100).toFixed(1) }))
  .sort((a, b) => b.count - a.count);

const citationsSummary = {
  totalCitations,
  uniqueDomains: citationDomainCounts.size,
  uniqueUrls: citationUrlCounts.size,
  clientDomainCitations: citationDomainCounts.get('whitefoxrealestate.com.au') || 0,
  byType,
  topDomains: topDomains.slice(0, 30),
  topUrls
};
fs.writeFileSync('pipeline/citations.json', JSON.stringify(citationsSummary, null, 2));

// 5. Compute aggregates + Live IRLS Logistic Regression for metrics.json
const N = ansFull.length;
const wfTotal = ansFull.filter(a => a.wfMentioned).length;
const wfTop3Total = ansFull.filter(a => a.wfTop3).length;
const wfNum1Total = ansFull.filter(a => a.wfNumber1).length;
const wfCitedTotal = ansFull.filter(a => a.wfCited).length;

const byPlat = {};
for (const p of AI_PLATFORMS) {
  const sub = ansFull.filter(a => a.plat === p);
  const m = sub.filter(a => a.wfMentioned).length;
  const t3 = sub.filter(a => a.wfTop3).length;
  const n1 = sub.filter(a => a.wfNumber1).length;
  const cit = sub.filter(a => a.wfCited).length;
  byPlat[p] = {
    total: sub.length,
    mentioned: m,
    ratePct: +((m / Math.max(1, sub.length)) * 100).toFixed(1),
    top3: t3,
    top3Pct: +((t3 / Math.max(1, sub.length)) * 100).toFixed(1),
    num1: n1,
    cited: cit,
    avgChars: Math.round(sub.reduce((s, a) => s + a.chars, 0) / Math.max(1, sub.length)),
    avgCitations: +(sub.reduce((s, a) => s + a.citationCount, 0) / Math.max(1, sub.length)).toFixed(1)
  };
}

const byCity = {};
for (const c of CFG.cities) {
  const sub = ansFull.filter(a => a.city === c.id);
  const m = sub.filter(a => a.wfMentioned).length;
  const t3 = sub.filter(a => a.wfTop3).length;
  const n1 = sub.filter(a => a.wfNumber1).length;
  const serpSub = serpAudit.filter(s => s.city === c.id);
  const serpTop10 = serpSub.filter(s => s.wfInTop10).length;
  // Competitor leaderboard in this city
  const compCounts = {};
  for (const a of sub) {
    for (const firm of a.mentions) {
      compCounts[firm] = (compCounts[firm] || 0) + 1;
    }
  }
  const topFirms = Object.entries(compCounts)
    .map(([name, count]) => ({ name, count, pct: +((count / Math.max(1, sub.length)) * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  byCity[c.id] = {
    name: c.name,
    state: c.state,
    total: sub.length,
    mentioned: m,
    ratePct: +((m / Math.max(1, sub.length)) * 100).toFixed(1),
    top3: t3,
    top3Pct: +((t3 / Math.max(1, sub.length)) * 100).toFixed(1),
    num1: n1,
    serpTop10,
    serpTotal: serpSub.length,
    gbp: cityGbpMap.get(c.id),
    topFirms: topFirms.slice(0, 8)
  };
}

const byCat = {};
for (const p of CFG.prompts) {
  const sub = ansFull.filter(a => a.pk === p.id);
  const m = sub.filter(a => a.wfMentioned).length;
  const t3 = sub.filter(a => a.wfTop3).length;
  const n1 = sub.filter(a => a.wfNumber1).length;
  const compCounts = {};
  for (const a of sub) {
    for (const firm of a.mentions) {
      compCounts[firm] = (compCounts[firm] || 0) + 1;
    }
  }
  const topFirms = Object.entries(compCounts)
    .map(([name, count]) => ({ name, count, pct: +((count / Math.max(1, sub.length)) * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  byCat[p.id] = {
    category: p.category || p.title,
    template: p.template,
    total: sub.length,
    mentioned: m,
    ratePct: +((m / Math.max(1, sub.length)) * 100).toFixed(1),
    top3: t3,
    num1: n1,
    topFirms: topFirms.slice(0, 6)
  };
}

// National competitor leaderboard across all 280 answers
const nationalComp = {};
for (const a of ansFull) {
  for (const mr of a.mentionRanks) {
    if (!nationalComp[mr.name]) {
      nationalComp[mr.name] = { name: mr.name, mentions: 0, top3: 0, num1: 0, byPlat: { chatgpt: 0, perplexity: 0, aimode: 0, gemini: 0, claude: 0 }, byCity: {} };
    }
    nationalComp[mr.name].mentions++;
    if (mr.rank <= 3) nationalComp[mr.name].top3++;
    if (mr.rank === 1) nationalComp[mr.name].num1++;
    nationalComp[mr.name].byPlat[a.plat] = (nationalComp[mr.name].byPlat[a.plat] || 0) + 1;
    nationalComp[mr.name].byCity[a.city] = (nationalComp[mr.name].byCity[a.city] || 0) + 1;
  }
}
const leaderboard = Object.values(nationalComp)
  .map(f => ({
    ...f,
    sharePct: +((f.mentions / Math.max(1, N)) * 100).toFixed(1),
    top3Pct: +((f.top3 / Math.max(1, N)) * 100).toFixed(1)
  }))
  .sort((a, b) => b.mentions - a.mentions);

// Live IRLS Logistic Regression over all 280 empirical answers
// Predictors:
// X1: Boutique & Modern Luxury Positioning Intent (pk === 'boutique_luxury')
// X2: Verified Local GBP >= 4.3★ & >= 10 Reviews in Market (hasStrongGbpCity)
// X3: Deep Multi-Source Web Grounding (>= 10 Citations Retrieved) (citationCount >= 10)
const predNames = [
  'Intercept (β₀)',
  'Boutique & Design-Led Positioning Query (X₁)',
  'Verified Local GBP ≥4.3★ & ≥10 Reviews (X₂)',
  'Multi-Source Web Grounding ≥10 Citations (X₃)'
];
const X = ansFull.map(a => [
  1,
  a.pk === 'boutique_luxury' ? 1 : 0,
  a.hasStrongGbpCity ? 1 : 0,
  a.citationCount >= 10 ? 1 : 0
]);
const y = ansFull.map(a => (a.wfMentioned ? 1 : 0));
const rawCoefs = runIrlsLogisticRegression(X, y);
const irls = {
  n: N,
  positives: wfTotal,
  iterations: 30,
  coefficients: rawCoefs.map((c, idx) => ({
    name: predNames[idx],
    beta: c.beta,
    se: c.se,
    z: c.z,
    or: idx === 0 ? null : c.oddsRatio,
    ci95: idx === 0 ? null : [
      +Math.exp(c.beta - 1.96 * c.se).toFixed(2),
      +Math.exp(c.beta + 1.96 * c.se).toFixed(2)
    ],
    pValue: c.pValue < 0.001 ? '<0.001' : c.pValue.toFixed(4)
  }))
};

const metrics = {
  generatedAt: new Date().toISOString(),
  totalAnswers: N,
  totalSerps: serpAudit.length,
  wfMentioned: wfTotal,
  wfRatePct: +((wfTotal / Math.max(1, N)) * 100).toFixed(1),
  wfTop3: wfTop3Total,
  wfTop3Pct: +((wfTop3Total / Math.max(1, N)) * 100).toFixed(1),
  wfNum1: wfNum1Total,
  wfNum1Pct: +((wfNum1Total / Math.max(1, N)) * 100).toFixed(1),
  wfCited: wfCitedTotal,
  wfCitedPct: +((wfCitedTotal / Math.max(1, N)) * 100).toFixed(1),
  serpTop10Count: serpAudit.filter(s => s.wfInTop10).length,
  serpTop20Count: serpAudit.filter(s => s.wfInTop20).length,
  byPlat,
  byCity,
  byCat,
  leaderboard: leaderboard.slice(0, 25),
  irls
};

fs.writeFileSync('pipeline/metrics.json', JSON.stringify(metrics, null, 2));
console.log(`Parsed ${N} answers and ${serpAudit.length} SERPs.`);
console.log(`WHITEFOX Mention Rate: ${wfTotal}/${N} (${metrics.wfRatePct}%), Top-3: ${wfTop3Total}/${N} (${metrics.wfTop3Pct}%), #1: ${wfNum1Total}, Cited: ${wfCitedTotal}`);
console.log(`Top 8 Agencies Nationally:`, leaderboard.slice(0, 8).map(x => `${x.name}: ${x.mentions} (${x.sharePct}%)`).join(' | '));
console.log(`IRLS Coefficients:`, JSON.stringify(irls.coefficients));
