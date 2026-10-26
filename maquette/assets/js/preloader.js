/* ============================================================
   Soft Communication · Preloader Minimaliste Haute Performance
   Direção de Arte: Cinema Master · Tahiti · Luxury Dark
   Símbolo Puro do Tiki Sagrado · Sem Ruído · Transição Ultra-Suave
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

  // Curvas de aceleração ultra-suaves (DCI 4K Luxury)
  var EASE_SMOOTH = 'cubic-bezier(.16, 1, .3, 1)';
  var EASE_EXIT   = 'cubic-bezier(.22, 1, .36, 1)';

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
    el.style.opacity = '';
    el.style.transform = '';
    if (tiki) {
      tiki.style.opacity = '';
      tiki.style.transform = '';
    }
  }

  function schedule() {
    // 1. Entrada suave e sublime do Símbolo Sagrado
    if (tiki) {
      A(tiki, [
        { opacity: 0, transform: 'scale(0.92)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { delay: 60, duration: 680, easing: EASE_SMOOTH });
    }

    // 2. Tempo de contemplação elegante antes do dissolve cinematográfico
    var holdDuration = 1450;
    setTimeout(function () {
      if (!finished && !finishing) {
        exitSmooth(780, false);
      }
    }, holdDuration);

    // Fallback de segurança absoluto (evita que a página fique bloqueada)
    var currentRun = runId;
    setTimeout(function () {
      if (currentRun === runId && !finished) {
        done();
      }
    }, holdDuration + 1200);
  }

  function exitSmooth(dur, isUserSkip) {
    if (finished || finishing) return;
    finishing = true;
    runId++;

    var exitDuration = dur || (isUserSkip ? 420 : 780);
    el.classList.add('is-exiting');

    // Dissolve ultra-suave da tela inteira revelando o site
    A(el, [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(1.02)' }
    ], { duration: exitDuration, easing: EASE_EXIT });

    // Fade-out suave simultâneo do símbolo
    if (tiki) {
      A(tiki, [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.04)' }
      ], { duration: Math.min(exitDuration, 520), easing: EASE_EXIT });
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
    exitSmooth(420, true);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      skip();
    }
  }

  // Interação do visitante: toque, clique ou scroll revela o site suavemente
  var canGestureSkip = false;
  setTimeout(function () { canGestureSkip = true; }, 250);

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
