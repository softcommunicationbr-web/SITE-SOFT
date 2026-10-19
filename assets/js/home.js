/* ============================================================
   Soft Communication · página mãe: monta hero, destaques e faixas
   a partir do catálogo (assets/data/catalog.js ou Supabase).
   ============================================================ */
(function (w, d) {
  'use strict';
  var C = w.SoftCatalog; if (!C) return;
  var UI = w.SOFT_UI || {};
  var root = d.documentElement.getAttribute('data-root') || '';
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noop = function () {};
  var BANDS = ['band-1', 'band-2', 'band-3'];
  var TILE_H = { desktop: { 'band-1': 220, 'band-2': 280, 'band-3': 220 }, mobile: { 'band-1': 160, 'band-2': 220, 'band-3': 160 } };

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function playBtn() { return '<span class="tile-play-btn"><span class="tile-play-icon">&#x25B6;</span></span>'; }
  function selo() { return '<img class="selo-mark" src="' + root + 'assets/brand/soft-selo-creme.svg" alt="">'; }
  function attrs(it, dup) {
    var title = C.text(it, 'title');
    return ' href="#visionneuse" data-lightbox-open="visionneuse" data-hover-play data-id="' + esc(it.id) + '"' +
      ' data-orient="' + C.orient(it) + '" data-video-src="' + esc(C.url(it)) + '" data-poster="' + esc(C.posterUrl(it)) + '"' +
      ' data-video-title="' + esc(title) + '"' + (dup ? ' tabindex="-1" aria-hidden="true"' : '');
  }
  function poster(it) {
    var p = C.posterUrl(it);
    return p ? '<img class="tile-poster" src="' + esc(p) + '" alt="" loading="lazy" decoding="async">' : '';
  }
  function tile(it, dup) {
    var label = C.text(it, 'label') || C.text(it, 'title');
    var ar = (it.w && it.h) ? (it.w + ' / ' + it.h) : '16 / 9';
    return '<a class="tile tile-fluid" style="--ar:' + ar + '"' + attrs(it, dup) + '>' + poster(it) + playBtn() +
      '<span class="tile-label">' + esc(label) + '</span>' + selo() + '</a>';
  }
  function card(it) {
    var svc = C.text(it, 'service'), sec = C.text(it, 'sector'), meta = C.text(it, 'meta');
    return '<a class="card-project"' + attrs(it, false) + '><div class="media media-16x9">' +
      (it.ai ? '<span class="tag tag-ia">' + esc(UI.ia_tag) + '</span>' : '') + poster(it) + playBtn() +
      (it.ai ? '<p class="ia-caption">' + esc(UI.ia_caption) + '</p>' : '') + selo() + '</div>' +
      '<div class="tags">' + (svc ? '<span class="tag">' + esc(svc) + '</span>' : '') + (sec ? '<span class="tag tag-outline">' + esc(sec) + '</span>' : '') + '</div>' +
      '<h3 class="card-title">' + esc(C.text(it, 'title')) + '</h3>' + (meta ? '<p class="card-meta">' + esc(meta) + '</p>' : '') + '</a>';
  }

  function renderHero(items) {
    var v = d.querySelector('[data-hero-video]'); if (!v) return;
    var it = C.heroItem(items) || C.byPlacement(items, 'band-1')[0] || items[0];
    if (!it) return;
    var url = C.url(it), p = C.posterUrl(it);
    if (p) v.setAttribute('poster', p);
    if (v.getAttribute('src') !== url) { v.src = url; }
    v.setAttribute('data-hero-id', it.id);
    if (reduce) { try { v.pause(); } catch (e) { /* ignora */ } v.removeAttribute('autoplay'); }
    else { v.play().catch(noop); }
  }
  function renderCards(items) {
    var host = d.querySelector('[data-render="cards"]'); if (!host) return;
    var list = [];
    ['grid-1', 'grid-2', 'grid-3', 'grid-4'].forEach(function (pl) { C.byPlacement(items, pl).forEach(function (i) { list.push(i); }); });
    host.innerHTML = list.map(card).join('');
    var sec = d.getElementById('selecao');
  }
  function renderBands(items) {
    var vw = Math.max(w.innerWidth || 1280, 640), mob = vw <= 767;
    BANDS.forEach(function (pl) {
      var band = d.querySelector('[data-band="' + pl + '"]'); if (!band) return;
      var list = C.byPlacement(items, pl), track = band.querySelector('.band-track');
      band.hidden = !list.length;
      if (!list.length) { track.innerHTML = ''; return; }
      var h = (mob ? TILE_H.mobile : TILE_H.desktop)[pl], est = 0;
      list.forEach(function (it) { est += h * ((it.w && it.h) ? it.w / it.h : 16 / 9) + 16; });
      var copies = Math.max(1, Math.ceil((vw * 1.3) / Math.max(est, 1)));
      var one = '', two = '';
      for (var c = 0; c < copies; c++) { list.forEach(function (it) { one += tile(it, false); two += tile(it, true); }); }
      track.innerHTML = one + two;
    });
  }
  function renderCounts(items) {
    d.querySelectorAll('[data-video-count]').forEach(function (el) { el.textContent = items.length; });
  }
  function draftNotice() {
    if (d.getElementById('draft-notice')) return;
    var n = d.createElement('div');
    n.id = 'draft-notice'; n.className = 'draft-notice'; n.setAttribute('role', 'status');
    n.innerHTML = '<span>' + esc(UI.draft_notice) + '</span> <button type="button" class="btn btn-outline btn-small">' + esc(UI.draft_discard) + '</button>';
    n.querySelector('button').addEventListener('click', function () { C.clearDraft(); w.location.reload(); });
    d.body.appendChild(n);
  }
  function render(res) {
    var items = C.visible(res.items);
    renderHero(items); renderCards(items); renderBands(items); renderCounts(items);
    if (res.draft) draftNotice();
    d.documentElement.setAttribute('data-catalog-source', res.source);
    w.dispatchEvent(new CustomEvent('soft-home-rendered', { detail: { source: res.source, count: items.length } }));
  }

  /* 1) catálogo padrão na hora (sem esperar a rede); 2) Supabase, se estiver ligado */
  var first = C.remoteOn() ? { source: 'base', items: C.base.items } : null;
  if (first) render(first);
  C.load().then(function (res) { if (!first || res.source === 'remote') render(res); });
  var rt = null, lastMob = (w.innerWidth <= 767);
  w.addEventListener('resize', function () {
    var m = w.innerWidth <= 767; if (m === lastMob) return; lastMob = m;
    clearTimeout(rt); rt = setTimeout(function () { C.load().then(render); }, 200);
  });
  w.addEventListener('storage', function (e) {
    if (e.key === 'soft_catalog_draft_v2' || e.key === 'soft_catalog_updated') {
      C.load(true).then(render);
    }
  });
  d.addEventListener('visibilitychange', function () {
    if (!d.hidden) {
      C.load(true).then(render);
    }
  });
})(window, document);
