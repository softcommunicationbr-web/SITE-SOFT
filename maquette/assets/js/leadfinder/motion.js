/* ============================================================
   LeadFinder · efeitos de movimento
   A tela é redesenhada a cada mudança; por isso cada efeito
   só toca na PRIMEIRA vez que algo aparece (ou quando o valor muda).
   Quem pede "reduzir movimento" no sistema vê tudo sem animação.
   ============================================================ */
(function (w, d) {
  'use strict';
  var LF = w.LF = w.LF || {};
  var mq = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var seen = new Set(), values = new Map(), widths = new Map(), started = new Map();

  var fx = LF.fx = {
    reduced: function () { return !!(mq && mq.matches); },
    /** true só na primeira vez que esta chave aparece. */
    first: function (key) { if (seen.has(key)) return false; seen.add(key); started.set(key, Date.now()); return true; },
    /** Marca sem animar (ex.: itens que já estavam na tela ao abrir). */
    mark: function (key) { seen.add(key); },

    /** Entrada em cascata: classe + atraso pelo índice (máx. 12 passos). */
    enter: function (node, key, i, kind) {
      if (!node || fx.reduced()) { if (key) seen.add(key); return node; }
      var isFirst = fx.first(key), t0 = started.get(key), elapsed = t0 ? Date.now() - t0 : 0;
      // a tela foi redesenhada no meio da animação: continua de onde parou em vez de cortar
      if (!isFirst && !(t0 && elapsed < 1500)) return node;
      node.classList.add(kind || 'fx-rise');
      node.style.setProperty('--fx-i', String(Math.min(i || 0, 12)));
      if (!isFirst) node.style.animationDelay = 'calc(var(--fx-i, 0) * 55ms - ' + elapsed + 'ms)';
      node.addEventListener('animationend', function () { node.classList.remove(kind || 'fx-rise'); node.style.removeProperty('--fx-i'); }, { once: true });
      return node;
    },

    /** Conta do valor anterior até o novo. `fmt` formata (ex.: porcentagem). */
    count: function (node, key, to, fmt, ms) {
      fmt = fmt || function (v) { return String(Math.round(v)); };
      var dur = ms || 700, now = Date.now(), st = values.get(key);
      if (typeof to !== 'number' || !isFinite(to)) { node.textContent = fmt(to); return node; }
      // novo alvo: começa do valor atual; mesmo alvo com animação em curso: continua
      if (!st || st.to !== to) st = { from: st ? st.to : 0, to: to, t0: now };
      values.set(key, st);
      if (fx.reduced() || st.from === st.to || now - st.t0 >= dur) { node.textContent = fmt(to); return node; }
      function frame() {
        if (values.get(key) !== st) return;
        var p = Math.min(1, (Date.now() - st.t0) / dur), e = 1 - Math.pow(1 - p, 3);
        node.textContent = fmt(st.from + (st.to - st.from) * e);
        if (p < 1 && node.isConnected !== false) w.requestAnimationFrame(frame);
      }
      frame();
      if (!node.isConnected) w.requestAnimationFrame(frame);
      return node;
    },

    /** Barra que cresce do tamanho anterior até o novo (em %). */
    grow: function (node, key, pct, delayMs) {
      var from = widths.has(key) ? widths.get(key) : 0;
      widths.set(key, pct);
      if (fx.reduced() || from === pct) { node.style.width = pct + '%'; return node; }
      node.style.width = from + '%';
      w.setTimeout(function () { w.requestAnimationFrame(function () { node.style.width = pct + '%'; }); }, delayMs || 30);
      return node;
    },

    /** Um "flash" curto num elemento (copiar, salvar). */
    flash: function (node, cls) {
      if (!node || fx.reduced()) return;
      cls = cls || 'fx-flash';
      node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls);
      node.addEventListener('animationend', function () { node.classList.remove(cls); }, { once: true });
    },

    /** Envelope voando a partir de um botão (envio de e-mail). */
    fly: function (from) {
      if (!from || fx.reduced()) return;
      var r = from.getBoundingClientRect();
      var s = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '22'); s.setAttribute('height', '22'); s.setAttribute('aria-hidden', 'true');
      s.setAttribute('class', 'fx-envelope');
      s.innerHTML = '<path d="M3 6h18v12H3z M3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';
      s.style.left = (r.left + r.width / 2 - 11) + 'px'; s.style.top = (r.top - 4) + 'px';
      d.body.appendChild(s);
      s.addEventListener('animationend', function () { s.remove(); }, { once: true });
    },

    /** Marcador deslizante embaixo da aba ativa. */
    ink: function (tabs) {
      if (!tabs) return;
      var ink = tabs.querySelector('.tab-ink');
      if (!ink) { ink = d.createElement('span'); ink.className = 'tab-ink'; ink.setAttribute('aria-hidden', 'true'); tabs.insertBefore(ink, tabs.firstChild); }
      var cur = tabs.querySelector('[aria-selected="true"]');
      if (!cur) return;
      ink.style.width = cur.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + cur.offsetLeft + 'px)';
      ink.style.height = cur.offsetHeight + 'px';
      ink.style.top = cur.offsetTop + 'px';
      if (!tabs.classList.contains('has-ink')) w.requestAnimationFrame(function () { tabs.classList.add('has-ink'); });
    }
  };
})(window, document);
