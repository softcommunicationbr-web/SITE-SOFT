/* ============================================================
   Soft Communication · Preloader Minimaliste Haute Performance
   Direção de Arte: Cinema Master · Tahiti · Luxury Dark
   Símbolo Puro do Tiki Sagrado · Sem Ruído · Saída Ultra-Suave
   ============================================================ */
(function (w, d) {
  'use strict';

  var root = d.documentElement;
  if (!root.classList.contains('has-preloader')) return;

  var el = d.getElementById('preloader');
  if (!el) {
    root.classList.remove('has-preloader');
    return;
  }

  var tiki = el.querySelector('.preloader-tiki-wrap') || el.querySelector('svg');

  // Curvas de aceleração ultra-suaves cinematográficas
  var EASE_SMOOTH = 'cubic-bezier(.16, 1, .3, 1)';
  var EASE_EXIT   = 'cubic-bezier(.85, 0, .15, 1)';

  var anims = [];
  var finished = false;
  var finishing = false;
  var runId = 0;

  function A(node, frames, opt) {
    if (!node || !node.animate) return null;
    try {
      var a = node.animate(frames, Object.assign({ fill: 'both' }, opt));
      anims.push(a);
      return a;
    } catch (e) {
      return null;
    }
  }

  function reset() {
    anims.forEach(function (a) {
      try { a.cancel(); } catch (e) { /* ignora */ }
    });
    anims = [];
    el.classList.remove('is-exiting');
    el.style.transform = '';
    el.style.opacity = '';
    el.style.transition = '';
    if (tiki) {
      tiki.style.transform = '';
      tiki.style.opacity = '';
      tiki.style.transition = '';
    }
  }

  function schedule() {
    // 1. Entrada suave e sublime do Símbolo Sagrado
    if (tiki) {
      var anim = A(tiki, [
        { opacity: 0, transform: 'scale(0.90)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { delay: 60, duration: 680, easing: EASE_SMOOTH });

      if (!anim) {
        setTimeout(function () {
          tiki.style.transition = 'opacity 0.68s ' + EASE_SMOOTH + ', transform 0.68s ' + EASE_SMOOTH;
          tiki.style.opacity = '1';
          tiki.style.transform = 'scale(1)';
        }, 60);
      }
    }

    // 2. Tempo de contemplação elegante antes da cortina subir saindo da tela principal
    var holdDuration = 1350;
    setTimeout(function () {
      if (!finished && !finishing) {
        exitSmooth(820, false);
      }
    }, holdDuration);

    // Fallback de segurança absoluto (evita que a página fique bloqueada)
    var currentRun = runId;
    setTimeout(function () {
      if (currentRun === runId && !finished) {
        done();
      }
    }, holdDuration + 1400);
  }

  function exitSmooth(dur, isUserSkip) {
    if (finished || finishing) return;
    finishing = true;
    runId++;

    var exitDuration = dur || (isUserSkip ? 460 : 820);
    el.classList.add('is-exiting');

    // Avisa que a saída da tela principal iniciou (para o hero revelar em perfeita harmonia)
    w.dispatchEvent(new CustomEvent('soft-preloader-exit', { detail: { duration: exitDuration } }));

    // Cortina sobe suavemente saindo da tela principal
    var animEl = A(el, [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(0, -100%, 0)' }
    ], { duration: exitDuration, easing: EASE_EXIT });

    if (!animEl) {
      el.style.transition = 'transform ' + (exitDuration / 1000) + 's ' + EASE_EXIT;
      el.style.transform = 'translate3d(0, -100%, 0)';
    }

    // Símbolo Tiki sobe suavemente com inércia e suave fade
    if (tiki) {
      var animTiki = A(tiki, [
        { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1 },
        { transform: 'translate3d(0, -50px, 0) scale(0.95)', opacity: 0 }
      ], { duration: Math.min(exitDuration, 520), easing: EASE_EXIT });

      if (!animTiki) {
        tiki.style.transition = 'opacity 0.45s ease-out, transform 0.52s ' + EASE_EXIT;
        tiki.style.opacity = '0';
        tiki.style.transform = 'translate3d(0, -50px, 0) scale(0.95)';
      }
    }

    setTimeout(function () {
      done();
    }, exitDuration + 30);
  }

  function done() {
    if (finished) return;
    finished = true;
    reset();
    el.hidden = true;
    el.style.display = 'none';
    root.classList.remove('has-preloader');
    d.removeEventListener('keydown', onKey, true);

    w.dispatchEvent(new CustomEvent('soft-preloader-done'));
  }

  function skip() {
    if (finished || finishing) return;
    exitSmooth(460, true);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      skip();
    }
  }

  // Interação do visitante: toque, clique ou scroll revela o site suavemente
  var canGestureSkip = false;
  setTimeout(function () { canGestureSkip = true; }, 220);

  el.addEventListener('click', function () {
    skip();
  });
  d.addEventListener('keydown', onKey, true);
  w.addEventListener('wheel', function () { if (!finished && canGestureSkip) skip(); }, { passive: true });
  w.addEventListener('touchmove', function () { if (!finished && canGestureSkip) skip(); }, { passive: true });

  function play() {
    runId++;
    finishing = false;
    reset();
    schedule();
  }

  w.SoftPreloader = {
    skip: skip,
    exitSmooth: exitSmooth
  };

  play();
})(window, document);
