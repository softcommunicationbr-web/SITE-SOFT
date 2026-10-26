/* ============================================================
   Soft Communication · Preloader Cinématique Haute Performance
   Direção de Arte: Cinema Master DCI 4K · Tahiti · Luxury Dark
   Símbolo Puro do Tiki Sagrado · Sem Texto · 100% Nítido & Alinhado
   Sincronização audiovisual de precisão com Web Audio API.
   Mostrado uma vez por sessão. ?intro=1 força a repetição.
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

  // Permitir execução a cada recarregamento para experiência cinemática consistente
  var scriptEl = d.currentScript || d.querySelector('script[src*="preloader.js"]');
  var scriptSrc = scriptEl ? (scriptEl.getAttribute('src') || '') : '';
  var basePath = (scriptSrc.indexOf('../') === 0) ? '../' : (root.getAttribute('data-root') || '');
  var base = basePath + 'assets/audio/';
  var stage = el.querySelector('.preloader-stage');
  var hud = el.querySelector('.preloader-hud');
  var glow = el.querySelector('.preloader-glow');
  var tiki = el.querySelector('.preloader-tiki-wrap');
  var lightShaft = el.querySelector('.preloader-light-shaft');
  var laserLine = el.querySelector('.preloader-laser-line');
  var tikiSweep = el.querySelector('.preloader-tiki-sweep');
  var beam = el.querySelector('.preloader-beam');
  var spark = el.querySelector('.preloader-beam-spark');
  var shockwave = el.querySelector('.preloader-shockwave');

  // Curvas de aceleração cinematográfica ultra-suaves (DCI 4K)
  var EASE_SMOOTH = 'cubic-bezier(.22, 1, .36, 1)';
  var EASE_POWER  = 'cubic-bezier(.16, 1, .3, 1)';
  var EASE_LIFT   = 'cubic-bezier(.16, 1, .3, 1)';

  /* ---------- Linha do tempo (milissegundos) ---------- */
  var T = {
    hud: [0, 450],
    shaft: [100, 1300],
    laser: [140, 1050],
    tiki: [180, 850],
    sweep: [320, 700],
    beam: [260, 650],
    impact: 1100,
    lift: 1850,
    liftDur: 850,
    cues: [
      ['riser', 350, 0.45],
      ['tapB', 1050, 0.5],
      ['thud', 1100, 0.85],
      ['whoosh', 1850, 0.7]
    ]
  };

  /* ---------- Áudio (Web Audio API com carregamento assíncrono) ---------- */
  var AC = w.AudioContext || w.webkitAudioContext;
  var ctx = null;
  var buffers = {};
  var soundOn = false;
  var buffersReady = Promise.resolve();
  var FILES = {
    tapA: 'intro-tap-a.m4a',
    tapB: 'intro-tap-b.m4a',
    riser: 'intro-riser.m4a',
    thud: 'intro-thud.m4a',
    whoosh: 'intro-whoosh.m4a'
  };

  function decode(buf) {
    return new Promise(function (res, rej) {
      var p = ctx.decodeAudioData(buf, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }

  if (AC) {
    try {
      ctx = new AC();
      var need = {};
      T.cues.forEach(function (c) { need[c[0]] = true; });
      buffersReady = Promise.all(Object.keys(need).map(function (k) {
        return fetch(base + FILES[k])
          .then(function (r) { return r.arrayBuffer(); })
          .then(decode)
          .then(function (b) { buffers[k] = b; });
      })).catch(function () { /* fallback silencioso sem quebrar */ });
    } catch (e) {
      ctx = null;
    }
  }

  function tryResume() {
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === 'running') return Promise.resolve(true);
    var r = ctx.resume();
    return Promise.race([
      r.then(function () { return ctx.state === 'running'; }, function () { return false; }),
      new Promise(function (res) {
        setTimeout(function () { res(ctx.state === 'running'); }, 120);
      })
    ]);
  }

  function playCues(t0) {
    if (!soundOn || !ctx) return;
    T.cues.forEach(function (c) {
      var b = buffers[c[0]];
      if (!b) return;
      var s = ctx.createBufferSource();
      var g = ctx.createGain();
      s.buffer = b;
      g.gain.value = c[2];
      s.connect(g);
      g.connect(ctx.destination);
      s.start(Math.max(ctx.currentTime, t0 + c[1] / 1000));
    });
  }

  /* ---------- Animação Central ---------- */
  var anims = [];
  var finished = false;
  var finishing = false;
  var runId = 0;

  function A(node, frames, opt) {
    if (!node || !node.animate) return null;
    var a = node.animate(frames, Object.assign({ fill: 'both' }, opt));
    anims.push(a);
    return a;
  }

  function reset() {
    anims.forEach(function (a) {
      try { a.cancel(); } catch (e) { /* ignora */ }
    });
    anims = [];
    el.classList.remove('is-exiting');
    el.style.opacity = '';
    el.style.filter = '';
    el.style.transform = '';
    if (stage) {
      stage.style.transform = '';
      stage.style.opacity = '';
      stage.style.filter = '';
    }
  }

  function schedule() {
    // 1. HUD (Linhas de Enquadramento Cinematográfico)
    if (hud) {
      A(hud, [
        { opacity: 0 },
        { opacity: 1 }
      ], { delay: T.hud[0], duration: T.hud[1], easing: EASE_SMOOTH });
    }

    // 2. Halo dourado ambiente
    if (glow) {
      A(glow, [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7)' },
        { opacity: 0.5, transform: 'translate(-50%, -50%) scale(1)', offset: 0.5 },
        { opacity: 0.85, transform: 'translate(-50%, -50%) scale(1.15)', offset: 0.75 },
        { opacity: 0.65, transform: 'translate(-50%, -50%) scale(1)' }
      ], { delay: 100, duration: 1600, easing: EASE_POWER });
    }

    // 3. Feixes de Luz Cinematográficos (Light Shaft & Laser Line)
    if (lightShaft) {
      A(lightShaft, [
        { transform: 'translateX(-50%) scaleX(0)', opacity: 0 },
        { transform: 'translateX(-50%) scaleX(1)', opacity: 0.9, offset: 0.4 },
        { transform: 'translateX(-50%) scaleX(1.1)', opacity: 0.5 }
      ], { delay: T.shaft[0], duration: T.shaft[1], easing: EASE_POWER });
    }
    if (laserLine) {
      A(laserLine, [
        { transform: 'translate(-50%, -50%) scaleX(0)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scaleX(1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(-50%, -50%) scaleX(1)', opacity: 0.35 }
      ], { delay: T.laser[0], duration: T.laser[1], easing: EASE_SMOOTH });
    }

    // 4. Emblème Tiki Sacré Polynésien - Só Surgindo, Sem Blur, 100% Alinhado
    if (tiki) {
      A(tiki, [
        { opacity: 0, transform: 'translateY(36px) scale(0.92)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { delay: T.tiki[0], duration: T.tiki[1], easing: EASE_POWER });
    }

    // Feixe de Luz varrendo o Tiki (Glint / Sheen)
    if (tikiSweep) {
      A(tikiSweep, [
        { opacity: 0, transform: 'translateX(-120%)' },
        { opacity: 1, transform: 'translateX(0%)', offset: 0.45 },
        { opacity: 0, transform: 'translateX(130%)' }
      ], { delay: T.sweep[0], duration: T.sweep[1], easing: EASE_SMOOTH });
    }

    // 5. Faisceau laser na base do Tiki
    if (beam) {
      A(beam, [
        { transform: 'translateX(-50%) scaleX(0)', opacity: 0.3 },
        { transform: 'translateX(-50%) scaleX(1)', opacity: 1 }
      ], { delay: T.beam[0], duration: T.beam[1], easing: EASE_SMOOTH });
    }
    if (spark) {
      A(spark, [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.3)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1.4)', offset: 0.4 },
        { opacity: 0.3, transform: 'translate(-50%, -50%) scale(0.8)' }
      ], { delay: T.beam[0] + 50, duration: T.beam[1] + 200, easing: EASE_SMOOTH });
    }

    // 6. Impacto / Thud (onda de choque óptica no clímax sonoro e pulso no Tiki)
    setTimeout(function () {
      if (finished || finishing) return;
      if (shockwave) {
        A(shockwave, [
          { opacity: 0.95, transform: 'translate(-50%, -50%) scale(0.4)' },
          { opacity: 0, transform: 'translate(-50%, -50%) scale(3.8)' }
        ], { duration: 700, easing: EASE_SMOOTH });
      }
      if (tiki) {
        A(tiki, [
          { transform: 'scale(1)' },
          { transform: 'scale(1.06)', offset: 0.25 },
          { transform: 'scale(1)' }
        ], { duration: 550, easing: EASE_SMOOTH });
      }
    }, T.impact);

    // 7. Saída Ultra-Suave (Dissolve Cinematográfico)
    setTimeout(function () {
      if (!finished && !finishing) {
        exitSmooth(T.liftDur, false);
      }
    }, T.lift);

    // Fallback de segurança absoluto
    var id = runId;
    setTimeout(function () {
      if (id === runId && !finished) done();
    }, T.lift + T.liftDur + 600);
  }

  function exitSmooth(dur, isUserSkip) {
    if (finished) return;
    finishing = true;
    runId++;

    var exitDuration = dur || (isUserSkip ? 460 : T.liftDur);
    el.classList.add('is-exiting');

    // 1. O contêiner dissolve suavemente com desfoque e expansão sutis
    A(el, [
      { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
      { opacity: 0, filter: 'blur(12px)', transform: 'scale(1.03)' }
    ], { duration: exitDuration, easing: EASE_POWER });

    // 2. O palco e o Tiki sobem sutilmente enquanto dissipam com elegância
    if (stage) {
      A(stage, [
        { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0) scale(1)' },
        { opacity: 0, filter: 'blur(8px)', transform: 'translateY(-16px) scale(1.05)' }
      ], { duration: exitDuration, easing: EASE_POWER });
    }

    // 3. O HUD de enquadramento dissolve de forma rápida e discreta
    if (hud) {
      A(hud, [
        { opacity: 1 },
        { opacity: 0 }
      ], { duration: Math.min(320, exitDuration), easing: 'ease-out' });
    }

    setTimeout(function () {
      done();
    }, exitDuration + 40);
  }

  function done() {
    if (finished) return;
    finished = true;
    reset();
    el.hidden = true;
    el.style.display = 'none';
    root.classList.remove('has-preloader');
    d.removeEventListener('keydown', onKey, true);

    try {
      if (ctx && ctx.state !== 'closed') {
        setTimeout(function () { ctx.close(); }, 1200);
      }
    } catch (e) { /* ignora */ }

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

  // Interação do visitante: qualquer clique ou tecla descobre o site instantaneamente
  var canGestureSkip = false;
  setTimeout(function () { canGestureSkip = true; }, 550);

  el.addEventListener('click', function () {
    skip();
  });
  d.addEventListener('keydown', onKey, true);
  w.addEventListener('wheel', function () { if (!finished && canGestureSkip) skip(); }, { passive: true });
  w.addEventListener('touchmove', function () { if (!finished && canGestureSkip) skip(); }, { passive: true });

  function play(withSoundTry) {
    runId++;
    finishing = false;
    reset();

    // 1. Inicia os visuais cinematográficos imediatamente no frame 1
    schedule();

    // 2. Tenta áudio Web Audio API em segundo plano de forma não-bloqueante
    var prep = withSoundTry ? tryResume() : Promise.resolve(ctx && ctx.state === 'running');
    prep.then(function (running) {
      soundOn = !!running;
      if (!soundOn || !ctx) return;
      buffersReady.then(function () {
        if (!finished && !finishing && ctx.state === 'running') {
          playCues(ctx.currentTime + 0.02);
        }
      });
    }).catch(function () { /* áudio silencioso */ });
  }

  w.SoftPreloader = {
    skip: skip,
    timeline: T,
    soundOn: function () { return soundOn; }
  };

  play(true);
})(window, document);
