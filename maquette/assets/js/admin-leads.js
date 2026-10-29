/* ============================================================
   Soft Communication · Prospecção no painel (admin/leads.html)
   Front da Edge Function supabase/functions/leadfinder.
   - Login real do Supabase Auth (link mágico, sem cadastro aberto).
   - Nenhuma chave paga no navegador: Google e Claude só no servidor.
   - Tudo que vem de fora é escrito com textContent (sem innerHTML).
   ============================================================ */
(function (w, d) {
  'use strict';

  var CFG = w.SOFT_CONFIG || {};
  var URL_SB = (CFG.supabaseUrl || '').replace(/\/$/, '');
  var ANON = CFG.supabaseAnonKey || '';
  var FN = URL_SB + '/functions/v1/leadfinder';
  var KEY = 'soft_leads_session_v1';
  var STATUSES = ['Novo', 'Contato pendente', 'Contatado', 'Respondeu', 'Reunião marcada', 'Cliente', 'Descartado'];

  var st = { session: null, leads: {}, order: [], filter: 'Todos', lang: 'fr', busy: {} };

  function $(id) { return d.getElementById(id); }
  function el(tag, attrs, kids) {
    var n = d.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else n.setAttribute(k, v === true ? '' : String(v));
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? d.createTextNode(c) : c); });
    return n;
  }
  function msg(id, text, kind) { var m = $(id); if (!m) return; m.textContent = text || ''; m.setAttribute('data-kind', kind || ''); }
  function safeUrl(u) { try { var x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.toString() : null; } catch (e) { return null; } }

  /* ---------- sessão (Supabase Auth) ---------- */
  function save(s) { st.session = s; try { if (s) w.localStorage.setItem(KEY, JSON.stringify(s)); else w.localStorage.removeItem(KEY); } catch (e) { /* ignora */ } }
  function load() { try { return JSON.parse(w.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }

  function consumeHash() {
    var h = w.location.hash || '';
    if (h.indexOf('access_token=') < 0 && h.indexOf('error') < 0) return;
    var p = {};
    h.replace(/^#/, '').split('&').forEach(function (kv) { var a = kv.split('='); p[a[0]] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); });
    try { w.history.replaceState(null, '', w.location.pathname + w.location.search); } catch (e) { /* ignora */ }
    if (p.error_description) { msg('lf-login-msg', 'Link inválido ou expirado: ' + p.error_description, 'err'); return; }
    if (p.access_token) save({ access_token: p.access_token, refresh_token: p.refresh_token || '', expires_at: Math.floor(Date.now() / 1000) + (+p.expires_in || 3600) });
  }

  function token() {
    var s = st.session;
    if (!s) return Promise.reject(new Error('Entre com seu e-mail.'));
    if (s.expires_at * 1000 > Date.now() + 60000) return Promise.resolve(s.access_token);
    if (!s.refresh_token) { save(null); return Promise.reject(new Error('Sessão expirada. Entre de novo.')); }
    return fetch(URL_SB + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.access_token) throw new Error('Sessão expirada. Entre de novo.'); return j; }); })
      .then(function (j) {
        save({ access_token: j.access_token, refresh_token: j.refresh_token || s.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600) });
        return j.access_token;
      }, function (e) { save(null); throw e; });
  }

  function sendLink(email) {
    var redirect = w.location.origin + w.location.pathname;
    return fetch(URL_SB + '/auth/v1/otp?redirect_to=' + encodeURIComponent(redirect), {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, create_user: false })
    }).then(function (r) { if (!r.ok && r.status !== 400 && r.status !== 422) throw new Error('Não foi possível enviar agora. Tente em instantes.'); });
  }

  /* ---------- chamadas ---------- */
  function api(action, payload) {
    return token().then(function (t) {
      var body = Object.assign({ action: action }, payload || {});
      return fetch(FN, { method: 'POST', headers: { Authorization: 'Bearer ' + t, apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { save(null); showLogin(); }
        if (!r.ok) throw new Error(j.error || ('Erro ' + r.status));
        return j;
      });
    });
  }
  function rest(method, path, body, prefer) {
    return token().then(function (t) {
      var h = { Authorization: 'Bearer ' + t, apikey: ANON, 'Content-Type': 'application/json' };
      if (prefer) h.Prefer = prefer;
      return fetch(URL_SB + '/rest/v1/' + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('Banco respondeu ' + r.status + (t ? ': ' + t.slice(0, 160) : '')); });
      return r.status === 204 ? null : r.json().catch(function () { return null; });
    });
  }

  /* ---------- pontuação (heurística do LeadFinder: quem tem reputação e não tem site sobe) ---------- */
  function score(l) {
    var rating = typeof l.nota === 'number' ? l.nota : 3, count = typeof l.avaliacoes === 'number' ? l.avaliacoes : 0;
    var raw = (rating / 5) * 45 + Math.min(25, Math.log10(count + 1) * 10) + (l.site ? 0 : 30);
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  /* ---------- carteira ---------- */
  function upsertLocal(data) {
    var id = data.place_id; if (!id) return;
    var cur = st.leads[id] || { place_id: id };
    Object.keys(data).forEach(function (k) { if (data[k] !== undefined) cur[k] = data[k]; });
    st.leads[id] = cur;
    if (st.order.indexOf(id) < 0) st.order.push(id);
  }

  function loadPortfolio() {
    return rest('GET', 'leadfinder_leads?select=*&order=atualizado_em.desc').then(function (rows) {
      (rows || []).forEach(function (r) { r.salvo = true; upsertLocal(r); });
      var ids = (rows || []).map(function (r) { return r.place_id; });
      var chunks = []; for (var i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));
      return chunks.reduce(function (p, c) {
        return p.then(function () { return api('details', { ids: c, lang: st.lang }); }).then(function (res) {
          (res.places || []).forEach(upsertLocal);
          (res.gone || []).forEach(function (g) { if (st.leads[g]) st.leads[g].sumiu = true; });
        });
      }, Promise.resolve());
    }).then(render);
  }

  function persist(id, patch) {
    var l = st.leads[id]; if (!l) return Promise.resolve();
    var row = { place_id: id, categoria: l.categoria || 'Outras empresas' };
    Object.keys(patch).forEach(function (k) { row[k] = patch[k]; l[k] = patch[k]; });
    if (!l.salvo) { row.status = l.status || 'Novo'; }
    return rest('POST', 'leadfinder_leads?on_conflict=place_id', row, 'resolution=merge-duplicates,return=minimal')
      .then(function () { l.salvo = true; render(); toast('Salvo na carteira.'); }, function (e) { toast(e.message); });
  }

  function removeLead(id) {
    if (!w.confirm('Remover esta empresa da carteira compartilhada?')) return;
    rest('DELETE', 'leadfinder_leads?place_id=eq.' + encodeURIComponent(id)).then(function () {
      var l = st.leads[id]; if (l) { l.salvo = false; l.status = 'Novo'; l.notas = null; l.ia = null; }
      render(); toast('Removida da carteira.');
    }, function (e) { toast(e.message); });
  }

  function analyze(id, question) {
    var l = st.leads[id]; if (!l || st.busy[id]) return;
    st.busy[id] = true; render();
    api('analyze', { lead: { place_id: id, nome: l.nome, categoria: l.categoria, endereco: l.endereco, nota: l.nota, avaliacoes: l.avaliacoes, site: l.site, telefone: l.telefone ? 'sim' : '', notas: l.notas }, question: question || undefined })
      .then(function (ai) { st.busy[id] = false; return persist(id, { ia: ai }); }, function (e) { st.busy[id] = false; render(); toast(e.message); });
  }

  /* ---------- tela ---------- */
  function toast(t) { var n = $('toast'); if (!n) return; n.textContent = t; n.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { n.hidden = true; }, 4000); }

  function renderFilter() {
    var box = $('lf-filter'); box.textContent = '';
    ['Todos'].concat(STATUSES).forEach(function (s) {
      var n = st.order.filter(function (id) { return s === 'Todos' || (st.leads[id].status || 'Novo') === s; }).length;
      box.appendChild(el('button', { type: 'button', class: 'btn btn-outline btn-small', 'aria-pressed': st.filter === s ? 'true' : 'false', text: s + ' (' + n + ')',
        on: { click: function () { st.filter = s; render(); } } }));
    });
  }

  function waLink(phone, text) {
    if (!phone || phone.trim().charAt(0) !== '+') return null;
    var digits = phone.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15 ? 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text || '') : null;
  }

  function row(l) {
    var id = l.place_id, sc = score(l);
    var head = el('div', { class: 'lf-row-head' }, [
      el('div', null, [
        el('div', { class: 'lf-name', text: l.nome || (l.sumiu ? 'Empresa não existe mais no Google' : 'Carregando…') }),
        el('div', { class: 'lf-meta', text: [l.categoria, l.endereco].filter(Boolean).join(' · ') }),
        el('div', { class: 'lf-meta', text: (typeof l.nota === 'number' ? '★ ' + l.nota + ' (' + (l.avaliacoes || 0) + ' avaliações)' : 'sem nota') + ' · ' + (l.site ? 'tem site' : 'sem site no Google') + (l.telefone ? ' · ' + l.telefone : '') })
      ]),
      el('span', { class: 'lf-score', text: 'PRIORIDADE ' + sc + (l.salvo ? ' · NA CARTEIRA' : '') })
    ]);

    var sel = el('select', { class: 'select', 'aria-label': 'Status de ' + (l.nome || id) });
    STATUSES.forEach(function (s) { var o = el('option', { value: s, text: s }); if ((l.status || 'Novo') === s) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { persist(id, { status: sel.value }); });

    var notes = el('textarea', { class: 'textarea', maxlength: '1000', 'aria-label': 'Notas sobre ' + (l.nome || id), style: 'min-height:60px' });
    notes.value = l.notas || '';
    var next = el('input', { class: 'input', type: 'date', 'aria-label': 'Próxima ação', value: l.proxima_acao || '' });
    var last = el('input', { class: 'input', type: 'date', 'aria-label': 'Último contato', value: l.ultimo_contato || '' });

    var grid = el('div', { class: 'lf-grid' }, [
      el('label', { class: 'small' }, ['Status', el('div', { class: 'select-wrap' }, [sel])]),
      el('label', { class: 'small' }, ['Próxima ação', next]),
      el('label', { class: 'small' }, ['Último contato', last])
    ]);

    var q = el('input', { class: 'input', type: 'text', maxlength: '500', placeholder: 'Pedido extra para a IA (opcional)', 'aria-label': 'Pedido extra para a IA' });
    var links = [];
    var maps = safeUrl(l.maps), site = safeUrl(l.site);
    if (maps) links.push(el('a', { class: 'btn btn-outline btn-small', href: maps, target: '_blank', rel: 'noopener noreferrer', text: 'Google Maps ↗' }));
    if (site) links.push(el('a', { class: 'btn btn-outline btn-small', href: site, target: '_blank', rel: 'noopener noreferrer nofollow', text: 'Site ↗' }));
    var wa = l.ia && waLink(l.telefone, l.ia.message);
    if (wa) links.push(el('a', { class: 'btn btn-outline btn-small', href: wa, target: '_blank', rel: 'noopener noreferrer', text: 'Abrir WhatsApp com a mensagem ↗' }));

    var actions = el('div', { class: 'lf-actions' }, [
      el('button', { type: 'button', class: 'btn btn-small', text: l.salvo ? 'Salvar notas e datas' : 'Salvar na carteira',
        on: { click: function () { persist(id, { notas: notes.value.slice(0, 1000) || null, proxima_acao: next.value || null, ultimo_contato: last.value || null }); } } }),
      el('button', { type: 'button', class: 'btn btn-secondary btn-small', disabled: st.busy[id] || !l.nome ? true : null, text: st.busy[id] ? 'Analisando…' : (l.ia ? 'Reanalisar com IA' : 'Analisar com IA'),
        on: { click: function () { analyze(id, q.value.trim()); } } }),
      l.salvo ? el('button', { type: 'button', class: 'btn btn-outline btn-small', text: 'Remover', on: { click: function () { removeLead(id); } } }) : null
    ].concat(links));

    var ai = null;
    if (l.ia) {
      ai = el('div', { class: 'lf-ai' }, [
        el('p', null, [el('strong', { text: 'IA · Nível ' + l.ia.tier + ' · encaixe ' + l.ia.fit + '/100' })]),
        el('p', { text: l.ia.reason }),
        el('p', null, [el('strong', { text: 'Oportunidade: ' }), l.ia.opportunity || '']),
        el('p', null, [el('strong', { text: 'Mensagem sugerida: ' }), l.ia.message || '']),
        l.ia.missing && l.ia.missing.length ? el('p', { class: 'small', text: 'Falta saber: ' + l.ia.missing.join('; ') }) : null,
        el('p', { class: 'small', text: 'Revise antes de enviar. Contato individual, sem disparo em massa.' })
      ]);
    }
    return el('article', { class: 'lf-row' }, [head, grid, el('label', { class: 'small', style: 'display:block;margin-top:10px;' }, ['Notas', notes]), q, actions, ai]);
  }

  function render() {
    renderFilter();
    var list = $('lf-list'); list.textContent = '';
    var ids = st.order.filter(function (id) { return st.filter === 'Todos' || (st.leads[id].status || 'Novo') === st.filter; });
    ids.sort(function (a, b) {
      var A = st.leads[a], B = st.leads[b];
      if (!!B.salvo !== !!A.salvo) return B.salvo ? 1 : -1;
      return score(B) - score(A);
    });
    if (!ids.length) { list.appendChild(el('div', { class: 'small', text: 'Nenhuma empresa neste filtro.' })); return; }
    ids.slice(0, 200).forEach(function (id) { list.appendChild(row(st.leads[id])); });
  }

  function refreshStatus() {
    return api('status').then(function (s) {
      $('lf-who').textContent = s.email;
      var uso = {}; (s.uso || []).forEach(function (u) { uso[u.tipo] = u.chamadas; });
      $('lf-uso').textContent = 'Hoje: Google ' + (uso.google || 0) + '/' + s.tetos.google + ' · IA ' + (uso.ia || 0) + '/' + s.tetos.ia +
        (s.google ? '' : ' · Google não configurado') + (s.ia ? '' : ' · IA não ligada (falta a chave)');
      var box = $('lf-cats');
      if (!box.childNodes.length) (s.categorias || []).forEach(function (c, i) {
        var cb = el('input', { type: 'checkbox', value: c }); if (i < 2) cb.checked = true;
        box.appendChild(el('label', null, [cb, c]));
      });
      return s;
    });
  }

  function showLogin() { $('lf-login').hidden = false; $('lf-app').hidden = true; $('lf-logout').hidden = true; $('lf-who').textContent = 'Sem sessão'; }
  function showApp() {
    $('lf-login').hidden = true; $('lf-app').hidden = false; $('lf-logout').hidden = false;
    refreshStatus().then(loadPortfolio).catch(function (e) {
      if (st.session) { msg('lf-search-msg', e.message, 'err'); } else { showLogin(); msg('lf-login-msg', e.message, 'err'); }
    });
  }

  function bind() {
    $('lf-login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('lf-email').value.trim().toLowerCase();
      if (!email) return;
      msg('lf-login-msg', 'Enviando…');
      sendLink(email).then(function () {
        msg('lf-login-msg', 'Se este e-mail tiver acesso, o link chega em instantes. Confira também o spam.');
      }, function (er) { msg('lf-login-msg', er.message, 'err'); });
    });

    $('lf-logout').addEventListener('click', function () {
      var t = st.session && st.session.access_token;
      if (t) fetch(URL_SB + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + t } }).catch(function () {});
      save(null); st.leads = {}; st.order = []; showLogin();
    });

    $('lf-search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('lf-where').value.trim();
      var cats = Array.prototype.map.call(d.querySelectorAll('#lf-cats input:checked'), function (i) { return i.value; });
      if (!cats.length) { msg('lf-search-msg', 'Marque pelo menos uma categoria.', 'err'); return; }
      st.lang = $('lf-lang').value;
      var btn = $('lf-search-btn'); btn.disabled = true;
      msg('lf-search-msg', 'Localizando “' + q + '”…');
      api('geocode', { q: q }).then(function (g) {
        msg('lf-search-msg', 'Buscando em ' + g.label + '…');
        return api('search', { categories: cats, radiusKm: +$('lf-radius').value, center: { lat: g.lat, lng: g.lng }, lang: st.lang });
      }).then(function (res) {
        (res.leads || []).forEach(upsertLocal);
        st.filter = 'Todos'; render(); refreshStatus();
        msg('lf-search-msg', (res.leads || []).length + ' empresa(s) encontradas. Nada fica salvo até você clicar em “Salvar na carteira”.' + (res.aviso ? ' Aviso: ' + res.aviso : ''));
      }).catch(function (er) { msg('lf-search-msg', er.message, 'err'); })
        .then(function () { btn.disabled = false; });
    });

    $('lf-reload').addEventListener('click', function () { loadPortfolio().catch(function (e) { toast(e.message); }); });

    $('lf-ask-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = $('lf-question').value.trim(); if (!q) return;
      msg('lf-ask-msg', 'Pensando…'); $('lf-answer').textContent = '';
      api('ask', { question: q }).then(function (r) { msg('lf-ask-msg', ''); $('lf-answer').textContent = r.answer; refreshStatus(); },
        function (er) { msg('lf-ask-msg', er.message, 'err'); });
    });
  }

  function start() {
    if (!URL_SB || !ANON) { msg('lf-login-msg', 'Supabase não configurado em assets/js/config.js.', 'err'); return; }
    consumeHash();
    if (!st.session) st.session = load();
    bind();
    if (st.session) showApp(); else showLogin();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})(window, document);
