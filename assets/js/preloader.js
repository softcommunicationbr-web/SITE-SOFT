/* ============================================================
   Soft Communication · preloader
   Perfil « motion limpo » : uma linha de horizonte se estende, o
   wordmark oficial surge do chão em 3D (deita → fica de pé), a linha
   COMMUNICATION vem atrás, e a cortina sobe descobrindo a página.
   Quatro SFX sincronizados. Mostrado uma vez por sessão. ?intro=1 repete.
   ============================================================ */
(function (w, d) {
  'use strict';
  var root = d.documentElement;
  if (!root.classList.contains('has-preloader')) return;
  var el = d.getElementById('preloader');
  if (!el) { root.classList.remove('has-preloader'); return; }
  try { w.sessionStorage.setItem('soft-intro', '1'); } catch (e) { /* sem armazenamento */ }

  var variant = 'full';
  el.setAttribute('data-variant', variant);
  var base = (root.getAttribute('data-root') || '') + 'assets/audio/';
  var stage = el.querySelector('.preloader-stage');
  var floor = el.querySelector('.preloader-floor');
  var word = el.querySelector('.pl3-word'), comm = el.querySelector('.pl3-comm');
  var soundBtn = el.querySelector('.preloader-sound');
  var EASE_OUT = 'cubic-bezier(.23,1,.32,1)', EASE_LIFT = 'cubic-bezier(.77,0,.175,1)';

  /* ---------- linha do tempo (ms). Mexa aqui para ajustar o ritmo. ---------- */
  var T = { floor: [150, 500], word: [380, 950], comm: [980, 700], lift: 2250, liftDur: 650,
    cues: [['riser', 380, 0.45], ['thud', 1250, 0.85], ['tapB', 1180, 0.5], ['whoosh', 2250, 0.8]] };

  /* ---------- áudio ---------- */
  var AC = w.AudioContext || w.webkitAudioContext, ctx = null, buffers = {}, soundOn = false, buffersReady = Promise.resolve();
  var FILES = { tapA: 'intro-tap-a.m4a', tapB: 'intro-tap-b.m4a', riser: 'intro-riser.m4a', thud: 'intro-thud.m4a', whoosh: 'intro-whoosh.m4a' };
  function decode(buf) {
    return new Promise(function (res, rej) {
      var p = ctx.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej);
    });
  }
  if (AC) {
    try {
      ctx = new AC();
      var need = {}; T.cues.forEach(function (c) { need[c[0]] = true; });
      buffersReady = Promise.all(Object.keys(need).map(function (k) {
        return fetch(base + FILES[k]).then(function (r) { return r.arrayBuffer(); }).then(decode).then(function (b) { buffers[k] = b; });
      })).catch(function () { /* sem SFX: a animação segue */ });
    } catch (e) { ctx = null; }
  }
  function tryResume() {
    if (!ctx) return Promise.resolve(false);
    var r = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
    return Promise.race([r.then(function () { return ctx.state === 'running'; }, function () { return false; }),
      new Promise(function (res) { setTimeout(function () { res(ctx.state === 'running'); }, 120); })]);
  }
  function playCues(t0) {
    if (!soundOn) return;
    T.cues.forEach(function (c) {
      var b = buffers[c[0]]; if (!b) return;
      var s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b; g.gain.value = c[2]; s.connect(g); g.connect(ctx.destination);
      s.start(Math.max(ctx.currentTime, t0 + c[1] / 1000));
    });
  }

  /* ---------- animação ---------- */
  var anims = [], finished = false, finishing = false, runId = 0;
  function A(node, frames, opt) {
    if (!node || !node.animate) return null;
    var a = node.animate(frames, Object.assign({ fill: 'both' }, opt)); anims.push(a); return a;
  }
  function reset() {
    anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* ignora */ } }); anims = [];
    el.style.clipPath = ''; stage.style.transform = '';
  }
  function schedule() {
    A(floor, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { delay: T.floor[0], duration: T.floor[1], easing: EASE_OUT });
    A(word, [{ transform: 'rotateX(82deg) translateY(58%)', opacity: 0 }, { transform: 'rotateX(68deg) translateY(46%)', opacity: 1, offset: 0.22 }, { transform: 'rotateX(0deg) translateY(0)', opacity: 1 }],
      { delay: T.word[0], duration: T.word[1], easing: EASE_OUT });
    A(comm, [{ transform: 'rotateX(82deg) translateY(58%)', opacity: 0 }, { transform: 'rotateX(68deg) translateY(46%)', opacity: 1, offset: 0.22 }, { transform: 'rotateX(0deg) translateY(0)', opacity: 1 }],
      { delay: T.comm[0], duration: T.comm[1], easing: EASE_OUT });
    A(el, [{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { delay: T.lift, duration: T.liftDur, easing: EASE_LIFT });
    A(stage, [{ transform: 'translateY(0)' }, { transform: 'translateY(-22vh)' }], { delay: T.lift, duration: T.liftDur, easing: EASE_LIFT });
    var last = anims[anims.length - 1];
    if (last) last.onfinish = function () { if (!finished) done(); };
    // cobertura de segurança: se a Web Animations falhar, a cortina sai igual
    var id = runId; setTimeout(function () { if (id === runId && !finished) done(); }, T.lift + T.liftDur + 600);
  }
  function done() {
    if (finished) return; finished = true;
    reset(); el.hidden = true; root.classList.remove('has-preloader');
    d.removeEventListener('keydown', onKey, true);
    try { if (ctx && ctx.state !== 'closed') setTimeout(function () { ctx.close(); }, 1500); } catch (e) { /* ignora */ }
    w.dispatchEvent(new CustomEvent('soft-preloader-done'));
  }
  function skip() {
    if (finished || finishing) return; finishing = true;
    runId++;
    anims.forEach(function (a) { try { a.finish(); } catch (e) { /* ignora */ } }); // letras completas na hora
    var up = A(el, [{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 380, easing: EASE_LIFT });
    if (up) up.onfinish = done; else done();
    setTimeout(done, 700);
  }
  function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); } }
  el.addEventListener('click', function (e) { if (e.target.closest('.preloader-sound')) return; skip(); });
  d.addEventListener('keydown', onKey, true);
  // Qualquer intenção de rolagem ou toque do visitante abre o site na hora
  w.addEventListener('wheel', function () { if (!finished) skip(); }, { passive: true, once: true });
  w.addEventListener('touchmove', function () { if (!finished) skip(); }, { passive: true, once: true });

  function play(withSoundTry) {
    runId++; finishing = false; reset();
    var prep = withSoundTry ? tryResume() : Promise.resolve(ctx && ctx.state === 'running');
    return prep.then(function (running) {
      soundOn = !!running;
      return Promise.race([buffersReady, new Promise(function (r) { setTimeout(r, 900); })]);
    }).then(function () {
      if (finished) return;
      schedule();
      playCues(ctx ? ctx.currentTime + 0.03 : 0);
      if (soundBtn) soundBtn.hidden = soundOn || !ctx;
    });
  }
  if (soundBtn) soundBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!ctx) return;
    ctx.resume().then(function () {
      soundBtn.hidden = true; soundOn = ctx.state === 'running';
      if (finishing || finished) return;
      runId++; reset();
      schedule(); playCues(ctx.currentTime + 0.03);
    });
  });

  w.SoftPreloader = { skip: skip, timeline: T, soundOn: function () { return soundOn; } };
  play(true);
})(window, document);
