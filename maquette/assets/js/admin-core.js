/* ============================================================
   Soft Communication · painel: modo, login e sessão (comum às páginas)
   Local  = sem Supabase configurado: rascunho só neste navegador.
   Remoto = Supabase ligado: exige login; salvar publica na hora.
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

  /* ---------- banner de modo ---------- */
  function banner(info) {
    var host = d.querySelector('.a-main'); if (!host) return;
    var el = d.getElementById('a-mode');
    if (!el) {
      el = d.createElement('div'); el.id = 'a-mode'; el.className = 'a-notice a-mode'; el.setAttribute('role', 'note');
      var mh = host.querySelector('.a-mobile-head');
      if (mh && mh.nextSibling) host.insertBefore(el, mh.nextSibling); else host.insertBefore(el, host.firstChild);
    }
    var h, onMedia = /mediatheque/.test(w.location.pathname);
    if (info.mode === 'local') {
      h = '<span class="tag">Modo local</span><span>As alterações ficam só neste navegador (rascunho). Para publicar para todos, conecte o Supabase: veja <strong>ferramentas/SETUP_SUPABASE.md</strong>.</span>' +
        (info.draft ? '<button type="button" class="btn btn-outline btn-small" data-core="discard">Descartar rascunho</button>' : '');
    } else if (info.seed) {
      h = '<span class="tag">Supabase</span><span>Conectado como ' + esc(info.email) + '. A tabela está vazia: salve qualquer vídeo para publicar o catálogo inicial (52 vídeos).</span>' +
        '<button type="button" class="btn btn-secondary btn-small" data-core="seed">Publicar catálogo inicial</button><button type="button" class="btn btn-outline btn-small" data-core="logout">Sair</button>';
    } else {
      h = '<span class="tag">Supabase</span><span>Conectado como ' + esc(info.email) + '. As alterações vão para o site na hora.</span>' +
        '<button type="button" class="btn btn-outline btn-small" data-core="logout">Sair</button>';
    }
    el.innerHTML = h;
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-core]'); if (!b) return;
    var act = b.getAttribute('data-core');
    if (act === 'export') { download('catalog.js', A.exportJs(), 'text/javascript'); toast('catalog.js exportado. Para publicar, substitua assets/data/catalog.js do site por este arquivo.'); }
    if (act === 'discard') { A.discardLocal(); toast('Rascunho descartado. Voltando ao catálogo padrão.'); setTimeout(function () { w.location.reload(); }, 600); }
    if (act === 'logout') { A.logout(); w.location.reload(); }
    if (act === 'seed') { A.save().then(function () { toast('Catálogo inicial publicado no Supabase.'); setTimeout(function () { w.location.reload(); }, 800); }, function (er) { toast('Não foi possível publicar: ' + er.message); }); }
  });
  var sideLogout = d.querySelector('.a-side-foot button');
  if (sideLogout) {
    sideLogout.removeAttribute('data-mock-action');
    sideLogout.addEventListener('click', function () {
      if (C.remoteOn()) { A.logout(); w.location.reload(); } else toast('No modo local não há login: nada a encerrar.');
    });
  }

  /* ---------- login ---------- */
  function loginDialog(err) {
    var dlg = d.getElementById('a-login');
    if (!dlg) {
      dlg = d.createElement('dialog'); dlg.id = 'a-login'; dlg.className = 'a-login'; dlg.setAttribute('aria-labelledby', 'a-login-title');
      dlg.innerHTML = '<form class="a-form" id="a-login-form">' +
        '<h2 class="a-heading" id="a-login-title">Entrar no painel</h2>' +
        '<p class="small">Digite a senha de administrador para gerenciar o catálogo, vídeos e clientes.</p>' +
        '<div class="field"><label for="a-login-pass">Senha de Acesso</label>' +
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
        }, function (er) { msg('Senha incorreta. Tente novamente.'); });
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
    var n = A.items().filter(function (i) { return i.active && i.placement !== 'library'; }).length;
    d.querySelectorAll('[data-video-count]').forEach(function (el) { el.textContent = A.items().length; });
    readyCbs.splice(0).forEach(function (fn) { fn(info); });
  }, function (er) { banner({ mode: 'local' }); toast('Erro ao iniciar o painel: ' + er.message); });

  function token() { var s = A.session(); return (s && s.access_token) || ''; }
  w.AdminUI = { toast: toast, onReady: onReady, download: download, esc: esc, banner: banner, token: token };
})(window, document);
