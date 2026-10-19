/* ============================================================
   Soft Communication · painel de vídeos (mediateca)
   Tudo passa por SoftCatalog.Admin: o que se edita aqui é o que
   a página mãe renderiza (modo local = rascunho; Supabase = ao vivo).
   ============================================================ */
(function (w, d) {
  'use strict';
  var C = w.SoftCatalog, A = C.Admin, UI = w.AdminUI;
  var $ = function (id) { return d.getElementById(id); };
  var esc = UI.esc;
  var PL = { 'grid-1': 'Destaque 1', 'grid-2': 'Destaque 2', 'grid-3': 'Destaque 3', 'grid-4': 'Destaque 4',
    'band-1': 'Faixa 1', 'band-2': 'Faixa 2', 'band-3': 'Faixa 3', 'library': 'Biblioteca' };
  var ORDER = ['grid-1', 'grid-2', 'grid-3', 'grid-4', 'band-1', 'band-2', 'band-3', 'library'];
  var sel = null, filter = 'all', query = '';

  var grid = $('video-grid'), form = $('editor-form');
  var el = {
    title: $('edit-title'), titleFr: $('edit-title-fr'), titleEn: $('edit-title-en'), label: $('edit-label'),
    place: $('edit-placement'), rights: $('edit-rights'), rightsNote: $('rights-note'), tags: $('edit-category'), alt: $('edit-alt'),
    active: $('edit-active'), pos: $('order-pos'), video: $('editor-video'), file: $('editor-filename'), aspect: $('editor-aspect'),
    status: $('editor-tag-status'), hero: $('btn-set-hero')
  };

  function mode() { return A.mode(); }
  function savedMsg(what) {
    return mode() === 'remote' ? what + ' Já está no site.' : what + ' Salvo neste navegador (rascunho). Exporte o catálogo para publicar.';
  }
  function persist(okMsg) {
    return A.save().then(function () {
      try { w.localStorage.setItem('soft_catalog_updated', Date.now().toString()); } catch (e) {}
      UI.toast(savedMsg(okMsg));
    }, function (e) { UI.toast('Não foi possível salvar: ' + e.message); throw e; });
  }
  function sorted() {
    return A.items().slice().sort(function (a, b) {
      var d1 = ORDER.indexOf(a.placement) - ORDER.indexOf(b.placement);
      return d1 || (a.position - b.position);
    });
  }
  function orientLabel(it) { var o = C.orient(it); return o === 'portrait' ? 'Vertical' : (o === 'square' ? 'Quadrado' : 'Horizontal'); }
  function isIA(it) { return /\bia\b/i.test(it.tags || '') || /^hf-/.test(it.filename || ''); }
  function counters(all) {
    var set = function (id, v) { var e = $(id); if (e) e.textContent = v; };
    set('kpi-total', all.length);
    set('kpi-16x9', all.filter(function (i) { return C.orient(i) === 'landscape'; }).length);
    set('kpi-9x16', all.filter(function (i) { return C.orient(i) === 'portrait'; }).length);
    set('kpi-rights', all.filter(function (i) { return ['confirmado', 'proprio'].indexOf(i.rights) < 0; }).length);
    set('count-filter-all', all.length);
    d.querySelectorAll('[data-video-count]').forEach(function (e) { e.textContent = all.length; });
  }
  function match(it) {
    if (filter === 'landscape' && C.orient(it) !== 'landscape') return false;
    if (filter === 'portrait' && C.orient(it) !== 'portrait') return false;
    if (filter === 'ia' && !isIA(it)) return false;
    if (filter === 'featured' && !(it.hero || /^grid-/.test(it.placement))) return false;
    if (filter === 'rights' && ['confirmado', 'proprio'].indexOf(it.rights) >= 0) return false;
    if (filter === 'hidden' && it.active !== false) return false;
    if (query) {
      var q = query.toLowerCase().trim();
      var frTitle = (it.i18n && it.i18n.fr && it.i18n.fr.title) || '';
      var enTitle = (it.i18n && it.i18n.en && it.i18n.en.title) || '';
      var oLabel = orientLabel(it);
      var extra = [];
      if (C.orient(it) === 'portrait') extra.push('vertical', 'reels', 'tiktok', 'stories', '9:16');
      if (C.orient(it) === 'landscape') extra.push('horizontal', 'cinema', 'widescreen', '16:9');
      if (it.hero) extra.push('hero', 'abertura', 'destaque');
      if (it.active === false) extra.push('oculto', 'desativado'); else extra.push('ativo');
      if (isIA(it)) extra.push('ia', 'inteligencia artificial');

      var hay = [
        it.title, it.label, it.filename, it.tags, it.note, it.service, it.sector,
        it.aspect, it.rights, it.placement, frTitle, enTitle, oLabel, extra.join(' ')
      ].join(' ').toLowerCase();

      var tokens = q.split(/\s+/).filter(Boolean);
      for (var k = 0; k < tokens.length; k++) {
        if (hay.indexOf(tokens[k]) < 0) return false;
      }
    }
    return true;
  }
  function render() {
    var all = sorted(); counters(all);
    var list = all.filter(match);
    $('catalog-counter-text').textContent = 'Exibindo ' + list.length + ' de ' + all.length + ' vídeos';
    if (!list.length) { grid.innerHTML = '<div style="grid-column:1/-1;padding:var(--space-8);text-align:center;">Nenhum vídeo encontrado para esta busca ou filtro.</div>'; return; }
    grid.innerHTML = list.map(function (it) {
      var o = C.orient(it), cls = o === 'portrait' ? 'aspect-9x16' : (o === 'square' ? 'aspect-1x1' : '');
      var p = C.posterUrl(it);
      var badge = it.hero ? '★ Hero' : PL[it.placement] || it.placement;
      var warn = ['confirmado', 'proprio'].indexOf(it.rights) < 0 ? '<span class="tag tag-dark v-badge-rights">' + (it.rights === 'terceiros' ? 'Terceiros' : 'Direitos?') + '</span>' : '';
      return '<div class="v-card' + (it.id === sel ? ' is-selected' : '') + (it.active === false ? ' is-hidden' : '') + '" data-video-id="' + esc(it.id) + '" role="option" aria-selected="' + (it.id === sel) + '" tabindex="0">' +
        '<div class="v-card-thumb ' + cls + '">' + (p ? '<img class="v-thumb" src="' + esc(p) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<span class="v-badge-format">' + esc(it.aspect || '') + '</span>' + warn +
        '<span class="v-badge-placement' + (it.hero ? ' is-hero' : '') + '">' + esc(badge) + (it.active === false ? ' · oculto' : '') + '</span></div>' +
        '<div class="v-card-title">' + esc(it.title) + '</div><div class="v-card-filename">' + esc(it.filename || 'link externo') + '</div></div>';
    }).join('');
  }
  grid.addEventListener('click', function (e) { var c = e.target.closest('.v-card'); if (c) select(c.getAttribute('data-video-id')); });
  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var c = e.target.closest('.v-card'); if (c) { e.preventDefault(); select(c.getAttribute('data-video-id')); }
  });

  function select(id) {
    var it = A.find(id); if (!it) return;
    sel = id;
    d.querySelectorAll('.v-card').forEach(function (c) {
      var on = c.getAttribute('data-video-id') === id; c.classList.toggle('is-selected', on); c.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var src = C.url(it);
    if (el.video.getAttribute('src') !== src) { el.video.poster = C.posterUrl(it); el.video.src = src; el.video.load(); }
    el.title.value = it.title || '';
    el.titleFr.value = (it.i18n && it.i18n.fr && it.i18n.fr.title) || '';
    el.titleEn.value = (it.i18n && it.i18n.en && it.i18n.en.title) || '';
    el.label.value = it.label || '';
    el.place.value = it.placement; el.rights.value = it.rights || 'a-confirmar';
    el.tags.value = it.tags || ''; el.alt.value = it.alt || ''; el.active.checked = it.active !== false;
    el.file.textContent = it.filename || 'link externo';
    el.aspect.textContent = (it.aspect || '') + ' · ' + (it.w && it.h ? it.w + '×' + it.h : '') + ' · ' + orientLabel(it) + (it.duration ? ' · ' + Math.round(it.duration) + ' s' : '') + (it.size ? ' · ' + (it.size / 1048576).toFixed(1) + ' MB' : '');
    el.status.textContent = it.active !== false ? 'Ativo' : 'Oculto';
    el.status.className = 'tag ' + (it.active !== false ? 'tag-dark' : 'tag-outline');
    var grp = C.byPlacement(A.items(), it.placement);
    el.pos.textContent = (grp.indexOf(it) + 1) + ' de ' + grp.length;
    $('btn-move-prev').disabled = grp.indexOf(it) <= 0; $('btn-move-next').disabled = grp.indexOf(it) >= grp.length - 1;
    if (it.note) { el.rightsNote.hidden = false; el.rightsNote.textContent = it.note; } else { el.rightsNote.hidden = true; }
    el.hero.textContent = it.hero ? '★ Este é o vídeo da abertura' : '★ Usar na abertura da página';
    el.hero.className = 'btn btn-small ' + (it.hero ? 'btn-primary' : 'btn-secondary');
  }

  /* salvar edição */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var it = A.find(sel); if (!it) return;
    var fr = el.titleFr.value.trim(), en = el.titleEn.value.trim();
    var patch = { title: el.title.value.trim(), label: el.label.value.trim() || el.title.value.trim().slice(0, 28), tags: el.tags.value.trim(),
      alt: el.alt.value.trim(), active: el.active.checked, rights: el.rights.value, i18n: { fr: { title: fr }, en: { title: en } } };
    if (fr) patch.i18n.fr.label = fr.slice(0, 28);
    if (en) patch.i18n.en.label = en.slice(0, 28);
    if (el.place.value !== it.placement) patch.placement = el.place.value;
    A.update(sel, patch);
    persist('Alterações guardadas.').then(function () { render(); select(sel); });
  });
  $('btn-move-prev').addEventListener('click', function () { if (A.move(sel, -1)) persist('Posição alterada.').then(function () { render(); select(sel); }); });
  $('btn-move-next').addEventListener('click', function () { if (A.move(sel, 1)) persist('Posição alterada.').then(function () { render(); select(sel); }); });
  el.hero.addEventListener('click', function () {
    var it = A.find(sel); if (!it) return;
    A.setHero(sel); if (!it.active) A.update(sel, { active: true });
    persist('“' + it.title + '” é agora o vídeo de abertura.').then(function () { render(); select(sel); });
  });

  /* remover */
  var delModal = $('delete-modal');
  $('btn-trigger-delete').addEventListener('click', function () {
    var it = A.find(sel); if (!it) return;
    $('del-video-title').textContent = it.title; $('del-video-filename').textContent = it.filename || 'link externo';
    delModal.showModal();
  });
  var closeDel = function () { if (delModal.open) delModal.close(); };
  $('btn-cancel-delete').addEventListener('click', closeDel); $('btn-cancel-del').addEventListener('click', closeDel);
  $('btn-confirm-delete').addEventListener('click', function () {
    var it = A.find(sel), idx = sorted().indexOf(it); if (!it) return;
    A.remove(sel); closeDel();
    persist('“' + it.title + '” foi removido.').then(function () {
      var rest = sorted(); sel = rest.length ? rest[Math.min(idx, rest.length - 1)].id : null; render(); if (sel) select(sel);
    });
  });

  /* copiar link */
  $('btn-copy-url').addEventListener('click', function () {
    var it = A.find(sel); if (!it) return; var u = C.url(it);
    var done = function () { UI.toast('Link copiado.'); };
    var fb = function () { UI.toast('Copie manualmente: ' + u); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, fb); else fb();
  });

  /* filtros e busca */
  d.querySelectorAll('.media-filter-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      d.querySelectorAll('.media-filter-btn').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active'); filter = b.getAttribute('data-filter'); render();
    });
  });
  $('media-search').addEventListener('input', function (e) { query = e.target.value.trim(); render(); });

  /* exportar e restaurar */
  $('btn-export').addEventListener('click', function () {
    UI.download('catalog.js', A.exportJs(), 'text/javascript');
    UI.toast('catalog.js exportado. Para publicar, substitua assets/data/catalog.js do site por este arquivo.');
  });
  var confirmDlg = null;
  function ask(title, text, okLabel) {
    return new Promise(function (res) {
      if (!confirmDlg) {
        confirmDlg = d.createElement('dialog'); confirmDlg.className = 'confirm-dialog';
        confirmDlg.innerHTML = '<div class="confirm-dialog-body"><h3 class="a-heading" id="ask-t"></h3><p id="ask-p"></p><div class="actions" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-small" id="ask-no">Cancelar</button><button type="button" class="btn btn-primary btn-small" id="ask-yes"></button></div></div>';
        d.body.appendChild(confirmDlg);
      }
      confirmDlg.querySelector('#ask-t').textContent = title; confirmDlg.querySelector('#ask-p').textContent = text; confirmDlg.querySelector('#ask-yes').textContent = okLabel;
      var done = function (v) { confirmDlg.close(); res(v); };
      confirmDlg.querySelector('#ask-yes').onclick = function () { done(true); };
      confirmDlg.querySelector('#ask-no').onclick = function () { done(false); };
      confirmDlg.showModal();
    });
  }
  $('btn-reset-catalog').addEventListener('click', function () {
    ask('Restaurar o catálogo padrão?', 'Volta aos 52 vídeos originais, com as posições e os textos de fábrica. Suas alterações serão perdidas.', 'Restaurar').then(function (ok) {
      if (!ok) return;
      A.restoreDefaults();
      persist('Catálogo padrão restaurado.').then(function () { sel = A.items()[0].id; render(); select(sel); });
    });
  });

  /* reset / recarga de cache */
  var btnCacheReset = $('btn-cache-reset');
  if (btnCacheReset) {
    btnCacheReset.addEventListener('click', function () {
      btnCacheReset.disabled = true;
      var origText = btnCacheReset.textContent;
      btnCacheReset.textContent = '🔄 Recarregando…';
      C.resetCache(true).then(function () {
        return A.reload(true);
      }).then(function (res) {
        btnCacheReset.disabled = false;
        btnCacheReset.textContent = origText;
        render();
        var first = sorted()[0];
        if (first) select(first.id);
        UI.toast('Cachê resetado com sucesso! Sincronizados ' + (res.count || A.items().length) + ' vídeos diretamente do Supabase.');
      }).catch(function (err) {
        btnCacheReset.disabled = false;
        btnCacheReset.textContent = origText;
        UI.toast('Erro ao recarregar cachê: ' + err.message);
      });
    });
  }

  /* adicionar */
  var addModal = $('add-modal'), addForm = $('add-video-form');
  var msg = function (t) { var m = $('add-msg'); m.hidden = !t; m.textContent = t || ''; };
  $('btn-open-add').addEventListener('click', function () {
    var remote = mode() === 'remote';
    $('add-file').disabled = !remote;
    $('add-file-hint').textContent = remote ? 'O arquivo é enviado para o Supabase e a capa é gerada sozinha.' : 'O envio de arquivos exige o Supabase configurado. Por enquanto, use o link do vídeo.';
    msg(''); addModal.showModal();
  });
  var closeAdd = function () { if (addModal.open) addModal.close(); };
  $('btn-close-add').addEventListener('click', closeAdd); $('btn-cancel-add').addEventListener('click', closeAdd);
  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var title = $('add-title').value.trim(), url = $('add-url').value.trim(), file = $('add-file').files && $('add-file').files[0];
    if (!file && !url) { msg('Escolha um arquivo ou cole o link do vídeo.'); return; }
    var btn = $('btn-submit-add'); btn.disabled = true; msg('Lendo o vídeo…');
    var prog = $('add-progress'); prog.hidden = true;
    var make = function (info) {
      var it = A.add({ filename: info.filename, url: info.url, title: title, label: title.slice(0, 28), aspect: info.aspect, w: info.w, h: info.h, duration: info.duration,
        size: info.size || 0, poster: info.poster || '', placement: $('add-placement').value, tags: $('add-tags').value.trim() || 'Vídeo novo', alt: title, rights: 'confirmado', active: true });
      return persist('Vídeo “' + title + '” adicionado e publicado.').then(function () { closeAdd(); addForm.reset(); render(); select(it.id); });
    };
    var p;
    if (file) {
      prog.hidden = false;
      p = A.upload(file, function (f) { prog.firstElementChild.style.width = Math.round(f * 100) + '%'; msg('Enviando… ' + Math.round(f * 100) + '%'); }).then(make);
    } else {
      p = A.probe(url, false).then(function (m) {
        var fn = url.split('?')[0].split('/').pop() || 'video.webm';
        return make({ filename: fn, url: url, w: m.w || 1080, h: m.h || 1920, duration: m.duration || 10, aspect: C.aspectLabel(m.w || 1080, m.h || 1920), poster: '' });
      }).catch(function () {
        var fn = url.split('?')[0].split('/').pop() || 'video.webm';
        return make({ filename: fn, url: url, w: 1080, h: 1920, duration: 15, aspect: '9:16', poster: '' });
      });
    }
    p.then(function () { btn.disabled = false; }, function (er) { btn.disabled = false; msg('Não foi possível adicionar: ' + er.message); });
  });

  /* início */
  UI.onReady(function () {
    var first = sorted()[0]; sel = first ? first.id : null; render(); if (sel) select(sel);
  });
})(window, document);
