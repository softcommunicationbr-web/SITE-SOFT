/* ============================================================
   LeadFinder (porte estático) · notificações (toast + sino)
   Porte de lib/notify.tsx: histórico no localStorage, toasts que
   somem sozinhos, sino com badge, captura global de erros e envio
   de bugs ao servidor (/bug). Tudo escrito com textContent.
   ============================================================ */
(function (w, d) {
  'use strict';

  var LF = w.LF = w.LF || {};
  var el = LF.el;

  var LOG_KEY = 'leadfinder-log-v1';
  var MAX_LOG = 50;
  var MAX_REPORTS_PER_SESSION = 10;
  var LEVEL_LABEL = { info: 'Info', success: 'OK', warn: 'Aviso', error: 'Bug' };

  var log = [];
  var toasts = [];
  var lastKey = { key: '', at: 0 };
  var reports = 0;
  var open = false;
  var ui = { toasts: null, bell: null, btn: null, panel: null };
  var sendBug = null; // função injetada pelo app (precisa do token do usuário)

  function loadLog() {
    try { var v = JSON.parse(w.localStorage.getItem(LOG_KEY) || '[]'); return Array.isArray(v) ? v.slice(0, MAX_LOG).filter(function (x) { return x && typeof x === 'object'; }) : []; } catch (e) { return []; }
  }
  function saveLog() { try { w.localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) { /* log é opcional */ } }
  function txt(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }

  function dismiss(id) { toasts = toasts.filter(function (x) { return x.id !== id; }); renderToasts(); }

  /** notify({level, title, detail?, source?}) — igual ao original. */
  function notify(n) {
    var key = n.level + '|' + n.title + '|' + (n.detail || '');
    var now = Date.now();
    if (lastKey.key === key && now - lastKey.at < 3000) return; // evita flood do mesmo aviso
    lastKey = { key: key, at: now };
    var item = { level: n.level, title: txt(n.title), detail: n.detail ? txt(n.detail) : undefined, source: n.source, id: now + '-' + Math.random().toString(36).slice(2, 7), at: now, read: false };
    log = [item].concat(log).slice(0, MAX_LOG); saveLog();
    toasts = [item].concat(toasts).slice(0, 4);
    renderToasts(); renderBell();
    w.setTimeout(function () { dismiss(item.id); }, n.level === 'error' ? 12000 : n.level === 'warn' ? 8000 : 5000); // some da tela, mas fica no histórico do sino
    if (n.level === 'error' && reports < MAX_REPORTS_PER_SESSION && sendBug) {
      reports += 1;
      // envia ao servidor (log + webhook). Falha aqui é ignorada de propósito: nunca gera novo alerta (evita loop).
      try { Promise.resolve(sendBug({ title: item.title, detail: item.detail, source: n.source, page: w.location.pathname })).catch(function () {}); } catch (e) { /* ignora */ }
    }
  }

  function markAllRead() { log = log.map(function (x) { return Object.assign({}, x, { read: true }); }); saveLog(); renderBell(); }
  function clearLog() { log = []; saveLog(); renderBell(); }
  function copyReport() {
    var lines = log.map(function (x) { return '[' + new Date(x.at).toLocaleString('pt-BR') + '] ' + String(x.level).toUpperCase() + ' ' + (x.source ? '(' + x.source + ') ' : '') + x.title + (x.detail ? ' — ' + x.detail : ''); });
    var text = 'LeadFinder — relatório de bugs\nURL: ' + w.location.href + '\nNavegador: ' + navigator.userAgent + '\n\n' + (lines.join('\n') || '(sem registros)');
    var done = function () { notify({ level: 'success', title: 'Relatório copiado', detail: 'Cole na conversa para eu corrigir.' }); };
    var fail = function () { notify({ level: 'warn', title: 'Não consegui copiar', detail: 'O navegador bloqueou a área de transferência.' }); };
    try { navigator.clipboard.writeText(text).then(done, fail); } catch (e) { fail(); }
  }

  /* ---------- toasts ---------- */
  function renderToasts() {
    if (!ui.toasts) return;
    ui.toasts.textContent = '';
    toasts.forEach(function (t) {
      ui.toasts.appendChild(el('div', { class: 'toast ' + t.level, role: t.level === 'error' || t.level === 'warn' ? 'alert' : 'status' }, [
        el('span', { class: 'toast-dot', 'aria-hidden': 'true' }),
        el('div', { class: 'toast-body' }, [el('strong', { text: t.title }), t.detail ? el('span', { text: t.detail }) : null]),
        el('button', { class: 'toast-x', type: 'button', 'aria-label': 'Fechar notificação', text: '×', on: { click: function () { dismiss(t.id); } } })
      ]));
    });
  }

  /* ---------- sino ---------- */
  function unread() { return log.filter(function (x) { return !x.read && (x.level === 'error' || x.level === 'warn'); }).length; }

  function renderBell() {
    if (!ui.btn) return;
    var u = unread();
    ui.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    ui.btn.setAttribute('aria-label', 'Notificações' + (u ? ', ' + u + ' novas' : ''));
    var badge = ui.btn.querySelector('.badge');
    if (u > 0) {
      if (!badge) { badge = el('span', { class: 'badge', 'data-testid': 'bell-badge' }); ui.btn.appendChild(badge); }
      badge.textContent = u > 9 ? '9+' : String(u);
    } else if (badge) badge.remove();

    if (!open) { if (ui.panel) { ui.panel.remove(); ui.panel = null; } return; }
    if (!ui.panel) { ui.panel = el('div', { class: 'notif-panel glass', role: 'dialog', 'aria-label': 'Histórico de notificações' }); ui.bell.appendChild(ui.panel); }
    var p = ui.panel; p.textContent = '';
    p.appendChild(el('div', { class: 'notif-head' }, [
      el('strong', { text: 'Notificações e bugs' }),
      el('span', null, [
        el('button', { class: 'linkbtn', type: 'button', text: 'Copiar relatório', on: { click: copyReport } }), ' ',
        el('button', { class: 'linkbtn', type: 'button', text: 'Limpar', on: { click: clearLog } })
      ])
    ]));
    if (log.length) {
      var ul = el('ul', { class: 'notif-list' });
      log.forEach(function (x) {
        ul.appendChild(el('li', { class: LEVEL_LABEL[x.level] ? x.level : 'info' }, [
          el('span', { class: 'lvl', text: LEVEL_LABEL[x.level] || 'Info' }),
          el('div', null, [
            el('strong', { text: txt(x.title) }),
            x.detail ? el('div', { class: 'd', text: txt(x.detail) }) : null,
            el('div', { class: 't', text: new Date(x.at).toLocaleTimeString('pt-BR') + (x.source ? ' · ' + txt(x.source) : '') })
          ])
        ]));
      });
      p.appendChild(ul);
    } else {
      p.appendChild(el('div', { class: 'notif-empty', text: 'Nada por aqui. Quando algo der errado, aparece aqui e em um aviso na tela.' }));
    }
  }

  function setOpen(v) {
    open = v;
    if (open) markAllRead(); else renderBell();
  }

  /** Liga a UI: container dos toasts, o wrapper .bell e o botão dele. */
  function mount(opts) {
    ui.toasts = opts.toasts; ui.bell = opts.bell; ui.btn = opts.button; sendBug = opts.sendBug || null;
    log = loadLog();
    ui.btn.addEventListener('click', function () { setOpen(!open); });
    d.addEventListener('mousedown', function (e) { if (open && ui.bell && !ui.bell.contains(e.target)) setOpen(false); });
    d.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') setOpen(false); });
    renderToasts(); renderBell();
  }

  // Captura global: qualquer exceção ou promessa rejeitada vira notificação.
  w.addEventListener('error', function (e) {
    var m = e && e.message ? String(e.message) : '';
    if (!m || /ResizeObserver loop/i.test(m) || m === 'Script error.') return;
    notify({ level: 'error', title: 'Erro inesperado na tela', detail: m, source: 'window.onerror' });
  });
  w.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    notify({ level: 'error', title: 'Falha inesperada em segundo plano', detail: r instanceof Error ? r.message : String(r), source: 'unhandledrejection' });
  });

  LF.notify = notify;
  LF.notifyMount = mount;
})(window, document);
