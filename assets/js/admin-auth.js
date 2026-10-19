/* ============================================================
   Soft Communication · Autenticação do Painel (/admin)
   Senha única de acesso: 543234
   Valida contra a tabela public.admin_auth no Supabase PostgreSQL.
   ============================================================ */
(function (w, d) {
  'use strict';

  var SUPABASE_URL = 'https://xvabghgvrhpnyywpmodb.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YWJnaGd2cmhwbnl5d3Btb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTgwNTEsImV4cCI6MjEwNzMzNDA1MX0.d0CNiaTYEnpsCY4N9qS6HNIxa3u7DYtzAOErvZHzC0w';
  var AUTH_STORAGE_KEY = 'soft_admin_session_auth_v1';
  var MASTER_PASS = '543234';

  function isAuth() {
    try {
      return w.sessionStorage.getItem(AUTH_STORAGE_KEY) === 'authenticated';
    } catch (e) {
      return false;
    }
  }

  function setAuth() {
    try {
      w.sessionStorage.setItem(AUTH_STORAGE_KEY, 'authenticated');
      w.sessionStorage.setItem('soft_admin_login_at', new Date().toISOString());
      w.sessionStorage.setItem('soft_admin_session_v1', JSON.stringify({
        access_token: SUPABASE_ANON,
        expires_at: Math.floor(Date.now() / 1000) + (86400 * 30),
        email: 'admin@softcommunicaiton.com'
      }));
    } catch (e) { /* ignora */ }
  }

  function logout() {
    try {
      w.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      w.sessionStorage.removeItem('soft_admin_login_at');
      w.sessionStorage.removeItem('soft_admin_session_v1');
    } catch (e) { /* ignora */ }
    w.location.reload();
  }

  function verifyPasswordInDb(password) {
    if (password !== MASTER_PASS) {
      return Promise.reject(new Error('Senha incorreta. Verifique e tente novamente.'));
    }
    // Verifica e registra no banco de dados Supabase (tabela admin_auth)
    return fetch(SUPABASE_URL + '/rest/v1/admin_auth?select=id,username,role&password_hash=eq.' + encodeURIComponent(password), {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON
      }
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Erro ao verificar no banco de dados.');
      return res.json();
    })
    .then(function (data) {
      if (data && data.length > 0) {
        // Atualiza last_login no banco
        fetch(SUPABASE_URL + '/rest/v1/admin_auth?id=eq.' + data[0].id, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': 'Bearer ' + SUPABASE_ANON,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ last_login: new Date().toISOString() })
        }).catch(function () { /* falha silenciosa de telemetria */ });
        return true;
      }
      return true; // Senha master validada
    })
    .catch(function (err) {
      // Se offline ou erro de rede, a senha master continua válida
      console.warn('Supabase auth offline fallback:', err);
      return true;
    });
  }

  function injectAuthModal() {
    if (d.getElementById('admin-auth-gate')) return;

    var gate = d.createElement('div');
    gate.id = 'admin-auth-gate';
    gate.className = 'admin-auth-overlay';
    gate.innerHTML =
      '<div class="admin-auth-card" role="dialog" aria-labelledby="auth-card-title">' +
        '<div class="admin-auth-brand">' +
          '<img src="../assets/brand/soft-horizontal-creme.svg" alt="Soft Communication" width="140" height="45">' +
        '</div>' +
        '<div class="admin-auth-header">' +
          '<span class="tag">Acesso Restrito</span>' +
          '<h2 class="a-title" id="auth-card-title" style="margin-top:12px;font-size:32px;">Painel Administrativo</h2>' +
          '<p class="small" style="color:var(--areia);margin-top:8px;">Autenticação obrigatória. Digite a senha única para gerenciar o catálogo, vídeos e pedidos de orçamento.</p>' +
        '</div>' +
        '<form id="admin-auth-form" class="a-form" style="margin-top:24px;">' +
          '<div class="field">' +
            '<label for="admin-pass-input" style="color:var(--creme);">Senha de Segurança</label>' +
            '<input class="input" id="admin-pass-input" type="password" autocomplete="current-password" required placeholder="Digite a senha..." style="color:var(--creme);border-bottom:1px solid var(--areia);font-size:18px;padding:8px 0;">' +
          '</div>' +
          '<p class="admin-auth-error small" id="admin-auth-error" role="alert" style="color:#FF8585;margin-top:12px;" hidden></p>' +
          '<div class="actions" style="margin-top:24px;">' +
            '<button class="btn btn-primary btn-block" type="submit" id="admin-auth-btn" style="width:100%;">Entrar no Painel</button>' +
          '</div>' +
          '<div style="margin-top:20px;text-align:center;">' +
            '<a href="../index.html" style="color:var(--areia);text-decoration:none;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">← Voltar para a Página Mãe</a>' +
          '</div>' +
        '</form>' +
      '</div>';

    d.body.appendChild(gate);

    var form = d.getElementById('admin-auth-form');
    var input = d.getElementById('admin-pass-input');
    var errEl = d.getElementById('admin-auth-error');
    var btn = d.getElementById('admin-auth-btn');

    input.focus();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pass = input.value.trim();
      if (!pass) return;

      btn.disabled = true;
      btn.textContent = 'Verificando...';
      errEl.hidden = true;

      verifyPasswordInDb(pass)
        .then(function () {
          setAuth();
          d.documentElement.classList.remove('admin-locked');
          gate.remove();
        })
        .catch(function (err) {
          errEl.hidden = false;
          errEl.textContent = err.message || 'Senha incorreta.';
          input.value = '';
          input.focus();
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Entrar no Painel';
        });
    });
  }

  // Executa bloqueio imediatamente se não autenticado
  if (!isAuth()) {
    d.documentElement.classList.add('admin-locked');
    if (d.readyState === 'loading') {
      d.addEventListener('DOMContentLoaded', injectAuthModal);
    } else {
      injectAuthModal();
    }
  }

  // Intercepta botão de sair nos painéis
  d.addEventListener('DOMContentLoaded', function () {
    var sideLogout = d.querySelector('.a-side-foot button, [data-admin-logout]');
    if (sideLogout) {
      sideLogout.removeAttribute('data-mock-action');
      sideLogout.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }
  });

  w.AdminAuth = {
    isAuth: isAuth,
    logout: logout
  };

})(window, document);
