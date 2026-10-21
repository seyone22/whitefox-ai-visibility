import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Client 30-slide deck and Technical 13-slide dossier integrity & zero-fabrication', () => {
  assert.ok(fs.existsSync('site/index.html'), 'site/index.html must exist');
  assert.ok(fs.existsSync('site/technical.html'), 'site/technical.html must exist');
  assert.ok(fs.existsSync('WHITEFOX_REAL_ESTATE_RAW_EVIDENCE_LEDGER.md'), 'Raw evidence ledger must exist');

  const clientHtml = fs.readFileSync('site/index.html', 'utf8');
  const techHtml = fs.readFileSync('site/technical.html', 'utf8');
  const metrics = JSON.parse(fs.readFileSync('pipeline/metrics.json', 'utf8'));

  const clientSlides = (clientHtml.match(/<section[^>]+class="[^"]*\bslide\b/g) || []).length;
  assert.equal(clientSlides, 30, `Expected 30 slides in site/index.html, got ${clientSlides}`);

  const techSlides = (techHtml.match(/<section[^>]+class="[^"]*\bslide\b/g) || []).length;
  assert.equal(techSlides, 13, `Expected 13 slides in site/technical.html, got ${techSlides}`);

  // No NaN / undefined / [object Object]
  for (const [name, html] of [['index.html', clientHtml], ['technical.html', techHtml]]) {
    assert.ok(!html.includes('undefined'), `${name} contains literal "undefined"`);
    assert.ok(!html.includes('NaN'), `${name} contains literal "NaN"`);
    assert.ok(!html.includes('[object Object]'), `${name} contains "[object Object]"`);
  }

  // Banned internal tokens
  for (const banned of ['Mehic', 'SKILL.md', 'StitchMCP']) {
    assert.ok(!clientHtml.includes(banned), `index.html contains banned token: ${banned}`);
    assert.ok(!techHtml.includes(banned), `technical.html contains banned token: ${banned}`);
  }

  // Empirical headline metric presence
  assert.ok(clientHtml.includes(`${metrics.wfRatePct}%`), `index.html must display empirical mention rate ${metrics.wfRatePct}%`);
  assert.ok(clientHtml.includes('MarshallWhiteRE'), 'index.html must surface the empirical MarshallWhiteRE sameAs JSON-LD finding');
});
