/* ============================================================
   Soft Communication · vídeos leves e suaves
   - Nada de vídeo baixa antes de aparecer na tela.
   - O vídeo do topo só começa depois da abertura (preloader),
     para a animação de entrada não engasgar.
   - Fora da tela ou com a aba em segundo plano: pausa.
   - "Reduzir movimento" ou "economia de dados": fica só a capa.
   Vídeos controlados: <video data-smooth="hero"> e <video data-smooth="inview">.
   ============================================================ */
(function (w, d) {
  'use strict';
  var vids = Array.prototype.slice.call(d.querySelectorAll('video[data-smooth]'));
  if (!vids.length) return;

  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
  var auto = !reduce && !saveData;
  var visible = new Map();
  var heroReady = !d.documentElement.classList.contains('has-preloader');

  vids.forEach(function (v) {
    v.muted = true;
    v.setAttribute('disablepictureinpicture', '');
    v.setAttribute('disableremoteplayback', '');
  });

  function play(v) {
    if (!auto || d.hidden || !visible.get(v)) return;
    if (v.getAttribute('data-smooth') === 'hero' && !heroReady) return;
    if (v.preload === 'none') v.preload = 'auto';
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* navegador bloqueou: fica a capa */ });
  }
  function pause(v) { if (!v.paused) { try { v.pause(); } catch (e) { /* ignora */ } } }

  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var on = e.isIntersecting && e.intersectionRatio >= 0.25;
        visible.set(e.target, on);
        if (on) play(e.target); else pause(e.target);
      });
    }, { threshold: [0, 0.25, 0.6] });
    vids.forEach(function (v) { visible.set(v, false); io.observe(v); });
  } else {
    vids.forEach(function (v) { visible.set(v, true); });
  }

  function startHero() {
    if (heroReady) return;
    heroReady = true;
    vids.forEach(function (v) { if (v.getAttribute('data-smooth') === 'hero') play(v); });
  }
  if (!heroReady) {
    w.addEventListener('soft-preloader-exit', startHero, { once: true });
    w.addEventListener('soft-preloader-done', startHero, { once: true });
    w.setTimeout(startHero, 4000); // garantia: a abertura nunca prende o vídeo
  } else if ('requestIdleCallback' in w) {
    w.requestIdleCallback(function () { vids.forEach(play); }, { timeout: 1200 });
  } else {
    w.setTimeout(function () { vids.forEach(play); }, 300);
  }

  d.addEventListener('visibilitychange', function () {
    vids.forEach(function (v) { if (d.hidden) pause(v); else play(v); });
  });

  /* ---------- Sincronização ao vivo com o Admin (portfolio_videos no Supabase) ---------- */
  var SUPABASE_URL = 'https://xvabghgvrhpnyywpmodb.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YWJnaGd2cmhwbnl5d3Btb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTgwNTEsImV4cCI6MjEwNzMzNDA1MX0.d0CNiaTYEnpsCY4N9qS6HNIxa3u7DYtzAOErvZHzC0w';
  var CDN_BASE = SUPABASE_URL + '/storage/v1/object/public/videos-portifolio/';

  function fileStem(u) {
    if (!u) return '';
    var base = String(u).split('?')[0].split('/').pop() || '';
    return base.replace(/^hero-/, '').replace(/\.(webm|mp4|mov|jpg|png|webp)$/i, '').toLowerCase();
  }

  function syncPortfolioFromSupabase() {
    if (!w.fetch) return;
    w.fetch(SUPABASE_URL + '/rest/v1/portfolio_videos?select=id,filename,url,poster,title,label,active,hero,i18n&order=position.asc,id.asc', {
      headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON }
    })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) return;
      var byStem = {};
      var heroRow = null;
      rows.forEach(function (row) {
        var st = fileStem(row.filename || row.url);
        if (st) byStem[st] = row;
        if (row.hero === true && row.active !== false) heroRow = row;
      });

      var rootPrefix = d.documentElement.getAttribute('data-root') || '';

      /* 1. Sincroniza Vídeo da Hero (#nhHeroVideo) */
      var heroEl = d.getElementById('nhHeroVideo');
      if (heroEl && heroRow) {
        var curStem = fileStem(heroEl.getAttribute('src') || '');
        var newStem = fileStem(heroRow.filename || heroRow.url || '');
        if (newStem && curStem !== newStem) {
          var heroUrl = heroRow.url || (CDN_BASE + heroRow.filename);
          heroEl.setAttribute('src', heroUrl);
          if (heroRow.poster) {
            var pUrl = /^https?:\/\//i.test(heroRow.poster) ? heroRow.poster : (rootPrefix + heroRow.poster);
            heroEl.setAttribute('poster', pUrl);
          }
          try { heroEl.load(); play(heroEl); } catch (e) {}
        }
      }

      /* 2. Sincroniza Carrossel (#nhVideoTrack) e Cases (#nhCasesGrid) — oculta vídeos deletados ou desativados no Admin */
      var cards = d.querySelectorAll('#nhVideoTrack .nh-video-card, #nhCasesGrid .nh-case-card');
      cards.forEach(function (card) {
        var vid = card.querySelector('video');
        var ref = card.getAttribute('data-video') || (vid && vid.getAttribute('src')) || '';
        var st = fileStem(ref);
        if (!st) return;
        var row = byStem[st];
        if (!row || row.active === false) {
          card.style.display = 'none';
          card.setAttribute('hidden', '');
          if (vid) pause(vid);
        } else {
          if (card.style.display === 'none') {
            card.style.display = '';
            card.removeAttribute('hidden');
          }
        }
      });
    })
    .catch(function () {});
  }

  syncPortfolioFromSupabase();
  w.addEventListener('storage', function (e) {
    if (e && e.key === 'soft_catalog_updated') syncPortfolioFromSupabase();
  });
})(window, document);
