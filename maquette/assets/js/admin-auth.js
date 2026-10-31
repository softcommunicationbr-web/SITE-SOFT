/* ============================================================
   Soft Communication · Login do Painel (/admin)
   Login real do Supabase Auth: e-mail + senha ou Google.
   Só entra quem está na lista do banco (public.portfolio_admins),
   conferida no servidor pela função public.admin_eh_permitido().
   Uma sessão só serve para o painel inteiro e para a prospecção.
   Ver ferramentas/admin_login.sql.
   ============================================================ */
(function (w, d) {
  'use strict';

  var SUPABASE_URL = 'https://xvabghgvrhpnyywpmodb.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YWJnaGd2cmhwbnl5d3Btb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTgwNTEsImV4cCI6MjEwNzMzNDA1MX0.d0CNiaTYEnpsCY4N9qS6HNIxa3u7DYtzAOErvZHzC0w';
  var KEY = 'soft_admin_session_v1';
  var root = (d.documentElement.getAttribute('data-root') || '../');

  /* ---------- sessão (some ao fechar a aba) ---------- */
  function read() {
    try {
      var s = JSON.parse(w.sessionStorage.getItem(KEY) || 'null');
      return s && s.ok === true && typeof s.access_token === 'string' && s.refresh_token ? s : null;
    } catch (e) { return null; }
  }
  function save(s) {
    try {
      if (s) w.sessionStorage.setItem(KEY, JSON.stringify(s));
      else { w.sessionStorage.removeItem(KEY); w.sessionStorage.removeItem('soft_admin_session_auth_v1'); }
    } catch (e) { /* ignora */ }
  }
  function fromTokens(j, email) {
    return {
      ok: true,
      access_token: j.access_token,
      refresh_token: j.refresh_token || '',
      expires_at: +j.expires_at || (Math.floor(Date.now() / 1000) + (+j.expires_in || 3600)),
      email: (j.user && j.user.email) || email || ''
    };
  }

  function api(path, opts) {
    opts = opts || {};
    var h = { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' };
    if (opts.token) h.Authorization = 'Bearer ' + opts.token;
    return fetch(SUPABASE_URL + path, { method: opts.method || 'POST', headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, status: r.status, data: j }; });
      }, function () { throw new Error('Sem conexão com o servidor. Tente de novo.'); });
  }

  /* Confere no servidor se este e-mail pode usar o painel. */
  function checkAllowed(tokens) {
    return api('/rest/v1/rpc/admin_eh_permitido', { token: tokens.access_token, body: {} }).then(function (r) {
      if (r.ok && r.data === true) return tokens;
      api('/auth/v1/logout', { token: tokens.access_token });
      throw new Error('Este e-mail não tem acesso ao painel.');
    });
  }

  function finish(j, email) {
    return checkAllowed(j).then(function () {
      var s = fromTokens(j, email);
      save(s);
      return s;
    });
  }

  function loginPassword(email, password) {
    email = String(email || '').trim().toLowerCase();
    if (!email || !password) return Promise.reject(new Error('Preencha e-mail e senha.'));
    return api('/auth/v1/token?grant_type=password', { body: { email: email, password: password } }).then(function (r) {
      if (r.status === 429) throw new Error('Muitas tentativas. Aguarde alguns minutos.');
      if (!r.ok || !r.data || !r.data.access_token) throw new Error('E-mail ou senha incorretos.');
      return finish(r.data, email);
    });
  }

  function loginGoogle() {
    var back = w.location.origin + w.location.pathname;
    w.location.assign(SUPABASE_URL + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(back));
  }

  /* Volta do Google: os tokens chegam no endereço (#access_token=...). */
  function consumeHash() {
    var h = w.location.hash || '';
    if (h.indexOf('access_token=') < 0 && h.indexOf('error') < 0) return null;
    var p = {};
    h.replace(/^#/, '').split('&').forEach(function (kv) {
      var a = kv.split('=');
      try { p[a[0]] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); } catch (e) { /* ignora */ }
    });
    try { w.history.replaceState(null, '', w.location.pathname + w.location.search); } catch (e) { /* ignora */ }
    if (p.error_description || p.error) return Promise.reject(new Error('O Google não liberou o acesso: ' + (p.error_description || p.error)));
    if (!p.access_token) return null;
    return api('/auth/v1/user', { method: 'GET', token: p.access_token }).then(function (r) {
      return finish({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: p.expires_in, expires_at: p.expires_at, user: r.data }, r.data && r.data.email);
    });
  }

  /* Token válido; renova sozinho quando falta menos de 1 minuto. */
  var refreshing = null;
  function token() {
    var s = read();
    if (!s) return Promise.reject(new Error('Sessão expirada. Entre novamente.'));
    if (s.expires_at * 1000 > Date.now() + 60000) return Promise.resolve(s.access_token);
    if (refreshing) return refreshing;
    refreshing = api('/auth/v1/token?grant_type=refresh_token', { body: { refresh_token: s.refresh_token } }).then(function (r) {
      refreshing = null;
      if (!r.ok || !r.data || !r.data.access_token) { save(null); lock('Sessão expirada. Entre novamente.'); throw new Error('Sessão expirada. Entre novamente.'); }
      var n = fromTokens(r.data, s.email);
      save(n);
      return n.access_token;
    }, function (e) { refreshing = null; throw e; });
    return refreshing;
  }

  function session() { return read(); }
  function isAuth() { return !!read(); }

  function logout() {
    var s = read();
    if (s) api('/auth/v1/logout', { token: s.access_token }).catch(function () {});
    save(null);
    try { w.localStorage.removeItem('soft_leads_session_v1'); } catch (e) { /* ignora */ }
    setTimeout(function () { w.location.reload(); }, 150);
  }

  /* ---------- tela de login ---------- */
  function el(tag, attrs, text) {
    var e = d.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text) e.textContent = text;
    return e;
  }

  function lock(msg) {
    d.documentElement.classList.add('admin-locked');
    if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', function () { gate(msg); }); return; }
    gate(msg);
  }

  function gate(msg) {
    var old = d.getElementById('admin-auth-gate');
    if (old) { showErr(msg); return; }

    var g = el('div', { id: 'admin-auth-gate', class: 'admin-auth-overlay' });
    g.innerHTML =
      '<div class="admin-auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-card-title">' +
        '<div class="admin-auth-brand"><img src="' + root + 'assets/brand/soft-horizontal-creme.svg" alt="Soft Communication" width="140" height="45"></div>' +
        '<div class="admin-auth-header">' +
          '<span class="tag">SOFT &amp; CO. · Acesso Restrito</span>' +
          '<h2 class="a-title" id="auth-card-title" style="margin-top:12px;font-size:24px;color:#17110E;">Painel Administrativo</h2>' +
          '<p class="small" style="color:#5C4E44;margin-top:8px;">Entre com a conta autorizada.</p>' +
        '</div>' +
        '<form id="admin-auth-form" class="a-form" style="margin-top:24px;" novalidate>' +
          '<div class="field"><label for="admin-email-input" style="color:#3B2A20;">E-mail</label>' +
            '<input class="input" id="admin-email-input" type="email" autocomplete="username" required maxlength="200" style="font-size:16px;"></div>' +
          '<div class="field" style="margin-top:12px;"><label for="admin-pass-input" style="color:#3B2A20;">Senha</label>' +
            '<input class="input" id="admin-pass-input" type="password" autocomplete="current-password" required maxlength="200" style="font-size:16px;"></div>' +
          '<p class="admin-auth-error small" id="admin-auth-error" role="alert" style="color:#B91C1C;margin-top:12px;" hidden></p>' +
          '<div class="actions" style="margin-top:20px;"><button class="btn btn-primary btn-block" type="submit" id="admin-auth-btn" style="width:100%;">Entrar</button></div>' +
          '<div style="margin:16px 0;text-align:center;color:#8A7A6E;font-size:12px;">ou</div>' +
          '<button class="btn btn-block" type="button" id="admin-google-btn" style="width:100%;border:1px solid #CFC3B8;background:#fff;color:#17110E;">Entrar com Google</button>' +
          '<div style="margin-top:20px;text-align:center;">' +
            '<a href="' + root + 'index.html" style="color:#3B2A20;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">← Voltar para o site</a>' +
          '</div>' +
        '</form>' +
      '</div>';
    d.body.appendChild(g);

    var form = d.getElementById('admin-auth-form');
    var email = d.getElementById('admin-email-input');
    var pass = d.getElementById('admin-pass-input');
    var btn = d.getElementById('admin-auth-btn');
    showErr(msg);
    email.focus();

    function done() {
      d.documentElement.classList.remove('admin-locked');
      w.location.reload();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      btn.disabled = true; btn.textContent = 'Verificando...'; showErr('');
      loginPassword(email.value, pass.value).then(done, function (er) {
        showErr(er.message); pass.value = ''; pass.focus();
      }).then(function () { btn.disabled = false; btn.textContent = 'Entrar'; });
    });
    d.getElementById('admin-google-btn').addEventListener('click', loginGoogle);
  }

  function showErr(t) {
    var e = d.getElementById('admin-auth-error');
    if (!e) return;
    e.hidden = !t; e.textContent = t || '';
  }

  /* ---------- início ---------- */
  var back = consumeHash();
  if (back) {
    d.documentElement.classList.add('admin-locked');
    back.then(function () { d.documentElement.classList.remove('admin-locked'); w.location.reload(); },
      function (er) { save(null); lock(er.message); });
  } else if (!isAuth()) {
    save(null);
    lock();
  }

  d.addEventListener('DOMContentLoaded', function () {
    var sideLogout = d.querySelector('.a-side-foot button, [data-admin-logout]');
    if (sideLogout) {
      sideLogout.removeAttribute('data-mock-action');
      sideLogout.addEventListener('click', function (e) { e.preventDefault(); logout(); });
    }
  });

  w.AdminAuth = {
    isAuth: isAuth,
    session: session,
    token: token,
    loginPassword: loginPassword,
    loginGoogle: loginGoogle,
    lock: function (msg) { save(null); lock(msg); },
    logout: logout
  };
})(window, document);
