/* ============================================================
   Soft Communication · destaques da página inicial
   Os quatro cartões do topo da página mãe. Os campos ativos aqui
   salvam no catálogo; o resto é prévia das páginas de projeto (etapa 4).
   ============================================================ */
(function (w, d) {
  'use strict';
  var C = w.SoftCatalog, A = C.Admin, UI = w.AdminUI;
  var $ = function (id) { return d.getElementById(id); };
  var esc = UI.esc;
  var SECTORS = {
    hotellerie: { pt: 'Hotelaria', fr: 'Hôtellerie', en: 'Hospitality' },
    restauration: { pt: 'Gastronomia', fr: 'Restauration', en: 'Restaurants' },
    immobilier: { pt: 'Imobiliário', fr: 'Immobilier', en: 'Real estate' },
    lifestyle: { pt: 'Lifestyle', fr: 'Lifestyle', en: 'Lifestyle' },
    automobile: { pt: 'Automotivo', fr: 'Automobile', en: 'Automotive' }
  };
  var SERVICES = {
    cinema: { pt: 'Filmes de marca', fr: 'Films de marque', en: 'Brand films' },
    presence: { pt: 'Conteúdos curtos & UGC', fr: 'Contenus courts & UGC', en: 'Short-form & UGC' },
    projection: { pt: 'Imobiliário IA', fr: 'Immobilier IA', en: 'AI property visuals' },
    action: { pt: 'Filmes de ação', fr: 'Films d’action', en: 'Action films' }
  };
  var F = {}; /* campos */
  var sel = null, order = [];

  function featured() {
    return A.items().filter(function (i) { return /^grid-\d$/.test(i.placement); })
      .sort(function (a, b) { return a.placement < b.placement ? -1 : a.placement > b.placement ? 1 : a.position - b.position; });
  }
  function keyOf(map, text) {
    for (var k in map) if (map[k].pt === text) return k;
    return '';
  }
  function setBound() {
    ['titre-fr', 'role-fr', 'alt-fr', 'titre-en', 'role-en', 'alt-en', 'titre-fr2', 'role-fr2', 'alt-fr2', 'secteur', 'statut', 'p-pick'].forEach(function (id) { F[id] = $(id); });
    F.rights = d.querySelector('input[name="droits"]'); F.ia = d.querySelector('input[name="visuels-ia"]');
    F.services = Array.prototype.slice.call(d.querySelectorAll('input[name="services"]'));
  }
  function ensureServiceOption() {
    if (d.querySelector('input[name="services"][value="action"]')) return;
    var box = F.services[0] && F.services[0].closest('.chips'); if (!box) return;
    var l = d.createElement('label'); l.className = 'chip';
    l.innerHTML = '<input type="checkbox" name="services" value="action"><span>Filmes de ação</span>';
    box.appendChild(l);
    F.services = Array.prototype.slice.call(d.querySelectorAll('input[name="services"]'));
  }
  function ensurePicker() {
    var col = d.querySelector('.p-col'); if (!col || $('p-pick')) return;
    var s = d.createElement('section'); s.className = 'a-card'; s.setAttribute('aria-labelledby', 'h-pick');
    s.innerHTML = '<h2 class="a-heading" id="h-pick">Destaque em edição</h2>' +
      '<div class="field"><label for="p-pick">Escolha o destaque</label><div class="select-wrap"><select class="select" id="p-pick"></select></div></div>' +
      '<p class="a-preview-note" id="p-banner"></p>';
    col.insertBefore(s, col.firstChild);
  }
  function disableUnwired() {
    var wired = ['titre-fr', 'role-fr', 'alt-fr', 'titre-en', 'role-en', 'alt-en', 'titre-fr2', 'role-fr2', 'alt-fr2', 'secteur', 'statut', 'p-pick'];
    d.querySelectorAll('#fiche-projet input, #fiche-projet textarea, #fiche-projet select').forEach(function (el) {
      var id = el.id || '', nm = el.name || '';
      if (wired.indexOf(id) >= 0) return;
      if (nm === 'droits' || nm === 'visuels-ia' || nm === 'services') return;
      el.disabled = true;
    });
    d.querySelectorAll('#fiche-projet button.a-dropzone, #fiche-projet .p-results button').forEach(function (b) { b.disabled = true; });
    ['h-medias', 'h-cases'].forEach(function (id) { var h2 = $(id); if (h2) h2.closest('.a-card').classList.add('a-preview'); });
    var lang = d.querySelector('.p-lang .a-card-head'); if (lang && !d.getElementById('p-lang-note')) {
      var n = d.createElement('p'); n.id = 'p-lang-note'; n.className = 'a-preview-note';
      n.textContent = 'Ativos: título, função (linha sob o título) e descrição acessível. Briefing, créditos, SEO, formatos e entregáveis valem para as páginas de projeto da etapa 4.';
      lang.parentNode.insertBefore(n, lang.nextSibling);
    }
    var h = $('h-medias'); if (h && !d.getElementById('p-media-note')) {
      var m = d.createElement('p'); m.id = 'p-media-note'; m.className = 'a-preview-note';
      m.innerHTML = 'O vídeo e a capa deste destaque são escolhidos em <a href="mediatheque.html">Vídeos</a>.';
      h.closest('.a-card-head').parentNode.insertBefore(m, h.closest('.a-card-head').nextSibling);
    }
  }

  function chooseService(key) { F.services.forEach(function (c) { c.checked = (c.value === key); }); }
  function currentService() { var c = F.services.filter(function (x) { return x.checked; })[0]; return c ? c.value : ''; }

  function fill(it) {
    var i18n = it.i18n || {}, fr = i18n.fr || {}, en = i18n.en || {};
    F['titre-fr'].value = it.title || ''; F['role-fr'].value = it.meta || ''; F['alt-fr'].value = it.alt || '';
    F['titre-en'].value = en.title || ''; F['role-en'].value = en.meta || ''; F['alt-en'].value = en.alt || '';
    F['titre-fr2'].value = fr.title || ''; F['role-fr2'].value = fr.meta || ''; F['alt-fr2'].value = fr.alt || '';
    var sk = keyOf(SECTORS, it.sector);
    if (!sk && it.sector) {
      var o = d.createElement('option'); o.value = 'custom'; o.textContent = it.sector; F.secteur.appendChild(o); sk = 'custom';
    }
    F.secteur.value = sk || F.secteur.options[0].value;
    var vk = keyOf(SERVICES, it.service); chooseService(vk);
    F.rights.checked = ['confirmado', 'proprio'].indexOf(it.rights) >= 0;
    F.ia.checked = it.ai === true;
    F.statut.value = it.active !== false ? 'publie' : 'brouillon';
    var vids = d.querySelectorAll('.p-media-grid .a-media video');
    if (vids[0]) { vids[0].poster = C.posterUrl(it); vids[0].preload = 'none'; vids[0].removeAttribute('src'); vids[0].setAttribute('data-src', C.url(it)); }
    var cut = vids[1] && vids[1].closest('.p-media'); if (cut) cut.hidden = true;
    $('p-title').textContent = it.title; $('p-eyebrow').textContent = 'Destaque ' + it.placement.replace('grid-', '') + ' · página inicial';
    $('p-banner').textContent = 'Este é o destaque ' + it.placement.replace('grid-', '') + ' de 4. Só os destaques com estado “Publicado e visível” aparecem no site.';
    refresh();
  }
  function collect() {
    var sk = F.secteur.value, vk = currentService();
    var sec = SECTORS[sk], srv = SERVICES[vk];
    var cur = A.find(sel);
    var p = {
      title: F['titre-fr'].value.trim(), label: F['titre-fr'].value.trim(), meta: F['role-fr'].value.trim(), alt: F['alt-fr'].value.trim(),
      ai: F.ia.checked, rights: F.rights.checked ? (cur.rights === 'proprio' ? 'proprio' : 'confirmado') : 'a-confirmar',
      active: F.statut.value === 'publie',
      i18n: {
        fr: { title: F['titre-fr2'].value.trim(), label: F['titre-fr2'].value.trim(), meta: F['role-fr2'].value.trim(), alt: F['alt-fr2'].value.trim() },
        en: { title: F['titre-en'].value.trim(), label: F['titre-en'].value.trim(), meta: F['role-en'].value.trim(), alt: F['alt-en'].value.trim() }
      }
    };
    if (sec) { p.sector = sec.pt; p.i18n.fr.sector = sec.fr; p.i18n.en.sector = sec.en; }
    if (srv) { p.service = srv.pt; p.i18n.fr.service = srv.fr; p.i18n.en.service = srv.en; }
    return p;
  }
  function check(p) {
    var vk = currentService();
    var rows = [
      { ok: p.rights !== 'a-confirmar', text: 'Direitos de uso confirmados', block: true },
      { ok: !!(p.title && p.i18n.fr.title && p.i18n.en.title), text: 'Título nos três idiomas (PT, FR, EN)', block: true },
      { ok: !!(p.service && p.sector), text: 'Serviço e setor definidos', block: true },
      { ok: vk !== 'projection' || p.ai, text: 'Etiqueta “Projeção IA” coerente com o serviço', block: true },
      { ok: !!(p.alt && p.i18n.en.alt && p.i18n.fr.alt), text: 'Descrição acessível nos três idiomas', block: false }
    ];
    return rows;
  }
  function refresh() {
    var it = A.find(sel); if (!it) return;
    var p = collect(), rows = check(p);
    var done = rows.filter(function (r) { return r.ok; }).length, pct = Math.round(done / rows.length * 100);
    var li = function (r) { return '<li><span class="a-check ' + (r.ok ? 'is-done' : (r.block ? 'is-blocking' : '')) + '" aria-hidden="true">' + (r.ok ? '✓' : '!') + '</span><span>' + esc(r.text) + '</span></li>'; };
    var comp = $('h-completude'); if (comp) {
      comp.textContent = 'Preenchimento · ' + pct + ' %';
      var card = comp.closest('.a-card'), bar = card.querySelector('.a-bar'), ul = card.querySelector('.a-checklist');
      bar.setAttribute('aria-valuenow', pct); bar.firstElementChild.style.width = pct + '%'; ul.innerHTML = rows.map(li).join('');
    }
    var g = $('h-garde-fous'); if (g) {
      var gcard = g.closest('.a-card'), gul = gcard.querySelector('.a-checklist'), note = gcard.querySelector('p.small');
      gul.innerHTML = rows.filter(function (r) { return r.block; }).map(li).join('');
      var blocking = rows.filter(function (r) { return r.block && !r.ok; }).length;
      note.innerHTML = blocking ? '<strong>' + blocking + (blocking === 1 ? ' item bloqueia' : ' itens bloqueiam') + ' a publicação deste destaque.</strong>' : '<strong>Tudo certo: este destaque pode ser publicado.</strong>';
      var pub = $('p-publish'); pub.disabled = blocking > 0; pub.setAttribute('aria-disabled', blocking > 0 ? 'true' : 'false');
    }
    var st = $('p-status'), on = F.statut.value === 'publie';
    st.textContent = on ? 'Publicado' : 'Fora do site'; st.className = 'a-status ' + (on ? 'is-published' : 'is-review');
    var full = function (t) { return !!t; };
    $('tag-fr2').textContent = full(F['titre-fr2'].value) ? 'Completo' : 'Incompleto'; $('tag-fr2').className = 'tag ' + (full(F['titre-fr2'].value) ? 'tag-dark' : 'tag-outline');
  }
  function renderOrder() {
    var list = $('ordre-accueil'), f = featured();
    list.innerHTML = f.map(function (it, i) {
      return '<li draggable="true" data-id="' + esc(it.id) + '"><span class="a-handle" aria-hidden="true">⋮⋮</span><span class="order">' + ('0' + (i + 1)).slice(-2) + '</span>' +
        '<span class="p-name">' + esc(it.title) + '</span><span class="actions" style="margin-left:auto">' +
        '<button class="btn btn-outline btn-small" type="button" data-up aria-label="Subir ' + esc(it.title) + '">↑</button>' +
        '<button class="btn btn-outline btn-small" type="button" data-down aria-label="Descer ' + esc(it.title) + '">↓</button></span></li>';
    }).join('');
  }
  function applyOrder(ids) {
    ids.forEach(function (id, i) { A.update(id, { placement: 'grid-' + (i + 1) }); });
    A.save().then(function () {
      UI.toast(A.mode() === 'remote' ? 'Ordem salva. Já está no site.' : 'Ordem salva neste navegador (rascunho).');
    }, function (e) { UI.toast('Não foi possível salvar: ' + e.message); });
    renderOrder(); fillPicker();
  }
  function fillPicker() {
    var pick = F['p-pick'], f = featured();
    pick.innerHTML = f.map(function (it, i) { return '<option value="' + esc(it.id) + '">' + (i + 1) + ' · ' + esc(it.title) + '</option>'; }).join('');
    if (sel) pick.value = sel;
  }
  function save(extra) {
    var it = A.find(sel); if (!it) return;
    var p = collect(); if (extra) for (var k in extra) p[k] = extra[k];
    A.update(sel, p);
    return A.save().then(function () {
      UI.toast(A.mode() === 'remote' ? 'Destaque salvo. Já está no site.' : 'Destaque salvo neste navegador (rascunho). Exporte o catálogo para publicar.');
      renderOrder(); fillPicker(); fill(A.find(sel));
    }, function (e) { UI.toast('Não foi possível salvar: ' + e.message); });
  }

  UI.onReady(function () {
    setBound(); ensurePicker(); setBound(); ensureServiceOption(); disableUnwired();
    var f = featured();
    if (!f.length) { $('p-title').textContent = 'Nenhum destaque definido'; return; }
    sel = f[0].id; fillPicker(); renderOrder(); fill(f[0]);

    F['p-pick'].addEventListener('change', function () { sel = F['p-pick'].value; fill(A.find(sel)); });
    d.getElementById('fiche-projet').addEventListener('input', refresh);
    d.getElementById('fiche-projet').addEventListener('change', function (e) {
      if (e.target.name === 'services' && e.target.checked) chooseService(e.target.value);
      refresh();
    });
    d.getElementById('fiche-projet').addEventListener('submit', function (e) { e.preventDefault(); });
    $('p-save').addEventListener('click', function () { save(); });
    $('p-publish').addEventListener('click', function () { F.statut.value = 'publie'; save({ active: true }); });

    var list = $('ordre-accueil'), dragged = null;
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var li = b.closest('li'), ids = Array.prototype.map.call(list.children, function (x) { return x.getAttribute('data-id'); });
      var i = ids.indexOf(li.getAttribute('data-id')), j = b.hasAttribute('data-up') ? i - 1 : i + 1;
      if (j < 0 || j >= ids.length) return;
      ids.splice(j, 0, ids.splice(i, 1)[0]); applyOrder(ids);
    });
    list.addEventListener('dragstart', function (e) { dragged = e.target.closest('li'); if (dragged) { e.dataTransfer.effectAllowed = 'move'; dragged.classList.add('is-dragging'); } });
    list.addEventListener('dragover', function (e) {
      if (!dragged) return; e.preventDefault();
      var li = e.target.closest('li'); if (!li || li === dragged) return;
      var r = li.getBoundingClientRect(); list.insertBefore(dragged, (e.clientY - r.top) > r.height / 2 ? li.nextElementSibling : li);
    });
    list.addEventListener('drop', function (e) { e.preventDefault(); });
    list.addEventListener('dragend', function () {
      if (!dragged) return; dragged.classList.remove('is-dragging'); dragged = null;
      applyOrder(Array.prototype.map.call(list.children, function (x) { return x.getAttribute('data-id'); }));
    });
  });
})(window, document);
