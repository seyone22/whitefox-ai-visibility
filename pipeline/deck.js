(function () {
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var bar = document.getElementById('bar');
  var counter = document.getElementById('count');
  var controls = document.getElementById('controls');
  var params = new URLSearchParams(location.search);
  var idx = -1;
  var isStatic = params.has('static');
  if (isStatic) document.body.classList.add('static');

  // ── Headlines build word by word ────────────────────────────────────────
  slides.forEach(function (s) {
    s.querySelectorAll('.h1, .display').forEach(function (h) {
      if (h.children.length) return;
      var words = h.textContent.trim().split(/\s+/);
      h.textContent = '';
      words.forEach(function (w, i) {
        var outer = document.createElement('span'); outer.className = 'w';
        var inner = document.createElement('span'); inner.textContent = w;
        inner.style.setProperty('--wi', i);
        outer.appendChild(inner); h.appendChild(outer);
        if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      });
    });
  });

  // ── Numbers count up: the first number in each figure animates ──────────
  var COUNT_SEL = '.big, .huge, .f-num, .hb-val b, .heat-tot, .cv-n, .cv-total b, .stat-num';
  function firstNumberNode(el) {
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = tw.nextNode())) if (/\d/.test(n.nodeValue)) return n;
    return null;
  }
  slides.forEach(function (s) {
    s.querySelectorAll(COUNT_SEL).forEach(function (el) {
      if (el.closest('[data-counted]') && el.closest('[data-counted]') !== el) return;
      var node = firstNumberNode(el);
      if (!node) return;
      var m = node.nodeValue.match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
      if (!m) return;
      el.setAttribute('data-counted', '');
      node.__count = { pre: m[1], num: parseFloat(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] || '').length, comma: m[2].indexOf(',') >= 0, post: m[3], text: node.nodeValue };
    });
  });
  function fmt(c, v) {
    var s = v.toFixed(c.dec);
    if (c.comma) s = Number(s).toLocaleString('en-AU', { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec });
    return c.pre + s + c.post;
  }
  function countUp(root) {
    if (isStatic) return;
    var nodes = [];
    root.querySelectorAll('[data-counted]').forEach(function (el) { var n = firstNumberNode(el); if (n && n.__count) nodes.push(n); });
    nodes.forEach(function (n, k) {
      var c = n.__count, delay = 250 + Math.min(k, 12) * 60, dur = 1300, t0 = null, done = false;
      n.nodeValue = fmt(c, 0);
      function step(t) {
        if (done) return;
        if (t0 === null) t0 = t;
        var p = Math.max(0, Math.min(1, (t - t0 - delay) / dur)), e = 1 - Math.pow(1 - p, 4);
        n.nodeValue = fmt(c, c.num * e);
        if (p < 1 && slides[idx] === root) requestAnimationFrame(step); else n.nodeValue = c.text;
      }
      requestAnimationFrame(step);
      // always land on the exact figure, even if animation frames are throttled
      setTimeout(function () { done = true; n.nodeValue = c.text; }, delay + dur + 120);
    });
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  function fromHash() {
    if (params.has('s')) return clamp(parseInt(params.get('s'), 10) - 1);
    var h = (location.hash || '').slice(1);
    if (/^s\d+$/.test(h)) return clamp(parseInt(h.slice(1), 10) - 1);
    var i = slides.findIndex(function (s) { return s.id === h; });
    return i >= 0 ? i : 0;
  }
  function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n || 0)); }

  function go(n) {
    n = clamp(n);
    if (n === idx) return;
    var back = n < idx;
    stage.classList.toggle('going-back', back);
    idx = n;
    slides.forEach(function (s, i) {
      var on = i === n;
      if (on) { s.classList.remove('is-active'); void s.offsetWidth; }
      s.classList.toggle('is-active', on);
      s.classList.toggle('is-past', i < n);
      s.classList.toggle('is-future', i > n);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    counter.textContent = (n + 1) + ' / ' + slides.length;
    bar.style.width = ((n + 1) / slides.length * 100) + '%';
    countUp(slides[n]);
    try { history.replaceState(null, '', '#s' + (n + 1)); } catch (e) { /* sandboxed */ }
  }

  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    stage.style.setProperty('--k', Math.min(w / 1920, h / 1080));
  }

  document.getElementById('prev').addEventListener('click', function (e) { e.stopPropagation(); go(idx - 1); });
  document.getElementById('next').addEventListener('click', function (e) { e.stopPropagation(); go(idx + 1); });
  document.getElementById('fs').addEventListener('click', function (e) {
    e.stopPropagation();
    var el = document.documentElement;
    try {
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    } catch (err) { /* not available */ }
  });
  // Click like a presenter's clicker: right two-thirds forward, left third back
  document.getElementById('deck').addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return;
    var r = stage.getBoundingClientRect();
    go(idx + (e.clientX < r.left + r.width / 3 ? -1 : 1));
  });
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); go(idx + 1); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); go(idx - 1); }
    else if (k === 'Home') { go(0); } else if (k === 'End') { go(slides.length - 1); }
    else if (k === 'f' || k === 'F') { document.getElementById('fs').click(); }
  });
  var sx = null, sy = null;
  document.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(idx + (dx < 0 ? 1 : -1));
    sx = null;
  });

  // Controls fade out while presenting and come back on mouse movement
  var idle;
  function wake() {
    document.body.classList.remove('idle');
    clearTimeout(idle);
    idle = setTimeout(function () { document.body.classList.add('idle'); }, 2600);
  }
  document.addEventListener('mousemove', wake);
  document.addEventListener('keydown', wake);
  controls.addEventListener('mouseenter', function () { clearTimeout(idle); });

  window.addEventListener('resize', fit);
  window.addEventListener('hashchange', function () { var n = fromHash(); if (n !== idx) go(n); });

  fit();
  go(fromHash());
  wake();
})();
