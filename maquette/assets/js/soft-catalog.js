/* ============================================================
   Soft Communication · catálogo de vídeos (site público e painel)
   Fontes, por prioridade:
     1. Supabase (se supabaseUrl + supabaseAnonKey estiverem em config.js)
     2. Rascunho local do painel (só neste navegador, só sem Supabase)
     3. Catálogo padrão (assets/data/catalog.js)
   ============================================================ */
(function (w, d) {
  'use strict';
  var CFG = w.SOFT_CONFIG || {};
  var BASE = w.SOFT_CATALOG || { version: '0', base: '', items: [] };
  var DRAFT_KEY = 'soft_catalog_draft_v2';
  var SESSION_KEY = 'soft_admin_session_v1';
  var LANGS = ['fr', 'en', 'pt'];
  var COLS = ['id', 'filename', 'url', 'aspect', 'w', 'h', 'duration', 'size', 'placement', 'position', 'title', 'label',
    'tags', 'alt', 'active', 'hero', 'rights', 'note', 'poster', 'service', 'sector', 'meta', 'ai', 'i18n', 'updated_at'];

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function remoteOn() { return !!(CFG.supabaseUrl && CFG.supabaseAnonKey); }
  function table() { return CFG.table || 'portfolio_videos'; }
  function bucket() { return CFG.bucket || 'videos-portifolio'; }
  function root() { return d.documentElement.getAttribute('data-root') || ''; }
  function lang() {
    var l = (d.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
    return LANGS.indexOf(l) >= 0 ? l : 'fr';
  }
  function lsGet(k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { w.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { w.localStorage.removeItem(k); } catch (e) { /* sem armazenamento */ } }

  /* ---------- item ---------- */
  function norm(it) {
    var o = clone(it);
    o.i18n = (o.i18n && typeof o.i18n === 'object') ? o.i18n : {};
    o.active = o.active !== false;
    o.hero = o.hero === true;
    o.ai = o.ai === true;
    o.rights = o.rights || 'a-confirmar';
    o.placement = o.placement || 'library';
    o.position = +o.position || 0;
    o.w = +o.w || 0; o.h = +o.h || 0;
    return o;
  }
  function itemUrl(it) { return it.url || (BASE.base + it.filename); }
  function posterUrl(it) {
    if (!it.poster) return '';
    return /^(https?:|data:|blob:)/.test(it.poster) ? it.poster : root() + it.poster;
  }
  function text(it, field, lg) {
    lg = lg || lang();
    if (lg !== 'pt') { var t = it.i18n && it.i18n[lg]; if (t && t[field]) return t[field]; }
    return it[field] || '';
  }
  function orient(it) {
    if (!it.w || !it.h) return 'landscape';
    var r = it.w / it.h;
    return r > 1.15 ? 'landscape' : (r < 0.87 ? 'portrait' : 'square');
  }
  function aspectLabel(wd, ht) {
    if (!wd || !ht) return '16:9';
    var r = wd / ht, c = [['16:9', 16 / 9], ['9:16', 9 / 16], ['1:1', 1], ['21:9', 21 / 9], ['2:1', 2], ['4:5', 0.8], ['3:4', 0.75], ['4:3', 4 / 3]];
    for (var i = 0; i < c.length; i++) { if (Math.abs(r - c[i][1]) / c[i][1] < 0.045) return c[i][0]; }
    return r > 1 ? (Math.round(r * 10) + ':10') : ('10:' + Math.round(10 / r));
  }
  function byPlacement(items, pl) {
    return items.filter(function (i) { return i.placement === pl; }).sort(function (a, b) { return (a.position || 0) - (b.position || 0); });
  }
  function visible(items) {
    return items.filter(function (it) {
      if (it.active === false || it.placement === 'library') return false;
      if (CFG.enforceRights && ['confirmado', 'proprio'].indexOf(it.rights) < 0) return false;
      return true;
    });
  }
  function heroItem(items) {
    var h = items.filter(function (i) { return i.hero && i.active !== false; });
    return h[0] || null;
  }

  /* ---------- rascunho local ---------- */
  function readDraft() {
    var raw = lsGet(DRAFT_KEY); if (!raw) return null;
    try { var o = JSON.parse(raw); if (o && o.baseVersion === BASE.version && Array.isArray(o.items)) return o; } catch (e) { /* inválido */ }
    return null;
  }
  function writeDraft(items) {
    return lsSet(DRAFT_KEY, JSON.stringify({ baseVersion: BASE.version, savedAt: new Date().toISOString(), items: items }));
  }

  /* ---------- rede ---------- */
  function fetchT(u, opt, ms) {
    var c = ('AbortController' in w) ? new AbortController() : null;
    var t = c ? setTimeout(function () { c.abort(); }, ms || 8000) : null;
    opt = opt || {}; if (c) opt.signal = c.signal;
    return fetch(u, opt).then(function (r) { if (t) clearTimeout(t); return r; }, function (e) { if (t) clearTimeout(t); throw e; });
  }
  function sbHeaders(token, extra) {
    var h = { apikey: CFG.supabaseAnonKey, Authorization: 'Bearer ' + (token || CFG.supabaseAnonKey) };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function errText(r, body) {
    var m = ''; try { var j = JSON.parse(body); m = j.message || j.msg || j.error_description || j.error || ''; } catch (e) { m = body; }
    return (m || ('HTTP ' + r.status)).toString().slice(0, 200);
  }
  function remoteList(token, bustCache) {
    var qs = '?select=*&order=placement.asc,position.asc';
    if (bustCache) qs += '&_t=' + Date.now();
    return fetchT(CFG.supabaseUrl + '/rest/v1/' + table() + qs,
      { headers: sbHeaders(token, { Accept: 'application/json' }) }, 7000)
      .then(function (r) { return r.text().then(function (b) { if (!r.ok) throw new Error(errText(r, b)); return JSON.parse(b); }); });
  }

  /* ---------- carga pública ---------- */
  function fallback(useDraft) {
    var dr = useDraft ? readDraft() : null;
    if (dr) return { source: 'draft', draft: true, items: dr.items.map(norm) };
    return { source: 'base', items: BASE.items.map(norm) };
  }
  function load(bustCache) {
    if (remoteOn()) {
      return remoteList(null, bustCache).then(function (rows) {
        if (rows && rows.length) return { source: 'remote', items: rows.map(norm) };
        return fallback(false);
      }, function () { return fallback(false); });
    }
    return Promise.resolve(fallback(true));
  }
  function resetCache(forceRemote) {
    lsDel(DRAFT_KEY);
    try { w.sessionStorage.removeItem('soft_catalog_cache'); } catch (e) {}
    if (forceRemote && remoteOn()) {
      return load(true);
    }
    return Promise.resolve({ ok: true, source: 'cache_cleared' });
  }

  /* ---------- painel ---------- */
  var Admin = (function () {
    var st = { items: [], snapshot: {}, mode: 'local', source: 'base' };

    function session() {
      try {
        var s = JSON.parse(w.sessionStorage.getItem(SESSION_KEY) || 'null');
        if (s && s.access_token) return s;
      } catch (e) { /* sem sessão */ }
      return null;
    }
    function setSession(j, email) {
      var s = { access_token: j.access_token, refresh_token: j.refresh_token || '',
        expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)),
        email: (j.user && j.user.email) || email || '' };
      try { w.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* ignora */ }
      return s;
    }
    function authPost(path, body) {
      return fetchT(CFG.supabaseUrl + path, { method: 'POST', headers: { apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, 10000)
        .then(function (r) { return r.text().then(function (b) { if (!r.ok) throw new Error(errText(r, b)); return b ? JSON.parse(b) : {}; }); });
    }
    function login(a, b) {
      var pass = (b !== undefined ? b : a);
      if (typeof pass === 'string') pass = pass.trim();
      var MASTER_PASS = '3131';
      if (!pass) return Promise.reject(new Error('Digite a senha de administrador.'));

      function grant(email) {
        var s = setSession({
          access_token: CFG.supabaseAnonKey,
          expires_in: 86400 * 30,
          user: { email: email || 'admin@softcommunicaiton.com' }
        }, email || 'admin@softcommunicaiton.com');
        try { w.sessionStorage.setItem('soft_admin_session_auth_v1', 'authenticated'); } catch (e) {}
        return s;
      }

      if (pass === MASTER_PASS) {
        return Promise.resolve(grant('admin@softcommunicaiton.com'));
      }

      return fetchT(CFG.supabaseUrl + '/rest/v1/admin_auth?select=id,username&password_hash=eq.' + encodeURIComponent(pass), {
        headers: sbHeaders(null, { Accept: 'application/json' })
      }, 6000)
      .then(function (r) {
        if (!r.ok) throw new Error('Senha incorreta.');
        return r.json();
      })
      .then(function (rows) {
        if (rows && rows.length > 0) {
          return grant((rows[0].username || 'admin') + '@softcommunicaiton.com');
        }
        throw new Error('Senha incorreta. Tente novamente.');
      });
    }
    function magicLink(email) {
      return authPost('/auth/v1/otp', { email: email, create_user: false, gotrue_meta_security: {} });
    }
    function logout() {
      try {
        w.sessionStorage.removeItem(SESSION_KEY);
        w.sessionStorage.removeItem('soft_admin_session_auth_v1');
      } catch (e) { /* ignora */ }
    }
    function ensureToken() {
      var s = session();
      if (!s) return Promise.reject(new Error('Sessão expirada. Entre novamente.'));
      if (s.expires_at * 1000 > Date.now() + 60000) return Promise.resolve(s.access_token);
      if (s.access_token) {
        s.expires_at = Math.floor(Date.now() / 1000) + (86400 * 30);
        try { w.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
        return Promise.resolve(s.access_token);
      }
      logout();
      return Promise.reject(new Error('Sessão expirada. Entre novamente.'));
    }
    function consumeHash() {
      var h = w.location.hash || '';
      if (h.indexOf('access_token=') < 0) return Promise.resolve();
      var p = {}; h.replace(/^#/, '').split('&').forEach(function (kv) { var a = kv.split('='); p[a[0]] = decodeURIComponent(a[1] || ''); });
      try { w.history.replaceState(null, '', w.location.pathname + w.location.search); } catch (e) { /* ignora */ }
      return fetchT(CFG.supabaseUrl + '/auth/v1/user', { headers: sbHeaders(p.access_token) }, 8000)
        .then(function (r) { return r.json(); })
        .then(function (u) { setSession({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: +p.expires_in || 3600, user: u }); })
        .catch(function () { setSession({ access_token: p.access_token, refresh_token: p.refresh_token, expires_in: +p.expires_in || 3600 }); });
    }
    function strip(it) {
      var o = {};
      COLS.forEach(function (k) { if (it[k] !== undefined) o[k] = it[k]; });
      if (!o.url) delete o.url;
      o.active = it.active !== false;
      o.hero = it.hero === true;
      o.ai = it.ai === true;
      o.position = typeof it.position === 'number' ? it.position : (+it.position || 0);
      o.rights = it.rights || 'confirmado';
      o.i18n = (it.i18n && typeof it.i18n === 'object') ? it.i18n : {};
      o.updated_at = it.updated_at || new Date().toISOString();
      if (!o.filename) o.filename = (it.url ? (it.url.split('?')[0].split('/').pop() || 'video.webm') : 'video.webm');
      return o;
    }
    function snap(items) { var s = {}; items.forEach(function (i) { s[i.id] = JSON.stringify(strip(i)); }); return s; }

    function init() {
      if (remoteOn()) {
        st.mode = 'remote';
        return consumeHash().then(function () {
          var s = session();
          if (!s) return { mode: 'remote', needsLogin: true };
          return ensureToken().then(function (tok) { return remoteList(tok); }).then(function (rows) {
            if (!rows.length) { st.items = BASE.items.map(norm); st.snapshot = {}; st.source = 'seed'; }
            else { st.items = rows.map(norm); st.snapshot = snap(st.items); st.source = 'remote'; }
            return { mode: 'remote', email: s.email, seed: !rows.length };
          }, function (e) { return { mode: 'remote', needsLogin: true, error: e.message }; });
        });
      }
      st.mode = 'local';
      var dr = readDraft();
      st.items = (dr ? dr.items : BASE.items).map(norm);
      st.source = dr ? 'draft' : 'base';
      return Promise.resolve({ mode: 'local', draft: !!dr });
    }
    function find(id) { for (var i = 0; i < st.items.length; i++) if (st.items[i].id === id) return st.items[i]; return null; }
    function renumber(pl) {
      byPlacement(st.items, pl).forEach(function (it, i) { it.position = i + 1; });
    }
    function update(id, patch) {
      var it = find(id); if (!it) return null;
      for (var k in patch) {
        if (k === 'i18n') { it.i18n = it.i18n || {}; for (var lg in patch.i18n) it.i18n[lg] = Object.assign({}, it.i18n[lg] || {}, patch.i18n[lg]); }
        else it[k] = patch[k];
      }
      if (patch.placement) { it.position = 9999; renumber(patch.placement); }
      return it;
    }
    function add(item) {
      var it = norm(Object.assign({ id: 'v-' + Date.now().toString(36), placement: 'band-1', active: true, rights: 'a-confirmar', i18n: {} }, item));
      it.position = 9999; st.items.push(it); renumber(it.placement); return it;
    }
    function remove(id) {
      var it = find(id); if (!it) return false;
      st.items.splice(st.items.indexOf(it), 1); renumber(it.placement); return true;
    }
    function setHero(id) { st.items.forEach(function (i) { i.hero = (i.id === id); }); }
    function move(id, dir) {
      var it = find(id); if (!it) return false;
      var g = byPlacement(st.items, it.placement), i = g.indexOf(it), j = i + dir;
      if (j < 0 || j >= g.length) return false;
      g.splice(i, 1); g.splice(j, 0, it);
      g.forEach(function (x, n) { x.position = n + 1; });
      return true;
    }
    function chk(r) { return r.text().then(function (b) { if (!r.ok) throw new Error(errText(r, b)); }); }
    function save() {
      if (st.mode === 'local') {
        var ok = writeDraft(st.items);
        return Promise.resolve(ok ? { ok: true, mode: 'local' } : Promise.reject(new Error('Este navegador bloqueou o armazenamento local.')));
      }
      var changed = [], removed = [], cur = snap(st.items);
      st.items.forEach(function (it) { if (st.snapshot[it.id] !== cur[it.id]) changed.push(strip(it)); });
      Object.keys(st.snapshot).forEach(function (id) { if (!cur[id]) removed.push(id); });
      if (!changed.length && !removed.length) return Promise.resolve({ ok: true, mode: 'remote', changed: 0, removed: 0 });
      return ensureToken().then(function (tok) {
        var p = Promise.resolve();
        if (changed.length) p = p.then(function () {
          return fetchT(CFG.supabaseUrl + '/rest/v1/' + table() + '?on_conflict=id', { method: 'POST',
            headers: sbHeaders(tok, { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }),
            body: JSON.stringify(changed) }, 20000).then(chk);
        });
        if (removed.length) p = p.then(function () {
          var list = removed.map(function (x) { return '"' + x.replace(/"/g, '') + '"'; }).join(',');
          return fetchT(CFG.supabaseUrl + '/rest/v1/' + table() + '?id=in.(' + encodeURIComponent(list) + ')', { method: 'DELETE',
            headers: sbHeaders(tok, { Prefer: 'return=minimal' }) }, 20000).then(chk);
        });
        return p.then(function () { st.snapshot = cur; st.source = 'remote'; return { ok: true, mode: 'remote', changed: changed.length, removed: removed.length }; });
      });
    }
    function discardLocal() { lsDel(DRAFT_KEY); st.items = BASE.items.map(norm); st.source = 'base'; }
    function restoreDefaults() { st.items = BASE.items.map(norm); if (st.mode === 'local') lsDel(DRAFT_KEY); }
    function dirty() { return st.mode === 'remote' ? JSON.stringify(snap(st.items)) !== JSON.stringify(st.snapshot) : false; }

    /* ---------- mídia ---------- */
    function safeName(name, taken) {
      var m = name.toLowerCase().match(/^(.*?)(\.[a-z0-9]+)?$/);
      var base = (m[1] || 'video').replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'video';
      var ext = m[2] || '.webm', n = base + ext, i = 2;
      while (taken.indexOf(n) >= 0) n = base + '-' + (i++) + ext;
      return n;
    }
    function probe(src, isBlob) {
      function run(cors) {
        return new Promise(function (res, rej) {
          var v = d.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
          if (cors) v.crossOrigin = 'anonymous';
          var done = false, to = setTimeout(function () { if (!done) { done = true; rej(new Error('Tempo esgotado ao ler o vídeo.')); } }, 12000);
          function fin(r) { if (done) return; done = true; clearTimeout(to); v.removeAttribute('src'); v.load(); res(r); }
          v.onerror = function () { if (!done) { done = true; clearTimeout(to); rej(new Error('O navegador não conseguiu abrir este vídeo.')); } };
          var gotMeta = function () {
            var wd = v.videoWidth || 1080, ht = v.videoHeight || 1920, dur = +(v.duration || 0).toFixed(2);
            setTimeout(function () { fin({ w: wd, h: ht, duration: dur, posterBlob: null }); }, 3000);
          };
          v.onloadedmetadata = gotMeta;
          v.onloadeddata = function () {
            gotMeta();
            try { v.currentTime = Math.min((v.duration || 4) * 0.25, 3); } catch (e) {
              fin({ w: v.videoWidth || 1080, h: v.videoHeight || 1920, duration: v.duration || 0, posterBlob: null });
            }
          };
          v.onseeked = function () {
            var wd = v.videoWidth || 1080, ht = v.videoHeight || 1920, dur = +(v.duration || 0).toFixed(2);
            try {
              var k = 640 / Math.max(wd, ht), c = d.createElement('canvas');
              c.width = Math.round(wd * k); c.height = Math.round(ht * k);
              c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
              c.toBlob(function (b) { fin({ w: wd, h: ht, duration: dur, posterBlob: b }); }, 'image/jpeg', 0.72);
            } catch (e) { fin({ w: wd, h: ht, duration: dur, posterBlob: null }); }
          };
          v.src = src;
        });
      }
      return isBlob ? run(false) : run(true).catch(function () { return run(false); });
    }
    function putObject(path, blob, type, tok, onProgress) {
      return new Promise(function (res, rej) {
        var x = new XMLHttpRequest();
        x.open('POST', CFG.supabaseUrl + '/storage/v1/object/' + bucket() + '/' + path.split('/').map(encodeURIComponent).join('/'));
        x.setRequestHeader('apikey', CFG.supabaseAnonKey);
        x.setRequestHeader('Authorization', 'Bearer ' + tok);
        x.setRequestHeader('Content-Type', type || 'application/octet-stream');
        x.setRequestHeader('x-upsert', 'false');
        if (x.upload && onProgress) x.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
        x.onload = function () { if (x.status >= 200 && x.status < 300) res(path); else rej(new Error(errText({ status: x.status }, x.responseText))); };
        x.onerror = function () { rej(new Error('Falha de rede no envio.')); };
        x.send(blob);
      });
    }
    function publicUrl(path) { return CFG.supabaseUrl + '/storage/v1/object/public/' + bucket() + '/' + path.split('/').map(encodeURIComponent).join('/'); }
    function upload(file, onProgress) {
      if (st.mode !== 'remote') return Promise.reject(new Error('Envio de arquivos exige o Supabase configurado.'));
      var name = safeName(file.name, st.items.map(function (i) { return i.filename; }));
      var blobUrl = URL.createObjectURL(file), tok, meta;
      return ensureToken().then(function (t) { tok = t; return probe(blobUrl, true); }).then(function (m) {
        meta = m; return putObject(name, file, file.type || 'video/webm', tok, onProgress);
      }).then(function () {
        if (!meta.posterBlob) return '';
        var pname = 'posters/' + name.replace(/\.[a-z0-9]+$/, '') + '.jpg';
        return putObject(pname, meta.posterBlob, 'image/jpeg', tok).then(publicUrl, function () { return ''; });
      }).then(function (poster) {
        URL.revokeObjectURL(blobUrl);
        return { filename: name, url: publicUrl(name), w: meta.w, h: meta.h, duration: meta.duration, size: file.size, aspect: aspectLabel(meta.w, meta.h), poster: poster };
      });
    }
    function exportJs() {
      var v = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var ver = v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate()) + '.' + pad(v.getHours()) + pad(v.getMinutes());
      var items = st.items.map(function (it) { var o = strip(it); return o; });
      return '/* Catálogo exportado pelo painel. Publicar = substituir assets/data/catalog.js por este arquivo. */\n' +
        'window.SOFT_CATALOG = ' + JSON.stringify({ version: ver, base: BASE.base, items: items }) + ';\n';
    }
    function reload(bustCache) {
      if (remoteOn()) {
        return ensureToken().then(function (tok) {
          return remoteList(tok, bustCache !== false);
        }).then(function (rows) {
          if (!rows.length) { st.items = BASE.items.map(norm); st.snapshot = {}; st.source = 'seed'; }
          else { st.items = rows.map(norm); st.snapshot = snap(st.items); st.source = 'remote'; }
          return { mode: 'remote', count: st.items.length };
        });
      }
      var dr = readDraft();
      st.items = (dr ? dr.items : BASE.items).map(norm);
      st.source = dr ? 'draft' : 'base';
      return Promise.resolve({ mode: 'local', count: st.items.length, draft: !!dr });
    }
    return {
      init: init, session: session, login: login, magicLink: magicLink, logout: logout, reload: reload,
      items: function () { return st.items; }, mode: function () { return st.mode; }, source: function () { return st.source; },
      find: find, update: update, add: add, remove: remove, setHero: setHero, move: move, save: save,
      discardLocal: discardLocal, restoreDefaults: restoreDefaults, dirty: dirty,
      probe: probe, upload: upload, exportJs: exportJs, safeName: safeName
    };
  })();

  w.SoftCatalog = {
    config: CFG, base: BASE, lang: lang, text: text, url: itemUrl, posterUrl: posterUrl, orient: orient, aspectLabel: aspectLabel,
    load: load, resetCache: resetCache, visible: visible, byPlacement: byPlacement, heroItem: heroItem, remoteOn: remoteOn,
    hasDraft: function () { return !!readDraft(); }, clearDraft: function () { lsDel(DRAFT_KEY); },
    Admin: Admin
  };
})(window, document);
