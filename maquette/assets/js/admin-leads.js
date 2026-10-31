/* ============================================================
   Soft Communication · LeadFinder no painel (admin/leads.html)
   Porte de app/page.tsx (Next.js + React) para JavaScript puro.

   - Login real do Supabase Auth (link mágico, create_user:false).
   - Rotas /api/* do original viram a Edge Function "leadfinder"
     (mesmas rotas, corpos e respostas): lfFetch(route, init).
   - Persistência igual ao original (localStorage, leads reais só
     pelo place_id) + sincronização com public.leadfinder_leads
     para a equipe ver a mesma carteira.
   - Segurança: dado externo só entra no DOM via textContent /
     createElement; URLs só http/https; target=_blank sempre com
     rel="noopener noreferrer"; nenhuma chave paga no navegador.

   Modelo: um estado único (S) + render() que redesenha as partes
   dinâmicas e devolve o foco ao mesmo controle (efeito do React).
   ============================================================ */
(function (w, d) {
  'use strict';

  var LF = w.LF;
  var el = LF.el, icon = LF.icon, notify = LF.notify;

  /* ---------- configuração ---------- */
  var CFG = w.SOFT_CONFIG || {};
  var URL_SB = (CFG.supabaseUrl || '').replace(/\/$/, '');
  var ANON = CFG.supabaseAnonKey || '';
  var FN = URL_SB + '/functions/v1/leadfinder';
  var MAPS_KEY = typeof CFG.googleMapsBrowserKey === 'string' ? CFG.googleMapsBrowserKey.trim() : '';
  var TABLE = 'leadfinder_leads';

  /* ---------- constantes do page.tsx ---------- */
  var SWEEPS = [0, 100, 250];
  var CELL_KM = 10;
  var MAX_CELLS = 1500;
  var STORAGE_KEY = 'leadfinder-leads-v1';
  var RADII = [5, 10, 25, 50];
  var CONTACTED = ['Contatado', 'Respondeu', 'Reunião marcada', 'Cliente'];
  var CLOSED = ['Cliente', 'Descartado'];
  var DEFAULT_TEMPLATE = 'Olá! Tudo bem? Vi a {nome} no Google e gostei do trabalho de vocês. Posso te mostrar uma ideia rápida para atrair mais clientes? Se preferir não receber mensagens, é só avisar.';
  var SORTS = [
    { id: 'score', label: 'Maior prioridade' }, { id: 'rating', label: 'Melhor nota' }, { id: 'reviews', label: 'Mais avaliações' },
    { id: 'near', label: 'Mais perto' }, { id: 'next', label: 'Próxima ação' }
  ];
  var PLACE_ID_RE = /^[A-Za-z0-9_-]{10,200}$/;
  var SYNC_FIELDS = ['status', 'notes', 'nextAction', 'lastContact', 'ai', 'raiox', 'seq'];

  /** Termos do Google Places: só o place_id pode ser guardado. Leads reais vão para o disco/backup/tabela sem os dados da empresa. */
  function stripAi(a) { return a ? { tier: a.tier, fit: a.fit, reason: '', opportunity: '', message: '', missing: [] } : undefined; } // textos da IA contêm dados do Places: não persistem
  function forStorage(l) {
    return l.demo ? l : { id: l.id, name: '', address: '', category: l.category, score: 0, status: l.status, notes: l.notes, nextAction: l.nextAction, lastContact: l.lastContact, pending: true, ai: stripAi(l.ai), raiox: LF.stripRaiox(l.raiox), seq: l.seq || 0 };
  }

  function ApiError(message, status) { var e = new Error(message); e.name = 'ApiError'; e.status = status; return e; }
  function isApiError(e) { return e && e.name === 'ApiError'; }
  function fmtDate(v) { return v ? v.split('-').reverse().slice(0, 2).join('/') : ''; }
  function $(id) { return d.getElementById(id); }
  function has(arr, v) { return arr.indexOf(v) >= 0; }

  /* ============================================================
     Estado (equivale aos useState/useRef do page.tsx)
     ============================================================ */
  var S = {
    selectedCategories: LF.CATEGORIES.slice(), radiusKm: 50,
    region: null, regionText: '', regionMsg: '', locating: false,
    sweepKm: 0, sweepProgress: null, goal: 'digital',
    leads: [], mode: null, template: DEFAULT_TEMPLATE,
    warning: '', message: '', error: '', loading: false,
    tab: 'list', filter: 'Todos', sort: 'score', search: '', openNotes: null,
    loaded: false, savedAt: null, hydrating: false, autoHydrate: false, aiBusy: [],
    hist: [], histFilter: 'Todos', histQ: '', onlyNew: false, ideaDraft: '',
    seqTemplates: LF.SEQ_DEFAULTS.slice(), openSell: null, raioxBusy: [], propBusy: [], propLang: 'pt-BR', propServs: {}, quick: '',
    route: { sel: null, start: 'region', gps: null, mode: 'driving', result: null }, reportMonth: '', report: null, reportBusy: false
  };
  var R = { cancelSweep: false, hydrated: new Set(), saveErrorShown: false, remoteIds: new Set(), started: false, crashed: false, histTimer: null };
  var session = null;

  function set(patch) { Object.assign(S, patch); commit(); }
  function setLeads(fn) { S.leads = fn(S.leads); commit(); }

  var renderQueued = false, saveTimer = null;
  /** Depois de cada mudança: redesenha (agrupado), agenda o salvamento automático e a reidratação. */
  function commit() {
    if (!renderQueued) {
      renderQueued = true;
      Promise.resolve().then(function () { renderQueued = false; render(); maybeHydrate(); });
    }
    scheduleSave();
  }

  /* ============================================================
     Sessão (Supabase Auth) — reaproveitado da versão anterior
     ============================================================ */
  /* Sessão única do painel (assets/js/admin-auth.js): e-mail + senha ou Google. */
  function saveSession(s) { session = s; if (!s && w.AdminAuth) w.AdminAuth.lock('Sessão expirada. Entre de novo.'); }
  function loadSession() { return w.AdminAuth ? w.AdminAuth.session() : null; }
  function consumeHash() { /* feito pelo admin-auth.js */ }
  function token() {
    if (!w.AdminAuth) return Promise.reject(new Error('Entre no painel.'));
    return w.AdminAuth.token();
  }

  function logout() { if (w.AdminAuth) w.AdminAuth.logout(); }

  /* ============================================================
     lfFetch: chamadas à Edge Function (mesmas rotas do /api/*)
     ============================================================ */
  /** Injeta Authorization + apikey, renova o token e, em 401, volta para o login. Devolve a Response (o chamador lê o JSON como no original). */
  function lfFetch(route, init, opts) {
    init = init || {}; opts = opts || {};
    return token().then(function (t) {
      var h = Object.assign({}, init.headers || {}, { Authorization: 'Bearer ' + t, apikey: ANON });
      return fetch(FN + route, Object.assign({}, init, { headers: h }));
    }, function (e) {
      if (!opts.quiet) showLogin(e.message);
      throw ApiError(e.message, 401);
    }).then(function (res) {
      if (res.status === 401 && !opts.quiet) {
        saveSession(null); showLogin('Sessão expirada. Entre de novo.');
        throw ApiError('Sessão expirada. Entre de novo.', 401);
      }
      return res;
    });
  }
  function postJson(route, body, opts) {
    return lfFetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, opts);
  }

  /** PostgREST da tabela compartilhada (mesmo token do usuário). */
  function rest(method, query, body, prefer) {
    return token().then(function (t) {
      var h = { Authorization: 'Bearer ' + t, apikey: ANON, 'Content-Type': 'application/json' };
      if (prefer) h.Prefer = prefer;
      return fetch(URL_SB + '/rest/v1/' + query, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined });
    }, function (e) { showLogin(e.message); throw ApiError(e.message, 401); }).then(function (r) {
      if (r.status === 401) { saveSession(null); showLogin('Sessão expirada. Entre de novo.'); throw ApiError('Sessão expirada. Entre de novo.', 401); }
      if (!r.ok) return r.text().then(function (t) { throw ApiError('O banco respondeu ' + r.status + (t ? ': ' + t.slice(0, 160) : ''), r.status); });
      return r.status === 204 ? null : r.json().catch(function () { return null; });
    });
  }

  /* bugs do navegador → /bug (igual ao /api/bug do original) */
  function sendBug(payload) {
    if (!session) return Promise.resolve();
    return lfFetch('/bug', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify(payload) }, { quiet: true });
  }

  /* ============================================================
     Persistência local (igual ao original)
     ============================================================ */
  function loadLocal() {
    try {
      var raw = w.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw) || {};
        if (Array.isArray(parsed.leads)) {
          S.leads = parsed.leads.map(LF.sanitizeLead).filter(Boolean);
          S.mode = parsed.mode === 'google' ? 'google' : 'demo';
        }
        var r = parsed.region;
        if (r && LF.validCoords(r.lat, r.lng) && typeof r.label === 'string') { S.region = { label: r.label.slice(0, 120), lat: r.lat, lng: r.lng }; S.regionText = r.label.slice(0, 120); }
        if (typeof parsed.template === 'string' && parsed.template.trim()) S.template = parsed.template.slice(0, 500);
        if (!Array.isArray(parsed.seqTemplates)) S.seqTemplates[0] = S.template;
        if (Array.isArray(parsed.seqTemplates)) S.seqTemplates = [0, 1, 2].map(function (i) { var t = parsed.seqTemplates[i]; return typeof t === 'string' && t.trim() ? t.slice(0, 500) : LF.SEQ_DEFAULTS[i]; });
      }
    } catch (e) {
      try { w.localStorage.setItem(STORAGE_KEY + '-corrompido', w.localStorage.getItem(STORAGE_KEY) || ''); } catch (e2) { /* sem espaço */ }
      notify({ level: 'warn', title: 'Não consegui ler os leads salvos', detail: 'Os dados do navegador estavam corrompidos (guardei uma cópia em leadfinder-leads-v1-corrompido). Se tiver um backup, use Restaurar.', source: 'load' });
    }
    S.loaded = true;
  }

  // Salvamento automático: 500 ms após cada mudança.
  function scheduleSave() {
    if (!S.loaded) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { w.localStorage.setItem(STORAGE_KEY, JSON.stringify({ leads: S.leads.map(forStorage), mode: S.mode, template: S.template, seqTemplates: S.seqTemplates, region: S.region })); S.savedAt = Date.now(); renderTop(); }
      catch (e) {
        if (!R.saveErrorShown) { R.saveErrorShown = true; notify({ level: 'error', title: 'Não consegui salvar no navegador', detail: 'Espaço cheio ou armazenamento bloqueado. Faça um backup agora.', source: 'autosave' }); }
      }
    }, 500);
  }

  /* ============================================================
     Carteira compartilhada (public.leadfinder_leads)
     ============================================================ */
  function isReal(l) { return l && !l.demo && PLACE_ID_RE.test(l.id); }
  function worthSync(l) { return l.status !== 'Novo' || !!l.notes || !!l.nextAction || !!l.lastContact || !!l.ai || !!l.raiox || (l.seq || 0) > 0; }
  function toRow(l) {
    return { place_id: l.id, categoria: l.category, status: l.status, notas: l.notes || null, proxima_acao: l.nextAction || null, ultimo_contato: l.lastContact || null, ia: stripAi(l.ai) || null, raiox: LF.stripRaiox(l.raiox) || null, sequencia: l.seq || 0 };
  }

  var syncQueue = new Map(), syncTimer = null;
  /** Agenda o upsert de um lead real (agrupa vários em uma chamada). `snapshot` serve para lead que já saiu da lista (Excluir). */
  function queueSync(id, snapshot) {
    syncQueue.set(id, snapshot || null);
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flushSync, 700);
  }
  function flushSync() {
    var rows = [];
    syncQueue.forEach(function (snap, id) {
      var l = snap || S.leads.filter(function (x) { return x.id === id; })[0];
      if (!isReal(l)) return; // demo nunca vai para a tabela
      if (!worthSync(l) && !R.remoteIds.has(id)) return; // "Novo" sem notas/datas/IA não precisa ir
      rows.push(toRow(l));
    });
    syncQueue.clear();
    if (!rows.length || !session) return;
    rest('POST', TABLE + '?on_conflict=place_id', rows, 'resolution=merge-duplicates,return=minimal').then(function () {
      rows.forEach(function (r) { R.remoteIds.add(r.place_id); });
      refreshHistorySoon();
    }, function (e) {
      var st = isApiError(e) ? e.status : 0;
      notify({ level: st >= 400 && st < 500 ? 'warn' : 'error', title: 'Não sincronizei com a carteira da equipe', detail: (e && e.message ? e.message : 'Sem conexão.') + ' As mudanças continuam salvas neste navegador.', source: 'sync' });
    });
  }

  /** Ao abrir: lê a tabela e mescla com o localStorage (o remoto ganha quando existir). */
  function pullRemote() {
    return rest('GET', TABLE + '?select=place_id,categoria,status,notas,proxima_acao,ultimo_contato,ia,raiox,sequencia').then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) return;
      var byId = new Map(S.leads.map(function (l) { return [l.id, l]; }));
      var added = false;
      rows.forEach(function (row) {
        if (!row || typeof row.place_id !== 'string' || !PLACE_ID_RE.test(row.place_id)) return;
        var remote = LF.sanitizeLead({ id: row.place_id, name: '', pending: true, category: row.categoria, status: row.status, notes: row.notas || undefined, nextAction: row.proxima_acao, lastContact: row.ultimo_contato, ai: row.ia, raiox: row.raiox, seq: row.sequencia });
        if (!remote) return;
        R.remoteIds.add(remote.id);
        var local = byId.get(remote.id);
        if (local && !local.demo) {
          // mantém os textos da IA locais se a análise remota for a mesma (a tabela guarda só tier/fit)
          var ai = remote.ai ? (local.ai && local.ai.tier === remote.ai.tier && local.ai.fit === remote.ai.fit ? local.ai : remote.ai) : local.ai;
          var rx = remote.raiox ? (local.raiox && local.raiox.em === remote.raiox.em ? local.raiox : remote.raiox) : local.raiox;
          byId.set(remote.id, Object.assign({}, local, { status: remote.status, notes: remote.notes, nextAction: remote.nextAction, lastContact: remote.lastContact, ai: ai, raiox: rx, seq: Math.max(remote.seq || 0, local.seq || 0) }));
        } else if (!local) {
          byId.set(remote.id, remote); R.hydrated.delete(remote.id); added = true;
        }
      });
      var list = Array.from(byId.values());
      // carteira real da equipe: sai do modo demonstração (os fictícios saem, como numa busca real)
      if (S.mode !== 'google' && list.some(function (l) { return !l.demo; })) { list = list.filter(function (l) { return !l.demo; }); S.mode = 'google'; }
      S.leads = list;
      commit();
      if (added) notify({ level: 'info', title: 'Carteira da equipe carregada', detail: rows.length + ' empresa(s) na tabela compartilhada.' });
    }).catch(function (e) {
      var st = isApiError(e) ? e.status : 0;
      if (st === 401) return;
      notify({ level: st >= 400 && st < 500 ? 'warn' : 'error', title: 'Não carreguei a carteira da equipe', detail: e && e.message ? e.message : 'Sem conexão.', source: 'sync' });
    });
  }

  /* ============================================================
     Reidratação (leads reais guardados só pelo place_id)
     ============================================================ */
  function maybeHydrate() {
    if (!S.loaded || !session || S.hydrating) return;
    var ids = S.leads.filter(function (l) { return l.pending && !R.hydrated.has(l.id); }).map(function (l) { return l.id; });
    if (!ids.length || (ids.length > 50 && !S.autoHydrate)) return; // muitos leads: pede confirmação (custo)
    ids.forEach(function (id) { R.hydrated.add(id); }); // falhou? continua marcado: só o botão "Tentar de novo" repete
    set({ hydrating: true });
    var chain = Promise.resolve();
    for (var i = 0; i < ids.length; i += 20) (function (chunk) {
      chain = chain.then(function () {
        return postJson('/places', { ids: chunk }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error((data && data.error) || 'Falha ao carregar empresas salvas.');
            var byId = new Map((Array.isArray(data.places) ? data.places : []).filter(function (p) { return p && typeof p.id === 'string'; }).map(function (p) { return [p.id, p]; }));
            var gone = new Set(Array.isArray(data.gone) ? data.gone : []);
            setLeads(function (prev) {
              return prev.map(function (l) {
                if (byId.has(l.id)) return LF.sanitizeLead(Object.assign({}, l, byId.get(l.id), { id: l.id, demo: l.demo, pending: false, status: l.status, notes: l.notes, nextAction: l.nextAction, lastContact: l.lastContact, ai: l.ai, raiox: l.raiox, seq: l.seq })) || l;
                if (gone.has(l.id)) return Object.assign({}, l, { name: '(empresa não encontrada no Google)', pending: false });
                return l;
              });
            });
          });
        });
      });
    })(ids.slice(i, i + 20));
    chain.catch(function (e) {
      notify({ level: 'warn', title: 'Não carreguei empresas salvas', detail: e instanceof Error ? e.message : 'Erro de rede.', source: 'api/places' });
    }).then(function () { set({ hydrating: false }); });
  }


  /* ============================================================
     Histórico da equipe (tabela leadfinder_historico)
     Evita repetir lead, área pesquisada, abordagem e ideia.
     Só guarda place_id; o nome da empresa nunca vai para a tabela.
     ============================================================ */
  var HIST = 'leadfinder_historico';
  var HIST_TYPES = [
    { id: 'Todos', label: 'Tudo' }, { id: 'status', label: 'Status' }, { id: 'contato', label: 'Abordagens' },
    { id: 'ideia', label: 'Ideias' }, { id: 'busca', label: 'Buscas' }
  ];
  function myEmail() { var s = w.AdminAuth && w.AdminAuth.session(); return (s && s.email) || ''; }
  function who(email) { return email ? String(email).split('@')[0] : 'alguém'; }
  function fmtWhen(iso) {
    var t = Date.parse(iso); if (isNaN(t)) return '';
    return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
  function loadHistory() {
    if (!session) return Promise.resolve();
    return rest('GET', HIST + '?select=id,em,email,tipo,place_id,categoria,de,para,texto&order=em.desc&limit=1000').then(function (rows) {
      S.hist = Array.isArray(rows) ? rows : [];
      commit();
    }).catch(function (e) {
      if (isApiError(e) && e.status === 401) return;
      notify({ level: 'warn', title: 'Não carreguei o histórico', detail: e && e.message ? e.message : 'Sem conexão.', source: 'historico' });
    });
  }
  /** Recarrega o histórico pouco depois de salvar (o banco registra as mudanças de status sozinho). */
  function refreshHistorySoon() { clearTimeout(R.histTimer); R.histTimer = setTimeout(loadHistory, 1500); }
  function logHist(row) {
    if (!session) return Promise.resolve(null);
    row.email = myEmail();
    return rest('POST', HIST, row, 'return=representation').then(function (r) {
      var x = Array.isArray(r) ? r[0] : r;
      if (x) { S.hist = [x].concat(S.hist); commit(); }
      return x || null;
    }, function (e) {
      notify({ level: 'warn', title: 'Não registrei no histórico', detail: e && e.message ? e.message : 'Sem conexão.', source: 'historico' });
      return null;
    });
  }
  function lastOf(tipo, test) {
    for (var i = 0; i < S.hist.length; i++) { var h = S.hist[i]; if (h.tipo === tipo && test(h)) return h; }
    return null;
  }
  function lastContato(id) { return lastOf('contato', function (h) { return h.place_id === id; }); }
  function regionKey() { return String((S.region && S.region.label) || S.regionText || '').trim().slice(0, 200); }
  function lastBusca(label) {
    var k = label.toLocaleLowerCase('pt-BR');
    return lastOf('busca', function (h) { return String(h.texto || '').toLocaleLowerCase('pt-BR') === k; });
  }
  /** Empresas que já passaram pela equipe (carteira, status ou abordagem). */
  function touchIndex() {
    var m = new Map();
    S.hist.forEach(function (h) {
      if (!h.place_id) return;
      var t = m.get(h.place_id) || {};
      if (h.tipo === 'contato' && !t.contato) t.contato = h;
      if (h.tipo === 'status' && !t.status) t.status = h;
      m.set(h.place_id, t);
    });
    return m;
  }
  function worked(l, touch) { return R.remoteIds.has(l.id) || l.status !== 'Novo' || touch.has(l.id); }
  /** A mensagem vai para o histórico com {nome} no lugar do nome da empresa. */
  function anonMsg(msg, name) { msg = String(msg || ''); return (name ? msg.split(name).join('{nome}') : msg).slice(0, 1000); }

  /* Ideias parecidas: palavras em comum (sem acento, ignorando palavras curtas). */
  function words(t) {
    return String(t || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(function (x) { return x.length > 3; });
  }
  function similarIdeas(text) {
    var a = new Set(words(text)); if (a.size < 2) return [];
    return S.hist.filter(function (h) { return h.tipo === 'ideia'; }).map(function (h) {
      var b = new Set(words(h.texto)); var inter = 0;
      a.forEach(function (x) { if (b.has(x)) inter++; });
      return { h: h, sim: b.size ? inter / Math.min(a.size, b.size) : 0, inter: inter };
    }).filter(function (x) { return x.inter >= 2 && x.sim >= 0.6; })
      .sort(function (x, y) { return y.sim - x.sim; }).slice(0, 3).map(function (x) { return x.h; });
  }
  function saveIdea(text, lead) {
    text = String(text || '').trim().slice(0, 1000);
    if (!text) return Promise.resolve(null);
    var sims = similarIdeas(text);
    if (sims.length && !w.confirm('Parecida com uma ideia de ' + who(sims[0].email) + ' em ' + fmtWhen(sims[0].em) + ':\n"' + String(sims[0].texto).slice(0, 160) + '"\n\nSalvar mesmo assim?')) return Promise.resolve(null);
    return logHist({ tipo: 'ideia', texto: lead ? anonMsg(text, lead.name) : text, place_id: lead && isReal(lead) ? lead.id : null, categoria: lead ? lead.category : null }).then(function (x) {
      if (x) notify({ level: 'success', title: 'Ideia guardada no histórico' });
      return x;
    });
  }
  function deleteIdea(h) {
    if (!w.confirm('Apagar esta ideia do histórico?')) return;
    rest('DELETE', HIST + '?id=eq.' + encodeURIComponent(h.id)).then(function () {
      S.hist = S.hist.filter(function (x) { return x.id !== h.id; }); commit();
    }, function (e) { notify({ level: 'warn', title: 'Não apaguei a ideia', detail: e && e.message, source: 'historico' }); });
  }
  /** Clique em "Abordar": avisa se a empresa já foi abordada e registra a abordagem. */
  function onApproach(lead, kind, message) {
    return function (e) {
      var prev = isReal(lead) ? lastContato(lead.id) : null;
      if (prev) {
        var same = prev.texto && prev.texto === anonMsg(message, lead.name);
        if (!w.confirm(lead.name + ' já foi abordada em ' + fmtWhen(prev.em) + ' por ' + who(prev.email) + (same ? ', com esta mesma mensagem' : '') + '.\n\nAbordar de novo?')) { e.preventDefault(); return; }
      }
      approach(lead);
      if (isReal(lead)) logHist({ tipo: 'contato', place_id: lead.id, categoria: lead.category, de: kind, texto: anonMsg(message, lead.name) });
    };
  }


  /* ============================================================
     Vender mais: raio-X, portfólio, proposta, sequência, hoje
     ============================================================ */
  var CATALOG = w.SOFT_CATALOG || { items: [], base: '' };
  var SITE_URL = (LF.PROPOSTA_SITE || 'https://softcommunicaiton.com/').replace(/\/?$/, '/');
  function busy(list, id) { return has(S[list], id); }
  function setBusy(list, id, on) { set((function () { var o = {}; o[list] = on ? S[list].concat([id]) : S[list].filter(function (x) { return x !== id; }); return o; })()); }

  function portfolioFor(lead) { return LF.pickPortfolio(lead, CATALOG.items, lead.raiox, 3); }
  function videoOf(pick) { return LF.videoUrl(pick.item, CATALOG.base); }
  function posterOf(pick) { return pick.item.poster ? (LF.httpUrl(pick.item.poster) || SITE_URL + String(pick.item.poster).replace(/^\//, '')) : ''; }

  function runRaiox(lead) {
    if (busy('raioxBusy', lead.id)) return;
    setBusy('raioxBusy', lead.id, true);
    postJson('/raiox', { id: lead.id, category: lead.category }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok || !data) throw new Error((data && data.error) || 'Falha no raio-X.');
        var rx = LF.sanitizeRaiox(data);
        if (!rx) throw new Error('Resposta do raio-X inválida.');
        updateLead(lead.id, { raiox: rx });
        if (isReal(lead)) logHist({ tipo: 'raiox', place_id: lead.id, categoria: lead.category, texto: rx.lacunas.map(function (l) { return l.codigo; }).join(', ').slice(0, 1000), para: rx.principal || null });
        notify({ level: 'success', title: 'Raio-X pronto', detail: rx.lacunas.length + ' ponto(s) a melhorar · indica: ' + rx.servicos.map(function (x) { return LF.OFERTAS[x] ? LF.OFERTAS[x].nome : x; }).join(', ') });
      });
    }).catch(function (e) {
      notify({ level: 'warn', title: 'Raio-X não concluído', detail: e && e.message ? e.message : 'Erro', source: 'api/raiox' });
    }).then(function () { setBusy('raioxBusy', lead.id, false); });
  }

  function propServices(lead) {
    var chosen = S.propServs[lead.id];
    if (chosen && chosen.length) return chosen;
    if (lead.raiox && lead.raiox.servicos.length) return lead.raiox.servicos.slice(0, 2);
    return ['motion'];
  }
  function gerarProposta(lead) {
    var servs = propServices(lead);
    if (!servs.length) { notify({ level: 'warn', title: 'Escolha pelo menos um serviço' }); return; }
    var picks = portfolioFor(lead);
    var semDireito = picks.filter(function (p) { return !p.direitos; });
    if (semDireito.length && !w.confirm(semDireito.length + ' vídeo(s) sugerido(s) estão com direitos "a confirmar" no catálogo.\n\nIncluir assim mesmo na proposta? (Cancelar = proposta sem vídeos)')) picks = [];
    var win = LF.proposalWindow(S.propLang);
    if (!win) { notify({ level: 'warn', title: 'O navegador bloqueou a janela', detail: 'Permita pop-ups para este site e tente de novo.' }); return; }
    setBusy('propBusy', lead.id, true);
    var city = String(lead.address || '').split(',').slice(-3, -1).join(',').trim();
    postJson('/proposta', {
      lead: { name: lead.name, category: lead.category, city: city }, servicos: servs, idioma: S.propLang,
      lacunas: lead.raiox ? lead.raiox.lacunas.map(function (l) { return l.codigo; }) : [], resumo: lead.raiox ? lead.raiox.resumo : '',
      ideia: lead.ai ? lead.ai.opportunity : '', notas: lead.notes || '', portfolio: picks.map(function (p) { return p.item.title; })
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok || !data) throw new Error((data && data.error) || 'Falha ao gerar a proposta.');
        LF.renderProposal(win, {
          idioma: S.propLang, empresa: lead.name, categoria: lead.category, texto: data, ofertas: LF.OFERTAS,
          videos: picks.map(function (p) { return { titulo: p.item.title, url: videoOf(p), poster: posterOf(p) }; }),
          contato: { email: CFG.email, whatsapp: CFG.whatsapp, instagram: CFG.instagramHandle, site: SITE_URL },
          logo: new URL('../assets/brand/soft-horizontal-chocolate.svg', w.location.href).href
        });
        if (isReal(lead)) logHist({ tipo: 'proposta', place_id: lead.id, categoria: lead.category, texto: servs.join(', '), de: S.propLang });
      });
    }).catch(function (e) {
      LF.proposalError(win, e && e.message ? e.message : 'Erro ao gerar a proposta.');
      notify({ level: 'warn', title: 'Proposta não gerada', detail: e && e.message, source: 'api/proposta' });
    }).then(function () { setBusy('propBusy', lead.id, false); });
  }

  /** Passo da sequência: abre o WhatsApp com a mensagem do passo e agenda o próximo. */
  function seqLink(lead, D) {
    var st = LF.seqState(lead);
    if (!st.ativa || lead.demo && !lead.phone) return null;
    var passo = st.proximo.passo;
    var pick = portfolioFor(lead)[0];
    var msg = LF.seqMessage(S.seqTemplates, passo, lead.name, pick ? videoOf(pick) : '');
    var href = LF.whatsappLink(lead.phone, msg);
    if (!href) return null;
    var label = passo === 1 ? 'Abordar no WhatsApp' : 'Passo ' + passo + ': ' + st.proximo.nome;
    return extLink(href, [icon('chat', 14), label], 'wa', function (e) {
      if (passo === 1) {
        var prev = isReal(lead) ? lastContato(lead.id) : null;
        if (prev && !w.confirm(lead.name + ' já foi abordada em ' + fmtWhen(prev.em) + ' por ' + who(prev.email) + '.\n\nAbordar de novo?')) { e.preventDefault(); return; }
      }
      updateLead(lead.id, LF.seqPatch(lead, passo, LF.todayLocal()));
      if (isReal(lead)) logHist({ tipo: 'contato', place_id: lead.id, categoria: lead.category, de: 'Sequência ' + passo, texto: anonMsg(msg, lead.name) });
    });
  }

  /** O que vence hoje: retornos (inclui passos da sequência) e leads quentes sem contato. */
  function todayInfo(D) {
    var due = [], seqDue = 0, hot = [];
    D.scored.forEach(function (l) {
      if (has(CLOSED, l.status)) return;
      if (l.nextAction && l.nextAction <= D.today) { due.push(l); if (LF.seqState(l).ativa && (l.seq || 0) > 0) seqDue++; }
      else if (l.ai && l.ai.tier === 'A' && (l.status === 'Novo' || l.status === 'Contato pendente')) hot.push(l);
    });
    return { due: due, seqDue: seqDue, hot: hot, ids: new Set(due.concat(hot).map(function (l) { return l.id; })) };
  }
  function sendDigestTest() {
    postJson('/resumo', { sempre: true }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (d) {
        if (!res.ok || !d) throw new Error((d && d.error) || 'Falha ao enviar.');
        notify({ level: d.enviado ? 'success' : 'warn', title: d.enviado ? 'Resumo enviado para o seu e-mail' : 'Resumo não enviado', detail: d.enviado ? d.titulo : d.motivo });
      });
    }).catch(function (e) { notify({ level: 'warn', title: 'Resumo não enviado', detail: e && e.message, source: 'api/resumo' }); });
  }

  /* ---------- Rota do dia ---------- */
  function routeCandidates(D) {
    return D.filtered.filter(function (l) { return !l.pending && LF.validCoords(l.lat, l.lng); })
      .sort(function (a, b) {
        var da = a.nextAction && a.nextAction <= D.today ? 0 : 1, db = b.nextAction && b.nextAction <= D.today ? 0 : 1;
        return da - db || b.score - a.score;
      });
  }
  function routeSel(D) {
    if (S.route.sel) return S.route.sel;
    var ids = routeCandidates(D).filter(function (l) { return l.nextAction && l.nextAction <= D.today && !has(CLOSED, l.status); }).slice(0, LF.ROUTE_MAX).map(function (l) { return l.id; });
    return new Set(ids);
  }
  function setRoute(patch) { set({ route: Object.assign({}, S.route, patch) }); }
  function buildRoute(D) {
    var sel = routeSel(D);
    var stops = routeCandidates(D).filter(function (l) { return sel.has(l.id); });
    if (!stops.length) { notify({ level: 'warn', title: 'Escolha pelo menos uma parada' }); return; }
    var start = S.route.start === 'gps' ? S.route.gps : S.region;
    if (!start) { notify({ level: 'warn', title: S.route.start === 'gps' ? 'Clique em "Usar minha localização" primeiro' : 'Defina a região da busca (ou use sua localização)' }); return; }
    var r = LF.planRoute({ lat: start.lat, lng: start.lng }, stops);
    setRoute({ result: { order: r.order.map(function (l) { return l.id; }), km: r.km, url: LF.routeUrl(start, r.order, S.route.mode), start: { lat: start.lat, lng: start.lng } } });
  }
  function useGps() {
    if (!w.navigator.geolocation) { notify({ level: 'warn', title: 'Este navegador não informa a localização' }); return; }
    w.navigator.geolocation.getCurrentPosition(function (p) {
      setRoute({ start: 'gps', gps: { lat: p.coords.latitude, lng: p.coords.longitude }, result: null });
      notify({ level: 'success', title: 'Localização definida como ponto de partida' });
    }, function () { notify({ level: 'warn', title: 'Não consegui sua localização', detail: 'Permita o acesso à localização ou use o centro da busca.' }); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  /* ---------- Relatório do mês ---------- */
  function monthNow() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function loadReport() {
    var ym = S.reportMonth || monthNow();
    var rg = LF.monthRange(ym);
    set({ reportBusy: true, reportMonth: ym });
    rest('GET', HIST + '?select=em,email,tipo,place_id,categoria,de,para,texto&em=gte.' + encodeURIComponent(rg.from) + '&order=em.asc&limit=20000').then(function (rows) {
      set({ report: { ym: ym, data: LF.monthReport(Array.isArray(rows) ? rows : [], rg.from, rg.to) } });
    }).catch(function (e) {
      if (!(isApiError(e) && e.status === 401)) notify({ level: 'warn', title: 'Não carreguei o relatório', detail: e && e.message, source: 'relatorio' });
    }).then(function () { set({ reportBusy: false }); });
  }
  function exportReportCsv() {
    var r = S.report && S.report.data; if (!r) return;
    var lines = [['Relatório', S.report.ym], [], ['Indicador', 'Valor'],
      ['Buscas', r.buscas], ['Áreas pesquisadas', r.areas], ['Empresas abordadas', r.abordados], ['Abordagens (mensagens)', r.abordagens],
      ['Responderam depois do contato', r.responderam], ['Taxa de resposta', pct(r.taxaResposta)], ['Reuniões marcadas', r.reunioes], ['Clientes', r.clientes],
      ['Descartados', r.descartados], ['Propostas geradas', r.propostas], ['Raio-X feitos', r.raiox], ['Ideias', r.ideias], [],
      ['Mensagem', 'Abordados', 'Responderam', 'Taxa']].concat(r.porMensagem.map(function (m) { return [m.chave, m.abordados, m.responderam, pct(m.taxa)]; }),
      [[], ['Categoria', 'Abordados', 'Responderam', 'Taxa']], r.porCategoria.map(function (m) { return [m.chave, m.abordados, m.responderam, pct(m.taxa)]; }),
      [[], ['Pessoa', 'Abordagens']], r.porPessoa.map(function (m) { return [m.pessoa, m.abordagens]; }));
    var csv = lines.map(function (row) { return row.map(function (v) { var x = String(v == null ? '' : v); x = /^[=+\-@\t\r]/.test(x) ? "'" + x : x; return '"' + x.replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    download(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' }), 'leadfinder-relatorio-' + S.report.ym + '.csv');
  }
  function pct(x) { return Math.round((x || 0) * 100) + '%'; }

  /* ============================================================
     Derivados (useMemo do original)
     ============================================================ */
  function derive() {
    var scored = S.leads.map(function (l) { return Object.assign({}, l, { score: l.pending ? 0 : LF.scoreLead(l, S.goal) }); });
    var today = LF.todayLocal();
    var statusCounts = new Map();
    scored.forEach(function (l) { statusCounts.set(l.status, (statusCounts.get(l.status) || 0) + 1); });
    var touch = touchIndex();
    var isToday = function (l) { return !has(CLOSED, l.status) && ((l.nextAction && l.nextAction <= today) || (l.ai && l.ai.tier === 'A' && (l.status === 'Novo' || l.status === 'Contato pendente'))); };
    var term = S.search.trim().toLocaleLowerCase('pt-BR');
    var region = S.region;
    var km = function (l) { return region && typeof l.lat === 'number' && typeof l.lng === 'number' ? LF.distanceKm(region.lat, region.lng, l.lat, l.lng) : 1e9; };
    var sorters = {
      score: function (a, b) { return b.score - a.score; },
      rating: function (a, b) { return (b.rating || 0) - (a.rating || 0); },
      reviews: function (a, b) { return (b.ratingCount || 0) - (a.ratingCount || 0); },
      near: function (a, b) { return km(a) - km(b); },
      next: function (a, b) { return (a.nextAction || '9999-99-99').localeCompare(b.nextAction || '9999-99-99'); }
    };
    var filtered = scored.filter(function (l) {
      var matchesStatus = S.filter === 'Todos' || l.status === S.filter;
      var matchesSearch = !term || [l.name, l.address, l.category, l.phone || '', l.notes || ''].some(function (v) { return v.toLocaleLowerCase('pt-BR').indexOf(term) >= 0; });
      return matchesStatus && matchesSearch && (!S.onlyNew || !worked(l, touch)) && (S.quick !== 'hoje' || isToday(l));
    }).sort(sorters[S.sort] || sorters.score);
    return {
      scored: scored, today: today, statusCounts: statusCounts, filtered: filtered, touch: touch,
      contacted: S.leads.filter(function (l) { return has(CONTACTED, l.status); }).length,
      priority: scored.filter(function (l) { return l.score >= 80; }).length,
      followUps: S.leads.filter(function (l) { return l.nextAction && l.nextAction <= today && !has(CLOSED, l.status); }).length,
      pendingCount: S.leads.filter(function (l) { return l.pending; }).length,
      sweepCells: S.region && S.sweepKm ? LF.sweepCenters(S.region.lat, S.region.lng, S.sweepKm, CELL_KM) : []
    };
  }

  /* ============================================================
     Ações (mesma lógica do page.tsx)
     ============================================================ */
  // Região: primeiro a lista local (sem rede); se não achar, geocodifica no servidor (só por clique/Enter).
  function locateRegion() {
    var q = S.regionText.trim();
    S.regionMsg = '';
    var known = LF.findRegion(q);
    if (known) { set({ region: known, regionText: known.label, regionMsg: 'Centro definido: ' + known.label + '.' }); return; }
    if (q.length < 3) { set({ regionMsg: 'Digite pelo menos 3 letras ou escolha um município da lista.' }); return; }
    set({ locating: true });
    lfFetch('/geocode?q=' + encodeURIComponent(q)).then(function (res) {
      return res.json().then(function (data) {
        data = data || {};
        if (!res.ok || typeof data.lat !== 'number' || typeof data.lng !== 'number' || !LF.validCoords(data.lat, data.lng)) { set({ regionMsg: (typeof data.error === 'string' && data.error) || 'Não consegui localizar. Escolha um município da lista.' }); return; }
        var label = (typeof data.label === 'string' && data.label.trim() ? data.label : q).slice(0, 120);
        set({ region: { label: label, lat: data.lat, lng: data.lng }, regionText: label, regionMsg: 'Centro definido: ' + label + '.' });
      });
    }).catch(function (e) {
      set({ regionMsg: isApiError(e) && e.status === 401 ? e.message : 'Sem conexão para localizar. Escolha um município da lista.' });
    }).then(function () { set({ locating: false }); });
  }

  function fetchCell(center, radius) {
    return postJson('/leads', { categories: S.selectedCategories, radiusKm: radius, center: center }).then(function (response) {
      return response.json().then(null, function () { throw ApiError('O servidor respondeu algo inválido.', response.status || 500); }).then(function (data) {
        if (!response.ok) throw ApiError((data && typeof data.error === 'string' && data.error) || 'Não foi possível pesquisar os leads.', response.status);
        // tudo que vem do servidor passa pelo sanitizeLead (bloqueia javascript:, etc.)
        return {
          leads: (Array.isArray(data.leads) ? data.leads : []).map(LF.sanitizeLead).filter(Boolean),
          mode: data.mode === 'google' ? 'google' : 'demo',
          warning: typeof data.warning === 'string' ? data.warning : '',
          message: typeof data.message === 'string' ? data.message : ''
        };
      });
    });
  }
  function mergeResult(result) {
    setLeads(function (previous) {
      var oldById = new Map(previous.map(function (l) { return [l.id, l]; }));
      var fresh = result.leads.map(function (l) { var old = oldById.get(l.id); return old ? Object.assign({}, l, { status: old.status, notes: old.notes, nextAction: old.nextAction, lastContact: old.lastContact, ai: old.ai, raiox: old.raiox, seq: old.seq }) : l; });
      var freshIds = new Set(fresh.map(function (l) { return l.id; }));
      // Não perde trabalho já feito: mantém leads com status avançado, notas ou retorno marcado que não vieram nesta busca
      // (descarta os fictícios ao entrar em modo Google).
      var kept = previous.filter(function (l) { return !freshIds.has(l.id) && (l.status !== 'Novo' || l.notes || l.nextAction || l.ai || l.raiox || l.seq || (result.mode === 'google' && !l.demo)) && !(result.mode === 'google' && l.demo); });
      return fresh.concat(kept);
    });
    set({ mode: result.mode });
  }
  function reportError(e) {
    var status = isApiError(e) ? e.status : 0;
    var level = status >= 400 && status < 500 ? 'warn' : 'error'; // 4xx = uso; 5xx/rede = bug
    var msg = isApiError(e) ? e.message : 'Sem conexão com o servidor. Verifique a internet e se o app está rodando.';
    set({ error: msg });
    notify({ level: level, title: level === 'warn' ? 'Busca não concluída' : 'A busca falhou', detail: msg, source: 'api/leads' });
  }
  function precheck() {
    if (!S.region) { set({ error: 'Defina onde prospectar: digite um lugar e clique em Localizar.' }); notify({ level: 'warn', title: 'Defina onde prospectar' }); return false; }
    if (!S.selectedCategories.length) { set({ error: 'Selecione pelo menos uma categoria.' }); notify({ level: 'warn', title: 'Selecione pelo menos uma categoria' }); return false; }
    return true;
  }

  function searchLeads() {
    if (!precheck() || !S.region) return;
    var label = regionKey();
    var prev = label ? lastBusca(label) : null;
    if (prev && !w.confirm('Você já pesquisou "' + label + '" em ' + fmtWhen(prev.em) + ' (' + who(prev.email) + ', ' + (prev.para || '?') + ' leads).\n\nPesquisar de novo gasta chamadas pagas ao Google. Continuar?')) return;
    set({ loading: true, error: '', warning: '', message: '' });
    fetchCell({ lat: S.region.lat, lng: S.region.lng }, S.radiusKm).then(function (result) {
      mergeResult(result);
      set({ warning: result.warning || '', message: result.message || '' });
      if (result.warning && result.mode === 'google') notify({ level: 'warn', title: 'Algumas buscas falharam', detail: result.warning.slice(0, 200), source: 'api/leads' });
      else {
        var touch = touchIndex();
        var known = result.leads.filter(function (l) { return worked(l, touch); }).length;
        notify({ level: 'success', title: result.leads.length + ' lead(s) na lista', detail: result.mode === 'demo' ? 'Dados fictícios (modo demonstração).' : (result.leads.length - known) + ' novo(s) · ' + known + ' já trabalhado(s) pela equipe.' });
      }
      if (result.mode === 'google') logHist({ tipo: 'busca', texto: label, de: S.radiusKm + ' km', para: String(result.leads.length), categoria: S.selectedCategories.length + ' categoria(s)' });
    }).catch(reportError).then(function () { set({ loading: false }); });
  }

  // Varredura: cobre uma área grande com vários círculos de CELL_KM, uma busca por vez, com progresso e cancelamento.
  function sweepArea() {
    var cells = derive().sweepCells;
    if (!precheck() || !S.region || !cells.length) return;
    if (cells.length > MAX_CELLS) { set({ error: 'Área grande demais (' + cells.length + ' pontos; máximo ' + MAX_CELLS + ').' }); return; }
    var calls = cells.length * S.selectedCategories.length;
    if (!w.confirm('Varredura de ' + S.sweepKm + ' km: ' + cells.length + ' pontos × ' + S.selectedCategories.length + ' categorias = ' + calls + ' chamadas pagas ao Google. Continuar?')) return;
    set({ loading: true, error: '', warning: '', message: '' }); R.cancelSweep = false;
    var failures = 0, consecutive = 0, partial = 0, lastError = '';
    var i = 0;
    function finish() {
      if (i > 0 && S.mode === 'google') logHist({ tipo: 'busca', texto: regionKey(), de: 'varredura ' + S.sweepKm + ' km', para: String(S.leads.length), categoria: S.selectedCategories.length + ' categoria(s)' });
      set({ warning: failures || partial ? 'Varredura com lacunas: ' + failures + ' ponto(s) falharam e ' + partial + ' vieram incompletos (alguma categoria falhou). ' + (lastError ? 'Último erro: ' + lastError : '') : '' });
      notify({ level: failures || partial ? 'warn' : 'success', title: R.cancelSweep ? 'Varredura cancelada' : 'Varredura concluída', detail: failures || partial ? failures + ' falha(s), ' + partial + ' incompleto(s).' : undefined });
      set({ loading: false, sweepProgress: null });
    }
    function step() {
      if (i >= cells.length || R.cancelSweep) return finish();
      set({ sweepProgress: { done: i, total: cells.length } });
      fetchCell(cells[i], CELL_KM).then(function (result) {
        mergeResult(result); consecutive = 0;
        if (result.warning && result.mode === 'google') partial++;
        if (result.mode === 'demo') { set({ message: result.message || '' }); return finish(); }
        i++; step();
      }, function (e) {
        failures++; consecutive++; lastError = e instanceof Error ? e.message : String(e);
        if (isApiError(e) && (e.status === 429 || e.status === 400 || e.status === 401)) { reportError(e); return finish(); } // limite de custo ou pedido inválido: para
        if (consecutive >= 5) { reportError(e); return finish(); }
        i++; step();
      });
    }
    step();
  }

  function analyze(lead) {
    set({ aiBusy: S.aiBusy.concat([lead.id]) });
    postJson('/ai', { lead: { name: lead.name, category: lead.category, address: lead.address, rating: lead.rating, ratingCount: lead.ratingCount, website: lead.website, phone: lead.phone ? 'sim' : '', notes: lead.notes } }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok || !data) throw new Error((data && data.error) || 'Falha na análise.');
        var ai = LF.sanitizeAi(data);
        if (!ai) throw new Error('Falha na análise.');
        updateLead(lead.id, { ai: ai });
      });
    }).catch(function (e) {
      notify({ level: 'warn', title: 'Análise de IA não concluída', detail: e instanceof Error ? e.message : 'Erro', source: 'api/ai' });
    }).then(function () { set({ aiBusy: S.aiBusy.filter(function (x) { return x !== lead.id; }) }); });
  }

  function touchesSync(patch) { return SYNC_FIELDS.some(function (k) { return k in patch; }); }
  function updateLead(id, patch) {
    setLeads(function (previous) { return previous.map(function (l) { return l.id === id ? Object.assign({}, l, patch) : l; }); });
    if (touchesSync(patch)) queueSync(id);
  }
  /** Atualiza sem redesenhar a lista (digitação nas notas: não pode perder o foco). */
  function updateLeadQuiet(id, patch) {
    S.leads = S.leads.map(function (l) { return l.id === id ? Object.assign({}, l, patch) : l; });
    scheduleSave();
    if (touchesSync(patch)) queueSync(id);
  }
  function updateStatus(id, status) {
    var patch = { status: status };
    if (has(CONTACTED, status)) patch.lastContact = LF.todayLocal();
    updateLead(id, patch);
  }
  function approach(lead) { if (lead.status === 'Novo') updateStatus(lead.id, 'Contato pendente'); }
  function removeLead(lead) {
    if (!w.confirm('Excluir ' + lead.name + ' da sua lista?')) return;
    var cur = S.leads.filter(function (x) { return x.id === lead.id; })[0];
    setLeads(function (prev) { return prev.filter(function (x) { return x.id !== lead.id; }); });
    // na carteira da equipe, excluir = marcar como Descartado (não apaga o trabalho dos outros)
    if (cur && isReal(cur) && R.remoteIds.has(cur.id)) queueSync(cur.id, Object.assign({}, cur, { status: 'Descartado' }));
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = d.createElement('a'); a.href = url; a.download = name; d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportCsv() {
    var header = ['ID Google', 'Nome', 'Categoria', 'Endereço', 'Telefone', 'Site', 'Nota Google', 'Quantidade avaliações', 'Pontuação', 'Status', 'Último contato', 'Próxima ação', 'Notas', 'Google Maps', 'Dados fictícios', 'Sequência (passos feitos)', 'Serviços indicados (raio-X)'];
    // Termos do Google: leads reais saem só com o place_id + seus campos (status, notas, datas). Dados da empresa não são exportados.
    var rows = derive().filtered.map(function (l) {
      return l.demo
        ? [l.id, l.name, l.category, l.address, l.phone || '', l.website || '', l.rating == null ? '' : l.rating, l.ratingCount == null ? '' : l.ratingCount, l.score, l.status, l.lastContact || '', l.nextAction || '', l.notes || '', l.googleMapsUri || '', 'SIM', l.seq || 0, l.raiox ? l.raiox.servicos.join(', ') : '']
        : [l.id, '', l.category, '', '', '', '', '', '', l.status, l.lastContact || '', l.nextAction || '', l.notes || '', '', 'NÃO', l.seq || 0, l.raiox ? l.raiox.servicos.join(', ') : ''];
    });
    var csv = [header].concat(rows).map(function (row) {
      return row.map(function (v) { var s = String(v == null ? '' : v); var safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s; return '"' + safe.replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    download(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' }), 'leadfinder-leads.csv');
  }
  function exportBackup() {
    var payload = { app: 'leadfinder', version: 1, exportedAt: new Date().toISOString(), mode: S.mode, template: S.template, leads: S.leads.map(forStorage) };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), 'leadfinder-backup-' + LF.todayLocal() + '.json');
    notify({ level: 'success', title: 'Backup baixado', detail: S.leads.length + ' lead(s) no arquivo.' });
  }
  function importBackup(file) {
    var input = $('lf-file');
    Promise.resolve().then(function () {
      if (file.size > 5000000) throw new Error('Arquivo grande demais (limite 5 MB).');
      return file.text();
    }).then(function (text) {
      var parsed = JSON.parse(text);
      if (!parsed || parsed.app !== 'leadfinder' || !Array.isArray(parsed.leads)) throw new Error('Este arquivo não é um backup do LeadFinder.');
      var incoming = parsed.leads.slice(0, 5000).map(LF.sanitizeLead).filter(Boolean);
      var byId = new Map(S.leads.map(function (l) { return [l.id, l]; }));
      incoming.forEach(function (l) {
        var old = byId.get(l.id);
        // backup traz só o place_id: não apaga os dados já carregados, só atualiza o seu trabalho (status, notas, datas, IA)
        byId.set(l.id, old && !old.pending && l.pending ? Object.assign({}, old, { status: l.status, notes: l.notes, nextAction: l.nextAction, lastContact: l.lastContact, ai: l.ai || old.ai }) : l);
        if (byId.get(l.id).pending) R.hydrated.delete(l.id);
      });
      S.leads = Array.from(byId.values());
      if (parsed.mode === 'google' || parsed.mode === 'demo') S.mode = parsed.mode;
      if (typeof parsed.template === 'string' && parsed.template.trim()) S.template = parsed.template.slice(0, 500);
      commit();
      incoming.forEach(function (l) { if (isReal(l)) queueSync(l.id); });
      notify({ level: 'success', title: 'Backup restaurado', detail: incoming.length + ' lead(s) importado(s).' });
    }).catch(function (e) {
      notify({ level: 'warn', title: 'Não consegui restaurar o backup', detail: e instanceof Error ? e.message : 'Arquivo inválido.', source: 'import' });
    }).then(function () { if (input) input.value = ''; });
  }

  /* ============================================================
     Render
     ============================================================ */
  function seg(name, items, current, onPick) {
    // segmentado com rádios nativos (setas navegam), montado uma vez
    return items.map(function (it) {
      var input = el('input', { type: 'radio', name: name, checked: it.id === current, 'data-val': String(it.id) });
      input.addEventListener('change', function () { onPick(it.id); });
      return el('label', null, [input, el('span', { text: it.label })]);
    });
  }
  function syncSeg(box, current) {
    Array.prototype.forEach.call(box.querySelectorAll('input'), function (i) { i.checked = i.getAttribute('data-val') === String(current); });
  }

  function renderTop(D) {
    D = D || null;
    var pill = $('lf-mode-pill');
    pill.className = 'pill ' + (S.mode === 'google' ? 'live' : 'demo');
    $('lf-mode-text').textContent = S.mode === 'google' ? 'Google Places' : 'Modo demonstração';
    $('lf-saved-dot').style.background = S.savedAt ? '#22c55e' : '#d4d4d8';
    $('lf-saved-text').textContent = S.savedAt ? 'Salvo automaticamente' : 'Aguardando alterações';
    if (D) $('lf-csv').disabled = !D.filtered.length;
  }

  function notice(kind, title, body, extra) {
    return el('div', { class: kind, role: kind === 'alert' ? 'alert' : 'status' }, [el('strong', { text: title }), body].concat(extra || []));
  }

  function renderNotices() {
    var box = $('lf-notices'); box.textContent = '';
    if (S.mode !== 'google') box.appendChild(notice('notice', 'Modo demonstração — dados fictícios', 'Os resultados são exemplos inventados para testar o aplicativo. Nenhuma busca real foi feita. Para buscas reais, configure a chave do Google nos segredos da Edge Function leadfinder (Supabase).'));
    if (S.warning) box.appendChild(notice('notice', 'Aviso da pesquisa', S.warning));
    if (S.error) box.appendChild(el('div', { class: 'alert', role: 'alert' }, [el('strong', { text: 'Não foi possível concluir.' }), ' ' + S.error]));
  }

  function renderAside(D) {
    var reg = $('region');
    if (reg.value !== S.regionText) reg.value = S.regionText;
    var loc = $('lf-locate'); loc.disabled = S.locating; loc.textContent = S.locating ? 'Localizando…' : 'Localizar';
    $('lf-region-hint').textContent = S.regionMsg || (S.region ? 'Centro atual: ' + S.region.label + '. O raio abaixo é medido a partir daqui.' : 'Qualquer lugar do mundo: digite e clique em Localizar, ou escolha um atalho.');
    syncSeg($('lf-radii'), S.radiusKm); syncSeg($('lf-sweeps'), S.sweepKm); syncSeg($('lf-goals'), S.goal);
    var cells = D.sweepCells.length, ncat = S.selectedCategories.length;
    $('lf-sweep-hint').textContent = S.sweepKm
      ? cells + ' pontos de ' + CELL_KM + ' km' + (cells > MAX_CELLS ? ' (acima do máximo)' : '') + ' × ' + ncat + ' categorias ≈ ' + (cells * ncat) + ' chamadas pagas. Cada ponto traz até 20 por categoria.'
      : 'Cada busca cobre no máximo 50 km e 20 empresas por categoria. A varredura repete a busca em uma grade.';
    var g = LF.GOALS.filter(function (x) { return x.id === S.goal; })[0];
    $('lf-goal-hint').textContent = (g ? g.hint : '') + '.';
    var all = ncat === LF.CATEGORIES.length;
    $('lf-cat-label').textContent = 'Categorias (' + ncat + ')';
    $('lf-cat-toggle').textContent = all ? 'Limpar' : 'Todas';
    Array.prototype.forEach.call($('lf-cats').querySelectorAll('input'), function (i) { i.checked = has(S.selectedCategories, i.value); });

    var sb = $('lf-search'); sb.disabled = S.loading; sb.textContent = '';
    sb.appendChild(icon('search')); sb.appendChild(d.createTextNode(S.loading ? 'Buscando empresas…' : 'Buscar possíveis leads'));

    var slot = $('lf-sweep-slot'); slot.textContent = '';
    if (S.sweepKm > 0 && !S.loading) slot.appendChild(el('button', { type: 'button', class: 'button block secondary', disabled: !cells, 'data-fk': 'sweep', on: { click: sweepArea } }, [icon('map'), 'Varrer área de ' + S.sweepKm + ' km']));
    var ps = $('lf-progress-slot'); ps.textContent = '';
    if (S.sweepProgress) ps.appendChild(el('div', { class: 'hint', role: 'status' }, ['Varrendo… ' + S.sweepProgress.done + '/' + S.sweepProgress.total + ' pontos ',
      el('button', { type: 'button', class: 'linkbtn', text: 'Cancelar', on: { click: function () { R.cancelSweep = true; } } })]));
    var m = $('lf-message'); m.textContent = '';
    if (S.message) m.appendChild(el('div', { class: 'hint', text: S.message }));

    var tpl = $('tpl'); if (tpl.value !== S.template) tpl.value = S.template;
    ['tpl2', 'tpl3'].forEach(function (id, i) { var x = $(id); if (x && d.activeElement !== x && x.value !== S.seqTemplates[i + 1]) x.value = S.seqTemplates[i + 1]; });
    $('lf-backup').disabled = !S.leads.length;
  }

  function renderStats(D) {
    $('lf-st-total').textContent = String(S.leads.length);
    $('lf-st-priority').textContent = String(D.priority);
    $('lf-st-contacted').textContent = String(D.contacted);
    $('lf-st-followups').textContent = String(D.followUps);
    $('lf-tab-list').setAttribute('aria-selected', S.tab === 'list' ? 'true' : 'false');
    $('lf-tab-map').setAttribute('aria-selected', S.tab === 'map' ? 'true' : 'false');
    $('lf-tab-hist').setAttribute('aria-selected', S.tab === 'hist' ? 'true' : 'false');
    $('lf-tab-report').setAttribute('aria-selected', S.tab === 'report' ? 'true' : 'false');
    var q = $('lf-q'); if (q.value !== S.search) q.value = S.search;
  }

  function renderFunnel(D) {
    var box = $('lf-funnel'); box.textContent = '';
    box.hidden = S.tab === 'hist' || S.tab === 'report';
    ['Todos'].concat(LF.STATUSES).forEach(function (s) {
      var n = s === 'Todos' ? S.leads.length : D.statusCounts.get(s) || 0;
      box.appendChild(el('button', { type: 'button', class: 'fchip', 'aria-pressed': S.filter === s ? 'true' : 'false', 'data-fk': 'f|' + s, on: { click: function () { set({ filter: s }); } } }, [s, el('b', { text: String(n) })]));
    });
  }

  function extLink(href, kids, cls, onClick) {
    var safe = LF.httpUrl(href);
    if (!safe) return null;
    return el('a', { class: cls || null, href: safe, target: '_blank', rel: 'noopener noreferrer', on: onClick ? { click: onClick } : null }, kids);
  }

  function leadCard(lead, D) {
    var fake = lead.demo === true; // por lead, não pelo modo global
    var wa = fake ? null : LF.whatsappLink(lead.phone, S.template.replace(/\{nome\}/gi, lead.name));
    var due = lead.nextAction && lead.nextAction <= D.today && !has(CLOSED, lead.status);
    var isOpen = S.openNotes === lead.id;
    var busy = has(S.aiBusy, lead.id);
    var fk = function (k) { return k + '|' + lead.id; };

    var meta = el('div', { class: 'lead-meta' }, [
      lead.rating !== undefined ? el('span', { class: 'meta' }, [icon('star', 13), lead.rating.toFixed(1) + (lead.ratingCount !== undefined ? ' (' + lead.ratingCount + ')' : '')]) : null,
      lead.phone ? el('a', { class: 'meta', href: 'tel:' + lead.phone.replace(/[^\d+]/g, '') }, [icon('phone', 13), lead.phone]) : null,
      lead.website ? el('span', { class: 'meta' }, [icon('globe', 13), 'Tem site']) : el('span', { class: 'meta gap' }, [icon('globe', 13), 'Sem site']),
      fake ? el('span', { class: 'meta warn', text: 'Dado fictício' }) : null,
      D.touch.get(lead.id) && D.touch.get(lead.id).contato
        ? el('span', { class: 'meta seen', title: 'Já abordada pela equipe' }, [icon('chat', 13), 'Abordada ' + fmtWhen(D.touch.get(lead.id).contato.em) + ' · ' + who(D.touch.get(lead.id).contato.email)])
        : R.remoteIds.has(lead.id) ? el('span', { class: 'meta seen', text: 'Já na carteira' }) : null,
      (function () {
        var st = LF.seqState(lead);
        if (st.ativa && st.feito > 0) return el('span', { class: 'meta seq', title: 'Sequência de abordagem' }, [icon('chat', 13), 'Sequência ' + st.feito + '/3 · próximo: ' + st.proximo.nome + (lead.nextAction ? ' ' + fmtDate(lead.nextAction) : '')]);
        if (!st.ativa && st.motivo && st.feito > 0) return el('span', { class: 'meta', text: st.motivo });
        return null;
      })(),
      lead.raiox ? el('span', { class: 'meta gap', title: 'Raio-X: serviços indicados' }, ['Raio-X: ' + lead.raiox.servicos.map(function (x) { return LF.OFERTAS[x] ? LF.OFERTAS[x].curto : x; }).join(' · ')]) : null,
      lead.nextAction ? el('span', { class: 'meta' + (due ? ' due' : '') }, [icon('clock', 13), (due ? 'Retornar: ' : 'Retorno: ') + fmtDate(lead.nextAction)]) : null
    ]);

    var notesBtn = el('button', { type: 'button', class: 'linkbtn', 'aria-expanded': isOpen ? 'true' : 'false', 'data-fk': fk('nb'), on: { click: function () { set({ openNotes: isOpen ? null : lead.id }); } } },
      [icon('note', 13), ' ' + (lead.notes ? 'Notas ●' : 'Notas e retorno')]);

    var links = el('div', { class: 'lead-links' }, [
      fake ? null : (seqLink(lead, D) || (wa ? extLink(LF.whatsappLink(lead.phone, '') || wa, [icon('chat', 14), 'Abrir WhatsApp'], 'wa') : null)),
      el('button', { type: 'button', class: 'linkbtn strong', 'aria-expanded': S.openSell === lead.id ? 'true' : 'false', 'data-fk': fk('sell'), text: S.openSell === lead.id ? 'Fechar vender' : 'Vender (raio-X, portfólio, proposta)', on: { click: function () { set({ openSell: S.openSell === lead.id ? null : lead.id }); } } }),
      lead.website ? extLink(lead.website, ['Abrir site ', icon('out', 12)]) : null,
      lead.googleMapsUri ? extLink(lead.googleMapsUri, ['Google Maps ', icon('out', 12)]) : null,
      !fake && !lead.pending ? el('button', { type: 'button', class: 'linkbtn', disabled: busy, 'data-fk': fk('ai'), text: busy ? 'Analisando…' : lead.ai ? 'Reanalisar com IA' : 'Analisar com IA', on: { click: function () { analyze(lead); } } }) : null,
      el('button', { type: 'button', class: 'linkbtn', text: 'Excluir', 'data-fk': fk('del'), on: { click: function () { removeLead(lead); } } }),
      notesBtn
    ]);

    var sel = el('select', { 'aria-label': 'Status de ' + lead.name, class: 'select', 'data-fk': fk('st') });
    LF.STATUSES.forEach(function (s) { var o = el('option', { text: s }); o.value = s; if (s === lead.status) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { updateStatus(lead.id, sel.value); });

    var bar = el('span'); bar.style.width = lead.score + '%';
    var right = el('div', { class: 'lead-right' }, [
      el('div', { class: 'score', title: 'Pontuação de prioridade' }, [el('div', { class: 'scorebar', 'aria-hidden': 'true' }, [bar]), lead.score + '/100']),
      sel
    ]);

    var aiBox = null;
    if (lead.ai) {
      var aiWa = lead.phone && lead.ai.message ? LF.whatsappLink(lead.phone, lead.ai.message) : null;
      aiBox = el('div', { class: 'lead-notes', 'aria-label': 'Análise da IA' }, [
        el('strong', { text: 'Tier ' + lead.ai.tier + ' · fit ' + lead.ai.fit + '/100' }), ' ',
        el('span', { class: 'hint', text: '(opinião da IA com dados limitados; não prevê compra. A análise envia nome, categoria, endereço, nota, site e suas notas à Anthropic)' }),
        el('div', { text: lead.ai.reason }),
        lead.ai.opportunity ? el('div', null, [el('b', { text: 'Ideia de vídeo:' }), ' ' + lead.ai.opportunity + ' ', session ? el('button', { type: 'button', class: 'linkbtn', text: 'Guardar ideia', 'data-fk': fk('idea'), on: { click: function () { saveIdea(lead.ai.opportunity, lead); } } }) : null]) : null,
        lead.ai.message ? el('div', null, [el('b', { text: 'Mensagem sugerida:' }), ' ' + lead.ai.message + ' ', aiWa ? extLink(aiWa, ['Enviar no WhatsApp'], 'wa', onApproach(lead, 'WhatsApp (IA)', lead.ai.message)) : null]) : null,
        lead.ai.missing.length > 0 ? el('div', { class: 'hint', text: 'Falta verificar: ' + lead.ai.missing.join('; ') }) : null
      ]);
    }

    var notesBox = null;
    if (isOpen) {
      var nid = 'n-' + encodeURIComponent(lead.id), did = 'd-' + encodeURIComponent(lead.id);
      var ta = el('textarea', { id: nid, class: 'input area', rows: '3', maxlength: '1000', placeholder: 'Quem atendeu, o que respondeu, o que combinar…', 'data-fk': fk('n') });
      ta.value = lead.notes || '';
      ta.addEventListener('input', function () {
        updateLeadQuiet(lead.id, { notes: ta.value });
        var label = ta.value ? 'Notas ●' : 'Notas e retorno';
        notesBtn.lastChild.textContent = ' ' + label;
      });
      ta.addEventListener('blur', function () { commit(); }); // atualiza contagens/busca ao sair do campo
      var date = el('input', { id: did, class: 'input date', type: 'date', 'data-fk': fk('d') });
      date.value = lead.nextAction || '';
      date.addEventListener('change', function () { updateLead(lead.id, { nextAction: LF.isDate(date.value) ? date.value : undefined }); });
      notesBox = el('div', { class: 'lead-notes' }, [
        el('label', { class: 'field-label', for: nid, text: 'Notas' }), ta,
        el('div', { class: 'notes-row' }, [
          el('label', { class: 'field-label', for: did, text: 'Próxima ação' }), date,
          lead.lastContact ? el('span', { class: 'hint', text: 'Último contato: ' + fmtDate(lead.lastContact) }) : null
        ])
      ]);
    }

    return el('article', { class: 'glass lead' }, [
      el('div', null, [
        el('div', { class: 'lead-title-row' }, [el('h3', { text: lead.name }), el('span', { class: 'tag' + (fake ? ' demo-tag' : ''), text: lead.category })]),
        el('div', { class: 'lead-address' }, [icon('pin', 14), lead.address]),
        meta, links
      ]),
      right, aiBox, S.openSell === lead.id ? sellPanel(lead, D) : null, notesBox
    ]);
  }


  /** Painel "Vender" do lead: raio-X, portfólio certo e proposta. */
  function sellPanel(lead, D) {
    var fk = function (k) { return k + '|' + lead.id; };
    var rx = lead.raiox, rbusy = busy('raioxBusy', lead.id);
    var rxBox = el('div', { class: 'sell-block' }, [
      el('div', { class: 'sell-head' }, [el('h4', { text: 'Raio-X' }),
        el('button', { type: 'button', class: 'button secondary small', disabled: rbusy || lead.pending, 'data-fk': fk('rx'), text: rbusy ? 'Analisando o site…' : rx ? 'Refazer raio-X' : 'Fazer raio-X', on: { click: function () { runRaiox(lead); } } })]),
      !rx ? el('div', { class: 'hint', text: 'Lê a página inicial do site da empresa (endereço informado pelo Google), mede o que falta e liga cada falha a um serviço da Soft. Usa 1 consulta ao Google e 1 à IA.' }) : null
    ]);
    if (rx) {
      if (rx.demo) rxBox.appendChild(el('div', { class: 'hint', text: 'Lead de demonstração: o site não foi lido.' }));
      if (rx.resumo) rxBox.appendChild(el('p', { class: 'sell-text', text: rx.resumo }));
      if (rx.lacunas.length) rxBox.appendChild(el('ul', { class: 'sell-list' }, rx.lacunas.map(function (l) {
        return el('li', null, [l.titulo, l.servico && LF.OFERTAS[l.servico] ? el('span', { class: 'tag', text: LF.OFERTAS[l.servico].nome }) : null]);
      })));
      else rxBox.appendChild(el('div', { class: 'hint', text: 'Nenhuma falha objetiva encontrada no site.' }));
      if (rx.angulo) rxBox.appendChild(el('div', { class: 'sell-angle' }, [el('b', { text: 'Como abrir a conversa: ' }), rx.angulo + ' ',
        el('button', { type: 'button', class: 'linkbtn', text: 'Copiar', on: { click: function () { copyText(rx.angulo); } } })]));
      var ig = rx.sinais && rx.sinais.instagram;
      if (rx.verificar.length || ig) rxBox.appendChild(el('div', { class: 'hint' }, [el('b', { text: 'Conferir à mão: ' }), rx.verificar.join(' · ') + ' ',
        ig ? extLink('https://www.instagram.com/' + ig + '/', ['Abrir @' + ig + ' ', icon('out', 12)]) : null]));
      if (rx.em) rxBox.appendChild(el('div', { class: 'hint', text: 'Feito em ' + fmtWhen(rx.em) + (rx.sinais && rx.sinais.plataforma ? ' · site em ' + rx.sinais.plataforma : '') + (rx.sinais && rx.sinais.ms ? ' · abriu em ' + (rx.sinais.ms / 1000).toFixed(1) + ' s' : '') }));
    }

    var picks = portfolioFor(lead);
    var pfBox = el('div', { class: 'sell-block' }, [
      el('div', { class: 'sell-head' }, [el('h4', { text: 'Portfólio certo para este lead' }),
        picks.length ? el('button', { type: 'button', class: 'button secondary small', text: 'Copiar links', on: { click: function () { copyText(picks.map(function (p) { return p.item.title + ': ' + videoOf(p); }).join('\n')); } } }) : null]),
      picks.length ? el('ul', { class: 'sell-list' }, picks.map(function (p) {
        return el('li', null, [extLink(videoOf(p), [p.item.title + ' ', icon('out', 12)]), el('span', { class: 'hint', text: ' ' + (p.item.tags || '') }),
          p.direitos ? null : el('span', { class: 'meta warn', title: 'Confirme os direitos no catálogo antes de enviar ao cliente', text: 'direitos a confirmar' })]);
      })) : el('div', { class: 'hint', text: 'Catálogo de vídeos não carregado.' }),
      el('div', { class: 'hint', text: 'Escolhidos pela categoria do lead' + (rx ? ' e pelos serviços do raio-X' : '') + '. O 1º vídeo vai no passo 2 da sequência ({video}).' })
    ]);

    var servs = propServices(lead), pbusy = busy('propBusy', lead.id);
    var checks = el('div', { class: 'sell-checks' }, Object.keys(LF.OFERTAS).map(function (k) {
      var cb = el('input', { type: 'checkbox', 'data-fk': fk('ps-' + k) }); cb.checked = has(servs, k);
      cb.addEventListener('change', function () {
        var cur = propServices(lead).filter(function (x) { return x !== k; });
        if (cb.checked) cur.push(k);
        var o = Object.assign({}, S.propServs); o[lead.id] = cur; set({ propServs: o });
      });
      return el('label', { class: 'chip' }, [cb, el('span', { text: LF.OFERTAS[k].nome })]);
    }));
    var lang = el('select', { class: 'select', 'aria-label': 'Idioma da proposta', 'data-fk': fk('lang') });
    [['pt-BR', 'Português'], ['en', 'English'], ['fr', 'Français']].forEach(function (x) { var o = el('option', { text: x[1] }); o.value = x[0]; if (x[0] === S.propLang) o.selected = true; lang.appendChild(o); });
    lang.addEventListener('change', function () { set({ propLang: lang.value }); });
    var prBox = el('div', { class: 'sell-block' }, [
      el('div', { class: 'sell-head' }, [el('h4', { text: 'Proposta' })]),
      checks,
      el('div', { class: 'sell-row' }, [lang,
        el('button', { type: 'button', class: 'button small', disabled: pbusy, 'data-fk': fk('prop'), text: pbusy ? 'Gerando…' : 'Gerar proposta', on: { click: function () { gerarProposta(lead); } } })]),
      el('div', { class: 'hint', text: 'Abre a proposta na marca Soft, com o diagnóstico do raio-X e os vídeos acima. Tudo é editável antes de salvar em PDF. Preços e entregáveis vêm de assets/js/leadfinder/ofertas.js (vazio = "sob consulta").' })
    ]);
    return el('section', { class: 'sell', 'aria-label': 'Vender para ' + lead.name }, [rxBox, pfBox, prBox]);
  }

  function copyText(t) {
    var done = function () { notify({ level: 'success', title: 'Copiado' }); };
    if (w.navigator.clipboard && w.navigator.clipboard.writeText) w.navigator.clipboard.writeText(t).then(done, function () { w.prompt('Copie:', t); });
    else w.prompt('Copie:', t);
  }

  /** Quadro "Hoje" no topo da lista (o mesmo conteúdo do e-mail diário). */
  function todayBox(D) {
    var t = todayInfo(D);
    if (!t.due.length && !t.hot.length && S.quick !== 'hoje') return null;
    var parts = [];
    if (t.due.length) parts.push(t.due.length + ' retorno(s)' + (t.seqDue ? ' · ' + t.seqDue + ' da sequência' : ''));
    if (t.hot.length) parts.push(t.hot.length + ' lead(s) quente(s) sem contato');
    return el('div', { class: 'glass today', role: 'status' }, [
      el('div', null, [el('strong', { text: 'Hoje: ' }), parts.join(' · ') || 'nada pendente']),
      el('div', { class: 'today-actions' }, [
        el('button', { type: 'button', class: 'button secondary small', 'data-fk': 'quick', text: S.quick === 'hoje' ? 'Mostrar todos' : 'Só os de hoje', on: { click: function () { set({ quick: S.quick === 'hoje' ? '' : 'hoje' }); } } }),
        session ? el('button', { type: 'button', class: 'linkbtn', text: 'Enviar este resumo para meu e-mail', on: { click: sendDigestTest } }) : null
      ])
    ]);
  }

  function renderRoute(view, D) {
    var cands = routeCandidates(D), sel = routeSel(D), r = S.route.result;
    var byId = new Map(cands.map(function (l) { return [l.id, l]; }));
    var box = el('section', { class: 'glass route', 'aria-labelledby': 'route-t' });
    box.appendChild(el('div', { class: 'sell-head' }, [el('h3', { id: 'route-t', text: 'Rota do dia' }),
      el('span', { class: 'hint', text: sel.size + '/' + LF.ROUTE_MAX + ' paradas' })]));
    var startSeg = el('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Ponto de partida' }, [['region', 'Centro da busca'], ['gps', 'Minha localização']].map(function (x) {
      var input = el('input', { type: 'radio', name: 'route-start', checked: S.route.start === x[0], 'data-fk': 'rs|' + x[0] });
      input.addEventListener('change', function () { if (x[0] === 'gps' && !S.route.gps) useGps(); else setRoute({ start: x[0], result: null }); });
      return el('label', null, [input, el('span', { text: x[1] })]);
    }));
    var mode = el('select', { class: 'select', 'aria-label': 'Meio de transporte', 'data-fk': 'rmode' });
    [['driving', 'Carro'], ['walking', 'A pé'], ['two-wheeler', 'Moto'], ['transit', 'Transporte público']].forEach(function (x) { var o = el('option', { text: x[1] }); o.value = x[0]; if (x[0] === S.route.mode) o.selected = true; mode.appendChild(o); });
    mode.addEventListener('change', function () { setRoute({ mode: mode.value, result: null }); });
    box.appendChild(el('div', { class: 'sell-row' }, [startSeg, mode]));

    if (!cands.length) box.appendChild(el('div', { class: 'hint', text: 'Nenhum lead da lista atual tem localização. Faça uma busca ou carregue as empresas salvas.' }));
    else {
      box.appendChild(el('ul', { class: 'route-pick' }, cands.slice(0, 60).map(function (l) {
        var cb = el('input', { type: 'checkbox', 'data-fk': 'rp|' + l.id }); cb.checked = sel.has(l.id);
        cb.disabled = !sel.has(l.id) && sel.size >= LF.ROUTE_MAX;
        cb.addEventListener('change', function () { var n = new Set(S.route.sel || sel); if (cb.checked) { if (n.size >= LF.ROUTE_MAX) { cb.checked = false; return; } n.add(l.id); } else n.delete(l.id); setRoute({ sel: n, result: null }); });
        var due = l.nextAction && l.nextAction <= D.today;
        return el('li', null, [el('label', null, [cb, ' ' + l.name]), due ? el('span', { class: 'meta due', text: 'retorno ' + fmtDate(l.nextAction) }) : null, el('span', { class: 'hint', text: ' ' + l.category })]);
      })));
      box.appendChild(el('div', { class: 'sell-row' }, [
        el('button', { type: 'button', class: 'button small', text: 'Montar rota', 'data-fk': 'rbuild', on: { click: function () { buildRoute(D); } } }),
        el('button', { type: 'button', class: 'linkbtn', text: 'Limpar seleção', on: { click: function () { setRoute({ sel: new Set(), result: null }); } } })
      ]));
    }
    if (r) {
      var ordered = r.order.map(function (id) { return byId.get(id); }).filter(Boolean);
      var prev = r.start;
      box.appendChild(el('ol', { class: 'route-list' }, ordered.map(function (l) {
        var dkm = LF.distanceKm(prev.lat, prev.lng, l.lat, l.lng); prev = l;
        return el('li', null, [el('b', { text: l.name }), el('span', { class: 'hint', text: ' · ' + (l.address || '') + ' · +' + dkm.toFixed(1) + ' km' })]);
      })));
      box.appendChild(el('div', { class: 'sell-row' }, [
        extLink(r.url, [icon('out', 14), ' Abrir no Google Maps'], 'button small'),
        el('button', { type: 'button', class: 'button secondary small', text: 'Copiar roteiro', on: { click: function () { copyText(ordered.map(function (l, i) { return (i + 1) + '. ' + l.name + (l.address ? ' — ' + l.address : ''); }).join('\n') + '\n\n' + r.url); } } }),
        el('span', { class: 'hint', text: '≈ ' + r.km.toFixed(1) + ' km em linha reta (estimativa; o Google Maps mostra o trajeto real)' })
      ]));
      if (ordered.length > 10) box.appendChild(el('div', { class: 'hint', text: 'O Google Maps abre no máximo 10 paradas por link.' }));
    }
    view.appendChild(box);
  }

  function renderReport(view) {
    var months = [], now = new Date();
    for (var i = 0; i < 12; i++) { var m = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push(m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0')); }
    var cur = S.reportMonth || months[0];
    var sel = el('select', { class: 'select', 'aria-label': 'Mês do relatório', 'data-fk': 'rmonth' });
    months.forEach(function (ym) { var o = el('option', { text: new Date(+ym.slice(0, 4), +ym.slice(5) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }); o.value = ym; if (ym === cur) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { S.reportMonth = sel.value; loadReport(); });
    view.appendChild(el('div', { class: 'toolbar' }, [el('h2', { text: 'Relatório do mês' }), el('div', { class: 'toolbar-right no-print' }, [sel,
      el('button', { type: 'button', class: 'button secondary', text: 'Exportar CSV', disabled: !S.report, on: { click: exportReportCsv } }),
      el('button', { type: 'button', class: 'button secondary', text: 'Imprimir / PDF', disabled: !S.report, on: { click: function () { d.body.classList.add('lf-print-report'); w.print(); d.body.classList.remove('lf-print-report'); } } })])]));
    if (!session) { view.appendChild(el('div', { class: 'hint', text: 'Entre no painel para ver o relatório.' })); return; }
    if (S.reportBusy || !S.report || S.report.ym !== cur) {
      view.appendChild(el('div', { class: 'glass skeleton', 'aria-hidden': 'true' }));
      if (!S.reportBusy) loadReport();
      return;
    }
    var r = S.report.data;
    view.appendChild(el('div', { class: 'stats hist-stats' }, [
      [r.abordados, 'Empresas abordadas', r.abordagens + ' mensagem(ns)'], [r.responderam, 'Responderam', pct(r.taxaResposta) + ' das abordadas'],
      [r.reunioes, 'Reuniões marcadas', 'no mês'], [r.clientes, 'Clientes fechados', 'no mês']
    ].map(function (x) { return el('div', { class: 'glass stat' }, [el('div', { class: 'stat-label', text: x[1] }), el('div', { class: 'stat-value', text: String(x[0]) }), el('div', { class: 'stat-note', text: x[2] })]); })));

    // Funil: uma série, uma cor, número escrito ao lado (não depende da cor)
    var steps = [['Abordadas', r.abordados], ['Responderam', r.responderam], ['Reunião', r.reunioes], ['Cliente', r.clientes]];
    var max = Math.max(1, r.abordados, r.responderam, r.reunioes, r.clientes);
    view.appendChild(el('section', { class: 'glass hist-box', 'aria-labelledby': 'rep-f' }, [el('h3', { id: 'rep-f', text: 'Funil do mês' }),
      el('div', { class: 'funnel-chart', role: 'img', 'aria-label': steps.map(function (x) { return x[0] + ': ' + x[1]; }).join(', ') }, steps.map(function (x) {
        var bar = el('span', { class: 'fbar' }); bar.style.width = Math.max(x[1] ? 2 : 0, x[1] / max * 100) + '%';
        return el('div', { class: 'frow', title: x[0] + ': ' + x[1] + (r.abordados ? ' (' + pct(x[1] / r.abordados) + ' das abordadas)' : '') }, [el('span', { class: 'flabel', text: x[0] }), el('span', { class: 'ftrack' }, [bar]), el('b', { class: 'fval', text: String(x[1]) })]);
      })),
      el('div', { class: 'hint', text: 'Contagens = o que aconteceu no mês. "Responderam" = empresas abordadas no mês que responderam depois do contato (até hoje). Com menos de 5 abordagens, as taxas são só indicativas.' }),
      el('div', { class: 'hint', text: r.buscas + ' busca(s) em ' + r.areas + ' área(s) · ' + r.propostas + ' proposta(s) · ' + r.raiox + ' raio-X · ' + r.ideias + ' ideia(s) · ' + r.descartados + ' descartado(s)' })
    ]));

    function table(title, cols, rows) {
      var t = el('table', { class: 'rep-table' });
      t.appendChild(el('thead', null, [el('tr', null, cols.map(function (c) { return el('th', { scope: 'col', text: c }); }))]));
      t.appendChild(el('tbody', null, rows.length ? rows.map(function (rw) { return el('tr', null, rw.map(function (v, i) { return el(i ? 'td' : 'th', i ? { text: String(v) } : { scope: 'row', text: String(v) }); })); })
        : [el('tr', null, [el('td', { colspan: String(cols.length), text: 'Sem dados neste mês.' })])]));
      return el('section', { class: 'glass hist-box' }, [el('h3', { text: title }), el('div', { class: 'table-wrap' }, [t])]);
    }
    var rate = function (m) { return [m.chave, m.abordados, m.responderam, pct(m.taxa)]; };
    view.appendChild(table('Qual mensagem funciona mais', ['Mensagem ({nome} = empresa)', 'Abordadas', 'Responderam', 'Taxa'], r.porMensagem.map(rate)));
    view.appendChild(table('Por categoria', ['Categoria', 'Abordadas', 'Responderam', 'Taxa'], r.porCategoria.map(rate)));
    view.appendChild(table('Por canal / passo', ['Canal', 'Abordadas', 'Responderam', 'Taxa'], r.porCanal.map(rate)));
    view.appendChild(table('Por pessoa', ['Pessoa', 'Mensagens'], r.porPessoa.map(function (m) { return [m.pessoa, m.abordagens]; })));
    view.appendChild(table('Áreas mais pesquisadas', ['Área', 'Buscas'], r.topAreas.map(function (m) { return [m.area, m.buscas]; })));
  }

  function renderList(view, D) {
    var sort = el('select', { class: 'select', 'data-fk': 'sort' });
    SORTS.forEach(function (s) { var o = el('option', { text: s.label }); o.value = s.id; if (s.id === S.sort) o.selected = true; sort.appendChild(o); });
    sort.addEventListener('change', function () { set({ sort: sort.value }); });
    var only = el('input', { type: 'checkbox', 'data-fk': 'onlynew' }); only.checked = S.onlyNew;
    only.addEventListener('change', function () { set({ onlyNew: only.checked }); });
    view.appendChild(el('div', { class: 'toolbar' }, [el('h2', { text: 'Leads para avaliar' }), el('div', { class: 'toolbar-right' }, [
      el('label', { class: 'sortbox', title: 'Esconde empresas que já estão na carteira, mudaram de status ou já foram abordadas' }, [only, 'Só novos']),
      el('label', { class: 'sortbox' }, ['Ordenar', sort])])]));

    var tb = todayBox(D); if (tb) view.appendChild(tb);
    if (D.pendingCount > 0 && !S.hydrating) {
      view.appendChild(el('div', { class: 'notice', role: 'status' }, [
        el('strong', { text: D.pendingCount + ' empresa(s) salva(s) ainda não carregada(s)' }),
        'Os termos do Google só permitem guardar o ID; os dados são buscados de novo (1 chamada paga por empresa). ',
        el('button', { type: 'button', class: 'linkbtn', text: 'Carregar / tentar de novo', on: { click: function () { R.hydrated.clear(); set({ autoHydrate: true }); } } })
      ]));
    }
    if (S.leads.some(function (l) { return !l.demo; })) view.appendChild(el('div', { class: 'hint', text: 'Dados de empresas: Google Maps.' }));

    var list = el('div', { class: 'lead-list' });
    if (S.loading && !S.sweepProgress) {
      for (var i = 0; i < 3; i++) list.appendChild(el('div', { class: 'glass skeleton', 'aria-hidden': 'true' }));
    } else if (D.filtered.length) {
      D.filtered.forEach(function (lead) { list.appendChild(leadCard(lead, D)); });
    } else {
      list.appendChild(el('div', { class: 'glass empty' }, [el('strong', { text: 'Nenhum lead para mostrar' }), 'Faça uma busca ou ajuste os filtros.']));
    }
    view.appendChild(list);
  }

  function renderMap(view, D) {
    view.appendChild(el('div', { class: 'toolbar' }, [el('h2', { text: 'Mapa e rota do dia' })]));
    renderRoute(view, D);
    var wrap = el('div', { class: 'glass mapwrap' });
    view.appendChild(wrap);
    var real = D.filtered.filter(function (l) { return !l.demo; });
    if (real.length) {
      // termos do Google: leads reais só em mapa Google
      if (MAPS_KEY) wrap.appendChild(LF.googleLeadMap(real, S.region, MAPS_KEY));
      else wrap.appendChild(el('div', { class: 'map empty', text: 'Para ver os leads reais no mapa, configure googleMapsBrowserKey em assets/js/config.js (os termos do Google exigem mapa Google).' }));
    } else {
      wrap.appendChild(LF.leadMap(D.filtered, S.region));
      wrap.appendChild(el('div', { class: 'map-note', text: 'Marcadores aparecem quando a API retorna coordenadas. Mapa: OpenStreetMap (dados fictícios).' }));
    }
  }


  function histLeadLabel(h) {
    var l = h.place_id ? S.leads.filter(function (x) { return x.id === h.place_id; })[0] : null;
    if (l && l.name) return l.name;
    return h.place_id ? 'Empresa salva' + (h.categoria ? ' (' + h.categoria + ')' : '') : '';
  }
  function histText(h) {
    if (h.tipo === 'status') return h.de ? 'mudou de "' + h.de + '" para "' + h.para + '"' : 'entrou na carteira como "' + h.para + '"';
    if (h.tipo === 'contato') return 'abordou' + (h.de ? ' pelo ' + h.de : '');
    if (h.tipo === 'busca') return 'pesquisou ' + (h.texto || '?') + ' · ' + (h.de || '') + ' · ' + (h.para || '?') + ' lead(s)';
    return 'guardou uma ideia';
  }
  var HIST_LABEL = { status: 'Status', contato: 'Abordagem', ideia: 'Ideia', busca: 'Busca' };

  function renderHistory(view, D) {
    view.appendChild(el('div', { class: 'toolbar' }, [el('h2', { text: 'Histórico da equipe' }),
      el('button', { type: 'button', class: 'button secondary', text: 'Atualizar', on: { click: loadHistory } })]));
    view.appendChild(el('div', { class: 'hint', text: 'Tudo o que a equipe já pesquisou, abordou e pensou, para ninguém repetir. Guardamos só o ID da empresa no Google, nunca os dados dela.' }));

    var contatos = new Set(), areas = new Map(), ideas = [];
    S.hist.forEach(function (h) {
      if (h.tipo === 'contato' && h.place_id) contatos.add(h.place_id);
      if (h.tipo === 'ideia') ideas.push(h);
      if (h.tipo === 'busca' && h.texto) {
        var k = h.texto.toLocaleLowerCase('pt-BR'); var a = areas.get(k);
        if (!a) areas.set(k, { label: h.texto, n: 1, last: h }); else a.n++;
      }
    });
    view.appendChild(el('div', { class: 'stats hist-stats' }, [
      [R.remoteIds.size, 'Na carteira'], [contatos.size, 'Empresas abordadas'], [areas.size, 'Áreas pesquisadas'], [ideas.length, 'Ideias']
    ].map(function (x) { return el('div', { class: 'glass stat' }, [el('div', { class: 'stat-label', text: x[1] }), el('div', { class: 'stat-value', text: String(x[0]) })]); })));

    // Ideias
    var ta = el('textarea', { id: 'lf-idea', class: 'input area', rows: '3', maxlength: '1000', placeholder: 'Ideia de abordagem, pauta, vídeo, oferta…', 'data-fk': 'idea' });
    ta.value = S.ideaDraft;
    var warn = el('div', { class: 'hint hist-warn', 'aria-live': 'polite' });
    function showSimilar() {
      var sims = similarIdeas(ta.value); warn.textContent = '';
      if (sims.length) warn.appendChild(el('span', null, [el('b', { text: 'Parecida com: ' }), sims.map(function (h) { return '"' + String(h.texto).slice(0, 90) + '" (' + who(h.email) + ', ' + fmtWhen(h.em) + ')'; }).join(' · ')]));
    }
    ta.addEventListener('input', function () { S.ideaDraft = ta.value; showSimilar(); });
    showSimilar();
    var save = el('button', { type: 'button', class: 'button', text: 'Guardar ideia', on: { click: function () {
      saveIdea(ta.value, null).then(function (x) { if (x) { S.ideaDraft = ''; commit(); } });
    } } });
    var me = myEmail().toLowerCase();
    var ideaList = el('div', { class: 'hist-list' }, ideas.slice(0, 60).map(function (h) {
      var lbl = histLeadLabel(h);
      return el('div', { class: 'hist-item' }, [
        el('div', { class: 'hist-text', text: h.texto || '' }),
        el('div', { class: 'hist-meta' }, [who(h.email) + ' · ' + fmtWhen(h.em) + (lbl ? ' · ' + lbl : ''),
          String(h.email || '').toLowerCase() === me ? el('button', { type: 'button', class: 'linkbtn', text: 'Apagar', on: { click: function () { deleteIdea(h); } } }) : null])
      ]);
    }));
    view.appendChild(el('section', { class: 'glass hist-box', 'aria-labelledby': 'h-ideias' }, [
      el('h3', { id: 'h-ideias', text: 'Ideias' }),
      el('label', { class: 'field-label', for: 'lf-idea', text: 'Nova ideia (aviso se parecer com uma já guardada)' }), ta, warn,
      el('div', { class: 'hist-actions' }, [save]),
      ideas.length ? ideaList : el('div', { class: 'hint', text: 'Nenhuma ideia guardada ainda.' })
    ]));

    // Áreas já pesquisadas
    var areaList = Array.from(areas.values()).sort(function (a, b) { return String(b.last.em).localeCompare(String(a.last.em)); }).slice(0, 40);
    view.appendChild(el('section', { class: 'glass hist-box', 'aria-labelledby': 'h-areas' }, [
      el('h3', { id: 'h-areas', text: 'Áreas já pesquisadas' }),
      areaList.length ? el('div', { class: 'hist-chips' }, areaList.map(function (a) {
        return el('span', { class: 'meta', title: 'Última: ' + fmtWhen(a.last.em) + ' por ' + who(a.last.email) }, [a.label + ' · ' + a.n + 'x · ' + fmtWhen(a.last.em)]);
      })) : el('div', { class: 'hint', text: 'Nenhuma busca real registrada ainda.' })
    ]));

    // Linha do tempo
    var chips = el('div', { class: 'funnel', role: 'group', 'aria-label': 'Filtrar histórico' }, HIST_TYPES.map(function (t) {
      return el('button', { type: 'button', class: 'fchip', 'aria-pressed': S.histFilter === t.id ? 'true' : 'false', 'data-fk': 'hf|' + t.id, on: { click: function () { set({ histFilter: t.id }); } } }, [t.label]);
    }));
    var q = el('input', { class: 'input', placeholder: 'Buscar no histórico (empresa, pessoa, área, ideia)…', 'aria-label': 'Buscar no histórico', 'data-fk': 'hq' });
    q.value = S.histQ;
    q.addEventListener('input', function () { set({ histQ: q.value }); });
    var term = S.histQ.trim().toLocaleLowerCase('pt-BR');
    var items = S.hist.filter(function (h) {
      if (S.histFilter !== 'Todos' && h.tipo !== S.histFilter) return false;
      if (!term) return true;
      return [histLeadLabel(h), h.email, h.texto, h.de, h.para, h.categoria].some(function (v) { return String(v || '').toLocaleLowerCase('pt-BR').indexOf(term) >= 0; });
    }).slice(0, 200);
    view.appendChild(el('section', { class: 'glass hist-box', 'aria-labelledby': 'h-tl' }, [
      el('h3', { id: 'h-tl', text: 'Linha do tempo' }), chips, q,
      items.length ? el('ol', { class: 'hist-list hist-tl' }, items.map(function (h) {
        var lbl = histLeadLabel(h);
        return el('li', { class: 'hist-item' }, [
          el('div', { class: 'hist-meta' }, [el('span', { class: 'tag', text: HIST_LABEL[h.tipo] || h.tipo }), fmtWhen(h.em) + ' · ' + who(h.email)]),
          el('div', { class: 'hist-text' }, [lbl ? el('b', { text: lbl + ' ' }) : null, histText(h)]),
          h.tipo !== 'busca' && h.tipo !== 'ideia' && h.texto ? el('div', { class: 'hint', text: '"' + h.texto.slice(0, 220) + '"' }) : null,
          h.tipo === 'ideia' ? el('div', { class: 'hint', text: h.texto || '' }) : null
        ]);
      })) : el('div', { class: 'hint', text: session ? 'Nada no histórico com esse filtro.' : 'Entre no painel para ver o histórico.' })
    ]));
  }

  /** Guarda o controle focado (data-fk) para devolver o foco após redesenhar. */
  function captureFocus() {
    var a = d.activeElement;
    if (!a || !a.getAttribute || !a.getAttribute('data-fk')) return null;
    var f = { key: a.getAttribute('data-fk'), node: a };
    try { f.start = a.selectionStart; f.end = a.selectionEnd; } catch (e) { /* select/botão */ }
    return f;
  }
  function restoreFocus(f) {
    if (!f || d.body.contains(f.node)) return;
    var nodes = d.querySelectorAll('[data-fk]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute('data-fk') === f.key) {
        nodes[i].focus();
        try { if (typeof f.start === 'number') nodes[i].setSelectionRange(f.start, f.end); } catch (e) { /* ignora */ }
        return;
      }
    }
  }

  function render() {
    if (!R.started || R.crashed) return;
    var f = captureFocus();
    try {
      var D = derive();
      renderTop(D); renderNotices(); renderAside(D); renderStats(D); renderFunnel(D);
      var view = $('lf-view'); view.textContent = '';
      if (S.tab === 'list') renderList(view, D); else if (S.tab === 'hist') renderHistory(view, D); else if (S.tab === 'report') renderReport(view); else renderMap(view, D);
    } catch (e) {
      crash(e);
      return;
    }
    restoreFocus(f);
  }

  // Rede de segurança (equivale ao app/error.tsx): a tela não some e o bug é notificado.
  function crash(e) {
    R.crashed = true;
    notify({ level: 'error', title: 'A tela travou', detail: e && e.message ? e.message : String(e), source: 'error-boundary' });
    $('lf-body').hidden = true;
    var box = $('lf-crash');
    if (!box) {
      box = el('div', { id: 'lf-crash', class: 'glass empty lf-crash' }, [
        el('strong', { text: 'Algo deu errado nesta tela' }),
        'O erro já foi registrado. Seus leads salvos continuam no navegador.',
        el('div', { style: { marginTop: '16px' } }, [el('button', { type: 'button', class: 'button', text: 'Tentar de novo', on: { click: function () { R.crashed = false; box.remove(); $('lf-body').hidden = false; render(); } } })])
      ]);
      $('lf-body').parentNode.insertBefore(box, $('lf-body'));
    }
  }

  /* ============================================================
     Montagem (uma vez) dos controles fixos
     ============================================================ */
  function mountControls() {
    var dl = $('region-list');
    LF.REGIONS.forEach(function (r) { var o = d.createElement('option'); o.value = r.label; dl.appendChild(o); });

    var reg = $('region');
    reg.addEventListener('input', function () {
      var v = reg.value; var k = LF.findRegion(v);
      if (k) set({ regionText: v, region: k, regionMsg: 'Centro definido: ' + k.label + '.' });
      else set({ regionText: v, region: null, regionMsg: 'Clique em Localizar para definir este lugar.' });
    });
    reg.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); locateRegion(); } });
    $('lf-locate').addEventListener('click', locateRegion);

    seg('radius', RADII.map(function (r) { return { id: r, label: r + ' km' }; }), S.radiusKm, function (v) { set({ radiusKm: v }); }).forEach(function (n) { $('lf-radii').appendChild(n); });
    seg('sweep', SWEEPS.map(function (k) { return { id: k, label: k ? k + ' km' : 'Não' }; }), S.sweepKm, function (v) { set({ sweepKm: v }); }).forEach(function (n) { $('lf-sweeps').appendChild(n); });
    seg('goal', LF.GOALS, S.goal, function (v) { set({ goal: v }); }).forEach(function (n) { $('lf-goals').appendChild(n); });

    var cats = $('lf-cats');
    LF.CATEGORIES.forEach(function (c) {
      var cb = el('input', { type: 'checkbox', value: c, checked: has(S.selectedCategories, c) });
      cb.addEventListener('change', function () {
        set({ selectedCategories: cb.checked ? S.selectedCategories.concat(has(S.selectedCategories, c) ? [] : [c]) : S.selectedCategories.filter(function (x) { return x !== c; }) });
      });
      cats.appendChild(el('label', { class: 'chip' }, [cb, el('span', { text: c })]));
    });
    $('lf-cat-toggle').addEventListener('click', function () { set({ selectedCategories: S.selectedCategories.length === LF.CATEGORIES.length ? [] : LF.CATEGORIES.slice() }); });

    $('lf-search').addEventListener('click', searchLeads);
    $('tpl').addEventListener('input', function () { var v = $('tpl').value; var t = S.seqTemplates.slice(); t[0] = v || LF.SEQ_DEFAULTS[0]; set({ template: v, seqTemplates: t }); });
    ['tpl2', 'tpl3'].forEach(function (id, i) {
      $(id).addEventListener('input', function () { var t = S.seqTemplates.slice(); t[i + 1] = $(id).value || LF.SEQ_DEFAULTS[i + 1]; set({ seqTemplates: t }); });
    });
    $('lf-backup').addEventListener('click', exportBackup);
    $('lf-restore').addEventListener('click', function () { $('lf-file').click(); });
    $('lf-file').addEventListener('change', function () { var f = $('lf-file').files && $('lf-file').files[0]; if (f) importBackup(f); });
    $('lf-csv').addEventListener('click', exportCsv);
    $('lf-tab-list').addEventListener('click', function () { set({ tab: 'list' }); });
    $('lf-tab-map').addEventListener('click', function () { set({ tab: 'map' }); });
    $('lf-tab-hist').addEventListener('click', function () { set({ tab: 'hist' }); if (!S.hist.length) loadHistory(); });
    $('lf-tab-report').addEventListener('click', function () { set({ tab: 'report' }); });
    $('lf-q').addEventListener('input', function () { set({ search: $('lf-q').value }); });
    $('lf-logout').addEventListener('click', logout);
  }

  /* ============================================================
     Login × app
     ============================================================ */
  function loginMsg(text, isErr) {
    var m = $('lf-login-msg'); if (!m) return;
    m.textContent = text || '';
    m.classList.toggle('err', !!isErr);
  }
  function showLogin(text) {
    $('lf-app').hidden = true; $('lf-login').hidden = true;
    if (w.AdminAuth) w.AdminAuth.lock(text);
  }
  function showApp() {
    $('lf-login').hidden = true; $('lf-app').hidden = false;
    if (!R.started) {
      R.started = true;
      loadLocal();
      render();
      scheduleSave();
    } else commit();
    pullRemote().then(function () { maybeHydrate(); });
    loadHistory();
  }

  function bindLogin() { /* login fica no admin-auth.js */ }

  function start() {
    LF.notifyMount({ toasts: $('lf-toasts'), bell: $('lf-bell'), button: $('lf-bell-btn'), sendBug: sendBug });
    mountControls();
    bindLogin();
    if (!URL_SB || !ANON) { showLogin('Supabase não configurado em assets/js/config.js.'); return; }
    consumeHash();
    if (!session) session = loadSession();
    if (session) showApp(); else if (w.AdminAuth) w.AdminAuth.lock(); else showLogin();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})(window, document);
