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
  var SESSION_KEY = 'soft_leads_session_v1';
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
  var SYNC_FIELDS = ['status', 'notes', 'nextAction', 'lastContact', 'ai'];

  /** Termos do Google Places: só o place_id pode ser guardado. Leads reais vão para o disco/backup/tabela sem os dados da empresa. */
  function stripAi(a) { return a ? { tier: a.tier, fit: a.fit, reason: '', opportunity: '', message: '', missing: [] } : undefined; } // textos da IA contêm dados do Places: não persistem
  function forStorage(l) {
    return l.demo ? l : { id: l.id, name: '', address: '', category: l.category, score: 0, status: l.status, notes: l.notes, nextAction: l.nextAction, lastContact: l.lastContact, pending: true, ai: stripAi(l.ai) };
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
    loaded: false, savedAt: null, hydrating: false, autoHydrate: false, aiBusy: []
  };
  var R = { cancelSweep: false, hydrated: new Set(), saveErrorShown: false, remoteIds: new Set(), started: false, crashed: false };
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
  function saveSession(s) { session = s; try { if (s) w.localStorage.setItem(SESSION_KEY, JSON.stringify(s)); else w.localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignora */ } }
  function loadSession() {
    try {
      var s = JSON.parse(w.localStorage.getItem(SESSION_KEY) || 'null');
      return s && typeof s.access_token === 'string' && typeof s.expires_at === 'number' ? s : null;
    } catch (e) { return null; }
  }

  function consumeHash() {
    var h = w.location.hash || '';
    if (h.indexOf('access_token=') < 0 && h.indexOf('error') < 0) return;
    var p = {};
    h.replace(/^#/, '').split('&').forEach(function (kv) { var a = kv.split('='); try { p[a[0]] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); } catch (e) { /* ignora */ } });
    try { w.history.replaceState(null, '', w.location.pathname + w.location.search); } catch (e) { /* ignora */ }
    if (p.error_description) { loginMsg('Link inválido ou expirado: ' + p.error_description, true); return; }
    if (p.access_token) saveSession({ access_token: p.access_token, refresh_token: p.refresh_token || '', expires_at: Math.floor(Date.now() / 1000) + (+p.expires_in || 3600) });
  }

  /** Access token válido (renova com o refresh_token quando falta menos de 1 min). */
  function token() {
    var s = session;
    if (!s) return Promise.reject(new Error('Entre com seu e-mail.'));
    if (s.expires_at * 1000 > Date.now() + 60000) return Promise.resolve(s.access_token);
    if (!s.refresh_token) { saveSession(null); return Promise.reject(new Error('Sessão expirada. Entre de novo.')); }
    return fetch(URL_SB + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.access_token) throw new Error('Sessão expirada. Entre de novo.'); return j; }); })
      .then(function (j) {
        saveSession({ access_token: j.access_token, refresh_token: j.refresh_token || s.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600) });
        return j.access_token;
      }, function (e) { saveSession(null); throw e; });
  }

  function sendLink(email) {
    var redirect = w.location.origin + w.location.pathname;
    return fetch(URL_SB + '/auth/v1/otp?redirect_to=' + encodeURIComponent(redirect), {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, create_user: false })
    }).then(function (r) { if (!r.ok && r.status !== 400 && r.status !== 422) throw new Error('Não foi possível enviar agora. Tente em instantes.'); });
  }

  function logout() {
    var t = session && session.access_token;
    if (t) fetch(URL_SB + '/auth/v1/logout', { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + t } }).catch(function () {});
    saveSession(null);
    showLogin('Você saiu. Seus leads continuam salvos neste navegador.');
  }

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
      try { w.localStorage.setItem(STORAGE_KEY, JSON.stringify({ leads: S.leads.map(forStorage), mode: S.mode, template: S.template, region: S.region })); S.savedAt = Date.now(); renderTop(); }
      catch (e) {
        if (!R.saveErrorShown) { R.saveErrorShown = true; notify({ level: 'error', title: 'Não consegui salvar no navegador', detail: 'Espaço cheio ou armazenamento bloqueado. Faça um backup agora.', source: 'autosave' }); }
      }
    }, 500);
  }

  /* ============================================================
     Carteira compartilhada (public.leadfinder_leads)
     ============================================================ */
  function isReal(l) { return l && !l.demo && PLACE_ID_RE.test(l.id); }
  function worthSync(l) { return l.status !== 'Novo' || !!l.notes || !!l.nextAction || !!l.lastContact || !!l.ai; }
  function toRow(l) {
    return { place_id: l.id, categoria: l.category, status: l.status, notas: l.notes || null, proxima_acao: l.nextAction || null, ultimo_contato: l.lastContact || null, ia: stripAi(l.ai) || null };
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
    }, function (e) {
      var st = isApiError(e) ? e.status : 0;
      notify({ level: st >= 400 && st < 500 ? 'warn' : 'error', title: 'Não sincronizei com a carteira da equipe', detail: (e && e.message ? e.message : 'Sem conexão.') + ' As mudanças continuam salvas neste navegador.', source: 'sync' });
    });
  }

  /** Ao abrir: lê a tabela e mescla com o localStorage (o remoto ganha quando existir). */
  function pullRemote() {
    return rest('GET', TABLE + '?select=place_id,categoria,status,notas,proxima_acao,ultimo_contato,ia').then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) return;
      var byId = new Map(S.leads.map(function (l) { return [l.id, l]; }));
      var added = false;
      rows.forEach(function (row) {
        if (!row || typeof row.place_id !== 'string' || !PLACE_ID_RE.test(row.place_id)) return;
        var remote = LF.sanitizeLead({ id: row.place_id, name: '', pending: true, category: row.categoria, status: row.status, notes: row.notas || undefined, nextAction: row.proxima_acao, lastContact: row.ultimo_contato, ai: row.ia });
        if (!remote) return;
        R.remoteIds.add(remote.id);
        var local = byId.get(remote.id);
        if (local && !local.demo) {
          // mantém os textos da IA locais se a análise remota for a mesma (a tabela guarda só tier/fit)
          var ai = remote.ai ? (local.ai && local.ai.tier === remote.ai.tier && local.ai.fit === remote.ai.fit ? local.ai : remote.ai) : local.ai;
          byId.set(remote.id, Object.assign({}, local, { status: remote.status, notes: remote.notes, nextAction: remote.nextAction, lastContact: remote.lastContact, ai: ai }));
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
                if (byId.has(l.id)) return LF.sanitizeLead(Object.assign({}, l, byId.get(l.id), { id: l.id, demo: l.demo, pending: false, status: l.status, notes: l.notes, nextAction: l.nextAction, lastContact: l.lastContact, ai: l.ai })) || l;
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
     Derivados (useMemo do original)
     ============================================================ */
  function derive() {
    var scored = S.leads.map(function (l) { return Object.assign({}, l, { score: l.pending ? 0 : LF.scoreLead(l, S.goal) }); });
    var today = LF.todayLocal();
    var statusCounts = new Map();
    scored.forEach(function (l) { statusCounts.set(l.status, (statusCounts.get(l.status) || 0) + 1); });
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
      return matchesStatus && matchesSearch;
    }).sort(sorters[S.sort] || sorters.score);
    return {
      scored: scored, today: today, statusCounts: statusCounts, filtered: filtered,
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
      var fresh = result.leads.map(function (l) { var old = oldById.get(l.id); return old ? Object.assign({}, l, { status: old.status, notes: old.notes, nextAction: old.nextAction, lastContact: old.lastContact, ai: old.ai }) : l; });
      var freshIds = new Set(fresh.map(function (l) { return l.id; }));
      // Não perde trabalho já feito: mantém leads com status avançado, notas ou retorno marcado que não vieram nesta busca
      // (descarta os fictícios ao entrar em modo Google).
      var kept = previous.filter(function (l) { return !freshIds.has(l.id) && (l.status !== 'Novo' || l.notes || l.nextAction || l.ai || (result.mode === 'google' && !l.demo)) && !(result.mode === 'google' && l.demo); });
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
    set({ loading: true, error: '', warning: '', message: '' });
    fetchCell({ lat: S.region.lat, lng: S.region.lng }, S.radiusKm).then(function (result) {
      mergeResult(result);
      set({ warning: result.warning || '', message: result.message || '' });
      if (result.warning && result.mode === 'google') notify({ level: 'warn', title: 'Algumas buscas falharam', detail: result.warning.slice(0, 200), source: 'api/leads' });
      else notify({ level: 'success', title: result.leads.length + ' lead(s) na lista', detail: result.mode === 'demo' ? 'Dados fictícios (modo demonstração).' : undefined });
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
    var header = ['ID Google', 'Nome', 'Categoria', 'Endereço', 'Telefone', 'Site', 'Nota Google', 'Quantidade avaliações', 'Pontuação', 'Status', 'Último contato', 'Próxima ação', 'Notas', 'Google Maps', 'Dados fictícios'];
    // Termos do Google: leads reais saem só com o place_id + seus campos (status, notas, datas). Dados da empresa não são exportados.
    var rows = derive().filtered.map(function (l) {
      return l.demo
        ? [l.id, l.name, l.category, l.address, l.phone || '', l.website || '', l.rating == null ? '' : l.rating, l.ratingCount == null ? '' : l.ratingCount, l.score, l.status, l.lastContact || '', l.nextAction || '', l.notes || '', l.googleMapsUri || '', 'SIM']
        : [l.id, '', l.category, '', '', '', '', '', '', l.status, l.lastContact || '', l.nextAction || '', l.notes || '', '', 'NÃO'];
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
    $('lf-backup').disabled = !S.leads.length;
  }

  function renderStats(D) {
    $('lf-st-total').textContent = String(S.leads.length);
    $('lf-st-priority').textContent = String(D.priority);
    $('lf-st-contacted').textContent = String(D.contacted);
    $('lf-st-followups').textContent = String(D.followUps);
    $('lf-tab-list').setAttribute('aria-selected', S.tab === 'list' ? 'true' : 'false');
    $('lf-tab-map').setAttribute('aria-selected', S.tab === 'map' ? 'true' : 'false');
    var q = $('lf-q'); if (q.value !== S.search) q.value = S.search;
  }

  function renderFunnel(D) {
    var box = $('lf-funnel'); box.textContent = '';
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
      lead.nextAction ? el('span', { class: 'meta' + (due ? ' due' : '') }, [icon('clock', 13), (due ? 'Retornar: ' : 'Retorno: ') + fmtDate(lead.nextAction)]) : null
    ]);

    var notesBtn = el('button', { type: 'button', class: 'linkbtn', 'aria-expanded': isOpen ? 'true' : 'false', 'data-fk': fk('nb'), on: { click: function () { set({ openNotes: isOpen ? null : lead.id }); } } },
      [icon('note', 13), ' ' + (lead.notes ? 'Notas ●' : 'Notas e retorno')]);

    var links = el('div', { class: 'lead-links' }, [
      wa ? extLink(wa, [icon('chat', 14), 'Abordar no WhatsApp'], 'wa', function () { approach(lead); }) : null,
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
        lead.ai.opportunity ? el('div', null, [el('b', { text: 'Ideia de vídeo:' }), ' ' + lead.ai.opportunity]) : null,
        lead.ai.message ? el('div', null, [el('b', { text: 'Mensagem sugerida:' }), ' ' + lead.ai.message + ' ', aiWa ? extLink(aiWa, ['Enviar no WhatsApp'], 'wa', function () { approach(lead); }) : null]) : null,
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
      right, aiBox, notesBox
    ]);
  }

  function renderList(view, D) {
    var sort = el('select', { class: 'select', 'data-fk': 'sort' });
    SORTS.forEach(function (s) { var o = el('option', { text: s.label }); o.value = s.id; if (s.id === S.sort) o.selected = true; sort.appendChild(o); });
    sort.addEventListener('change', function () { set({ sort: sort.value }); });
    view.appendChild(el('div', { class: 'toolbar' }, [el('h2', { text: 'Leads para avaliar' }), el('label', { class: 'sortbox' }, ['Ordenar', sort])]));

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
    view.appendChild(el('div', { class: 'toolbar' }, [el('h2', { text: 'Mapa de resultados' })]));
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
      if (S.tab === 'list') renderList(view, D); else renderMap(view, D);
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
    $('tpl').addEventListener('input', function () { set({ template: $('tpl').value }); });
    $('lf-backup').addEventListener('click', exportBackup);
    $('lf-restore').addEventListener('click', function () { $('lf-file').click(); });
    $('lf-file').addEventListener('change', function () { var f = $('lf-file').files && $('lf-file').files[0]; if (f) importBackup(f); });
    $('lf-csv').addEventListener('click', exportCsv);
    $('lf-tab-list').addEventListener('click', function () { set({ tab: 'list' }); });
    $('lf-tab-map').addEventListener('click', function () { set({ tab: 'map' }); });
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
    $('lf-app').hidden = true; $('lf-login').hidden = false;
    if (text) loginMsg(text, true);
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
  }

  function bindLogin() {
    $('lf-login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('lf-email').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { loginMsg('Digite um e-mail válido.', true); return; }
      var btn = $('lf-login-btn'); btn.disabled = true; btn.textContent = 'Enviando…';
      loginMsg('');
      sendLink(email).then(function () {
        loginMsg('Se este e-mail tiver acesso, o link chega em instantes. Confira também o spam.');
      }, function (er) { loginMsg(er.message, true); }).then(function () { btn.disabled = false; btn.textContent = 'Enviar link de acesso'; });
    });
  }

  function start() {
    LF.notifyMount({ toasts: $('lf-toasts'), bell: $('lf-bell'), button: $('lf-bell-btn'), sendBug: sendBug });
    mountControls();
    bindLogin();
    if (!URL_SB || !ANON) { showLogin('Supabase não configurado em assets/js/config.js.'); return; }
    consumeHash();
    if (!session) session = loadSession();
    if (session) showApp(); else showLogin();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})(window, document);
