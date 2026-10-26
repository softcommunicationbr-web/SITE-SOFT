/* ============================================================
   Soft Communication · Painel Administrativo (Sessão & Catálogo)
   ============================================================ */
(function (w, d) {
  'use strict';
  var C = w.SoftCatalog, A = C && C.Admin;
  var toastEl = null, toastT = null;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function toast(msg) {
    toastEl = toastEl || d.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'text/plain' }), a = d.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; d.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* Banner superior desativado para manter o layout limpo */
  function banner() {
    var el = d.getElementById('a-mode');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-core]'); if (!b) return;
    var act = b.getAttribute('data-core');
    if (act === 'export') { download('catalog.js', A.exportJs(), 'text/javascript'); toast('Catálogo exportado.'); }
    if (act === 'discard') { A.discardLocal(); toast('Alterações descartadas.'); setTimeout(function () { w.location.reload(); }, 600); }
    if (act === 'logout') { A.logout(); w.location.reload(); }
    if (act === 'seed') { A.save().then(function () { toast('Catálogo publicado.'); setTimeout(function () { w.location.reload(); }, 800); }, function (er) { toast('Não foi possível publicar: ' + er.message); }); }
  });

  var sideLogout = d.querySelector('.a-side-foot button');
  if (sideLogout) {
    sideLogout.removeAttribute('data-mock-action');
    sideLogout.addEventListener('click', function () {
      if (C && C.remoteOn && C.remoteOn()) { A.logout(); w.location.reload(); }
    });
  }

  /* ---------- login ---------- */
  function loginDialog(err) {
    var dlg = d.getElementById('a-login');
    if (!dlg) {
      dlg = d.createElement('dialog'); dlg.id = 'a-login'; dlg.className = 'a-login'; dlg.setAttribute('aria-labelledby', 'a-login-title');
      dlg.innerHTML = '<form class="a-form" id="a-login-form">' +
        '<h2 class="a-heading" id="a-login-title">Entrar no painel</h2>' +
        '<p class="small">Digite a senha de acesso para continuar.</p>' +
        '<div class="field"><label for="a-login-pass">Senha</label>' +
        '<input class="input" id="a-login-pass" type="password" autocomplete="current-password" required placeholder="Digite a senha..." autofocus style="font-size:16px;"></div>' +
        '<p class="a-login-msg small" id="a-login-msg" role="alert" hidden></p>' +
        '<div class="actions" style="margin-top:16px;"><button class="btn btn-primary btn-block" type="submit" style="width:100%;">Entrar</button></div></form>';
      d.body.appendChild(dlg);
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); });
      var msg = function (t, ok) { var m = d.getElementById('a-login-msg'); m.hidden = !t; m.textContent = t || ''; m.classList.toggle('is-ok', !!ok); };
      d.getElementById('a-login-form').addEventListener('submit', function (e) {
        e.preventDefault(); msg('');
        var pass = d.getElementById('a-login-pass').value.trim();
        if (!pass) { msg('Digite a senha para entrar.'); return; }
        A.login(pass).then(function () {
          try { w.sessionStorage.setItem('soft_admin_session_auth_v1', 'authenticated'); } catch (e) {}
          w.location.reload();
        }, function () { msg('Senha incorreta. Tente novamente.'); });
      });
    }
    if (err) { var m = d.getElementById('a-login-msg'); m.hidden = false; m.textContent = err; }
    if (!dlg.open) dlg.showModal();
  }

  /* ---------- início ---------- */
  var readyCbs = [], info = null;
  function onReady(fn) { if (info) fn(info); else readyCbs.push(fn); }
  if (!A) return;
  A.init().then(function (r) {
    banner(r);
    if (r.needsLogin) { loginDialog(r.error); return; }
    info = r;
    d.querySelectorAll('[data-video-count]').forEach(function (el) { el.textContent = A.items().length; });
    readyCbs.splice(0).forEach(function (fn) { fn(info); });
  }, function () { banner({ mode: 'local' }); });

  function token() { var s = A.session(); return (s && s.access_token) || ''; }
  w.AdminUI = { toast: toast, onReady: onReady, download: download, esc: esc, banner: banner, token: token };
})(window, document);
