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
})(window, document);
