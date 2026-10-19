/* ============================================================
   Soft Communication — maquette privée · comportements de l'admin
   Aucune action n'est connectée : chaque bouton d'action affiche
   un message honnête. Aucune donnée n'est enregistrée.
   ============================================================ */
(function () {
  'use strict';

  /* Toast : actions non connectées dans la maquette */
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3200);
  }
  document.querySelectorAll('[data-mock-action]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (el.tagName === 'A') e.preventDefault();
      showToast(el.getAttribute('data-mock-action') || 'Demonstração : esta funcionalidade não está conectada ao backend.');
    });
  });
  document.querySelectorAll('form[data-mock-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast(form.getAttribute('data-mock-message') || 'Demonstração : nenhuma alteração foi gravada.');
    });
  });

  /* Onglets (FR / EN, sections) */
  document.querySelectorAll('[data-tabs]').forEach(function (root) {
    var tabs = root.querySelectorAll('[role="tab"]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var list = Array.prototype.slice.call(tabs);
        var i = list.indexOf(tab);
        if (e.key === 'ArrowRight') { e.preventDefault(); select(list[(i + 1) % list.length], true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select(list[(i - 1 + list.length) % list.length], true); }
      });
    });
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
  });

  /* Panneau latéral (fiche demande, historique…) : dialog natif */
  document.querySelectorAll('[data-drawer-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var d = document.getElementById(btn.getAttribute('data-drawer-open'));
      if (!d || typeof d.showModal !== 'function') return;
      var title = d.querySelector('[data-drawer-title]');
      if (title && btn.getAttribute('data-drawer-title')) title.textContent = btn.getAttribute('data-drawer-title');
      d.showModal();
      var close = d.querySelector('[data-drawer-close]');
      if (close) close.focus();
    });
  });
  document.querySelectorAll('dialog.a-drawer').forEach(function (d) {
    d.querySelectorAll('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });

  /* Déplacement d'une demande entre colonnes (maquette : select « Déplacer vers ») */
  document.querySelectorAll('[data-move-lead]').forEach(function (sel) {
    sel.addEventListener('change', function () {
      showToast('Demonstração : « ' + sel.options[sel.selectedIndex].text + ' » — a movimentação será salva no sistema conectado.');
      sel.selectedIndex = 0;
    });
  });

  /* Liste ordonnable : boutons monter / descendre (clavier) en plus du glisser */
  document.querySelectorAll('.a-sortable:not([data-managed])').forEach(function (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-move]');
      if (!btn) return;
      var li = btn.closest('li');
      if (btn.getAttribute('data-move') === 'up' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
      if (btn.getAttribute('data-move') === 'down' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
      Array.prototype.forEach.call(list.children, function (item, i) {
        var o = item.querySelector('.order');
        if (o) o.textContent = (i < 9 ? '0' : '') + (i + 1);
      });
      btn.focus();
    });
  });
})();
