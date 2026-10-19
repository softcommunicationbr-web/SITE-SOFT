/* ============================================================
   Soft Communication · comportamentos do site público
   Sem rastreamento. O formulário só prepara uma mensagem:
   nada é enviado sem o visitante confirmar no WhatsApp ou no e-mail.
   ============================================================ */
(function (w, d) {
  'use strict';
  var CFG = w.SOFT_CONFIG || {};
  var reduceMotion = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noop = function () {};

  /* Nome da marca: variável única */
  var BRAND_NAME = 'Soft Communication';
  d.querySelectorAll('[data-brand]').forEach(function (el) { el.textContent = BRAND_NAME; });

  /* Links do painel: somem quando showAdminLinks === false */
  if (CFG.showAdminLinks === false) {
    d.querySelectorAll('[data-admin-link]').forEach(function (el) { el.hidden = true; el.style.display = 'none'; });
  }

  /* ---------- Cabeçalho: chocolate no hero, creme depois ---------- */
  var header = d.querySelector('.site-header');
  var hero = d.querySelector('[data-hero]');
  function updateHeader() {
    if (!header) return;
    var light = hero ? (hero.getBoundingClientRect().bottom - header.offsetHeight <= 0) : (w.scrollY > 24);
    header.classList.toggle('t-creme', light);
    header.classList.toggle('t-chocolate', !light);
  }
  w.addEventListener('scroll', updateHeader, { passive: true });
  w.addEventListener('resize', updateHeader);
  updateHeader();

  /* ---------- Menu móvel ---------- */
  var toggle = d.querySelector('.menu-toggle');
  var menu = d.getElementById('mobile-menu');
  var lastFocus = null;
  function openMenu() {
    lastFocus = d.activeElement;
    menu.hidden = false; menu.setAttribute('data-open', '');
    d.body.setAttribute('data-menu-open', '');
    toggle.setAttribute('aria-expanded', 'true');
    var first = menu.querySelector('a, button'); if (first) first.focus();
  }
  function closeMenu(noRefocus) {
    menu.removeAttribute('data-open'); menu.hidden = true;
    d.body.removeAttribute('data-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (!noRefocus && lastFocus && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) { lastFocus.focus(); }
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { if (menu.hasAttribute('data-open')) closeMenu(); else openMenu(); });
    menu.querySelectorAll('[data-menu-close]').forEach(function (b) {
      b.addEventListener('click', function () { closeMenu(true); });
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.hasAttribute('data-open')) closeMenu(); });
  }

  /* ---------- Navegação suave e restauração de âncoras (#) ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;

    // Se clicou no logo da marca no topo
    if (a.classList.contains('brand') && (href === '#conteudo' || href === '#top' || href === '#')) {
      e.preventDefault();
      if (menu && menu.hasAttribute('data-open')) closeMenu(true);
      w.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }

    // Se for link âncora interno
    if (href.charAt(0) === '#' && href.length > 1 && href !== '#visionneuse') {
      var target = d.querySelector(href);
      if (target) {
        e.preventDefault();
        if (menu && menu.hasAttribute('data-open')) closeMenu(true);
        var headerH = header ? header.offsetHeight : 72;
        var targetY = target.getBoundingClientRect().top + w.pageYOffset - (headerH + 20);
        w.scrollTo({ top: Math.max(0, targetY), behavior: reduceMotion ? 'auto' : 'smooth' });
        if (w.history && w.history.pushState) {
          w.history.pushState(null, null, href);
        }
      }
    }
  });

  /* ---------- Seletor de idioma ---------- */
  function closeLangs(except) {
    d.querySelectorAll('.lang-dropdown[data-open]').forEach(function (dd) {
      if (dd === except) return;
      dd.removeAttribute('data-open');
      var m = dd.querySelector('.lang-menu'); if (m) m.hidden = true;
      var b = dd.querySelector('[data-lang-toggle]'); if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  d.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var wrap = btn.closest('.lang-dropdown'), m = wrap && wrap.querySelector('.lang-menu');
      if (!m) return;
      var was = wrap.hasAttribute('data-open');
      closeLangs();
      if (!was) { wrap.setAttribute('data-open', ''); m.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
    });
  });
  d.addEventListener('click', function (e) {
    var inside = e.target.closest && e.target.closest('.lang-dropdown');
    closeLangs(inside || null);
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = d.querySelector('.lang-dropdown[data-open] [data-lang-toggle]');
    closeLangs(); if (open) open.focus();
  });

  /* ---------- Aparição das seções (uma vez) ---------- */
  if (!reduceMotion && 'IntersectionObserver' in w) {
    var vh = w.innerHeight, rev = d.querySelectorAll('[data-reveal]');
    rev.forEach(function (el) { if (el.getBoundingClientRect().top > vh) el.classList.add('will-reveal'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Capas leves com hover intent inteligente (zero travamento) ---------- */
  var canHover = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hoverNow = null;
  var hoverTimer = null;
  function hostOf(link) { return link.querySelector('.media') || link; }
  function ensureVideo(link) {
    var host = hostOf(link), v = host.querySelector('video.hover-video');
    if (v) return v;
    var src = link.getAttribute('data-video-src'); if (!src) return null;
    v = d.createElement('video');
    v.className = 'hover-video'; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('aria-hidden', 'true'); v.src = src;
    host.insertBefore(v, host.querySelector('.tile-play-btn'));
    return v;
  }
  function startHover(link) {
    if (reduceMotion || !canHover) return;
    if (hoverNow && hoverNow !== link) stopHover(hoverNow);
    var v = ensureVideo(link); if (!v) return;
    hoverNow = link; v.play().catch(noop);
  }
  function stopHover(link) {
    clearTimeout(hoverTimer);
    var v = hostOf(link).querySelector('video.hover-video');
    if (v) { try { v.pause(); } catch (e) { /* ignora */ } }
    if (hoverNow === link) hoverNow = null;
  }
  function scheduleHover(link) {
    if (reduceMotion || !canHover) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () {
      startHover(link);
    }, 110);
  }

  d.addEventListener('pointerover', function (e) {
    var l = e.target.closest && e.target.closest('[data-hover-play]');
    if (l) scheduleHover(l);
  }, { passive: true });
  d.addEventListener('pointerout', function (e) {
    var l = e.target.closest && e.target.closest('[data-hover-play]');
    if (l && !(e.relatedTarget && l.contains(e.relatedTarget))) stopHover(l);
  }, { passive: true });
  d.addEventListener('focusin', function (e) {
    var l = e.target.closest && e.target.closest('[data-hover-play]'); if (l) startHover(l);
  });
  d.addEventListener('focusout', function (e) {
    var l = e.target.closest && e.target.closest('[data-hover-play]'); if (l) stopHover(l);
  });

  /* ---------- Visionneuse em tela cheia (dialog nativo: Esc e foco preso) ---------- */
  d.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-lightbox-open]'); if (!btn) return;
    var dialog = d.getElementById(btn.getAttribute('data-lightbox-open'));
    var src = btn.getAttribute('data-video-src');
    if (!dialog || typeof dialog.showModal !== 'function' || !src) return;
    e.preventDefault();
    if (hoverNow) stopHover(hoverNow);
    var v = dialog.querySelector('video'), cap = dialog.querySelector('.lightbox-caption');
    dialog.setAttribute('data-orient', btn.getAttribute('data-orient') || 'landscape');
    if (v) {
      v.poster = btn.getAttribute('data-poster') || '';
      v.src = src;
      try { v.currentTime = 0; } catch (x) { /* ignora */ }
      v.play().catch(noop);
    }
    if (cap) cap.textContent = (btn.getAttribute('data-video-title') || cap.getAttribute('data-default') || '').replace(/^\[|\]$/g, '').trim();
    dialog.showModal();
    var close = dialog.querySelector('[data-lightbox-close]'); if (close) close.focus();
  });
  function stopLightbox(dialog) {
    var v = dialog.querySelector('video');
    if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* ignora */ } }
  }
  d.querySelectorAll('dialog.lightbox').forEach(function (dialog) {
    dialog.querySelectorAll('[data-lightbox-close]').forEach(function (b) {
      b.addEventListener('click', function () { stopLightbox(dialog); dialog.close(); });
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) { stopLightbox(dialog); dialog.close(); } });
    dialog.addEventListener('close', function () { stopLightbox(dialog); });
    dialog.addEventListener('cancel', function () { stopLightbox(dialog); });
  });

  /* ---------- Painel de privacidade: nada é medido antes da escolha ---------- */
  var consent = d.getElementById('consent');
  if (consent) {
    var choice = null;
    try { choice = w.localStorage.getItem('soft-consent'); } catch (e) { choice = null; }
    if (!choice) {
      var showConsent = function () { w.setTimeout(function () { consent.hidden = false; }, 900); };
      if (d.documentElement.classList.contains('has-preloader')) w.addEventListener('soft-preloader-done', showConsent, { once: true });
      else showConsent();
    }
    consent.querySelectorAll('[data-consent]').forEach(function (b) {
      b.addEventListener('click', function () {
        try { w.localStorage.setItem('soft-consent', b.getAttribute('data-consent')); } catch (e) { /* sem armazenamento */ }
        consent.hidden = true;
      });
    });
  }

  /* ---------- Voltar ao topo ---------- */
  var topBtn = d.querySelector('.back-to-top');
  if (topBtn) {
    var showTop = function () { topBtn.hidden = w.scrollY < w.innerHeight; };
    w.addEventListener('scroll', showTop, { passive: true });
    showTop();
    topBtn.addEventListener('click', function () {
      w.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var first = d.querySelector('.site-header a, .site-header button'); if (first) first.focus();
    });
  }

  /* ---------- Formulário de contato: prepara a mensagem (WhatsApp ou e-mail) ---------- */
  function buildMessage(form) {
    var fd = new FormData(form), tpl = form.getAttribute('data-template') || '{name}.{need}\n{phone}\n{email}\n\n{message}';
    var needs = fd.getAll('need').join(', ');
    var phone = (fd.get('phone') || fd.get('whatsapp') || '').toString().trim();
    var email = (fd.get('email') || '').toString().trim();
    var company = (fd.get('company') || '').toString().trim();
    var out = tpl
      .replace('{name}', (fd.get('name') || '').toString().trim())
      .replace('{company}', company ? (form.getAttribute('data-company-prefix') || ', da ') + company : '')
      .replace('{phone}', phone ? '\nTelefone: ' + phone : '')
      .replace('{email}', email ? '\nE-mail: ' + email : '')
      .replace('{need}', needs ? (form.getAttribute('data-need-prefix') || ' Gostaria de falar sobre: ') + needs : '')
      .replace('{message}', (fd.get('message') || '').toString().trim());
    return out.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
  }
  /* ---------- Supabase Configuração Global ---------- */
  var SUPABASE_URL = 'https://xvabghgvrhpnyywpmodb.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YWJnaGd2cmhwbnl5d3Btb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTgwNTEsImV4cCI6MjEwNzMzNDA1MX0.d0CNiaTYEnpsCY4N9qS6HNIxa3u7DYtzAOErvZHzC0w';

  d.querySelectorAll('form[data-wa-form]').forEach(function (form) {
    var status = form.querySelector('[data-form-status]');
    function show(html) { if (!status) return; status.hidden = false; status.innerHTML = html; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      // Salva no banco de dados Supabase (tabela pedidos_orcamento)
      var fd = new FormData(form);
      var name = (fd.get('name') || '').toString().trim();
      var phone = (fd.get('phone') || fd.get('whatsapp') || '').toString().trim();
      var email = (fd.get('email') || '').toString().trim();
      var needs = fd.getAll('need');
      var msg = (fd.get('message') || '').toString().trim();

      fetch(SUPABASE_URL + '/rest/v1/pedidos_orcamento?select=id,numero&order=id.desc&limit=1', {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON }
      })
      .then(function(r){ return r.json(); })
      .then(function(latest) {
        var nextNumStr = '0015';
        if (latest && latest.length > 0 && latest[0].numero) {
          var lastInt = parseInt(latest[0].numero, 10);
          if (!isNaN(lastInt)) {
            var n = lastInt + 1;
            nextNumStr = (n < 10 ? '000' : (n < 100 ? '00' : (n < 1000 ? '0' : ''))) + n;
          }
        }
        return fetch(SUPABASE_URL + '/rest/v1/pedidos_orcamento', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': 'Bearer ' + SUPABASE_ANON,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            numero: nextNumStr,
            cliente_nome: name,
            cliente_telefone: phone || 'Não informado',
            cliente_email: email || 'contato@site.cliente',
            servicos: needs.length > 0 ? needs : ['Audiovisual'],
            mensagem: msg,
            status: 'novo',
            score: 4,
            idioma: d.documentElement.lang ? d.documentElement.lang.slice(0, 2) : 'pt',
            origem: 'Formulário do Site',
            prazo: 'A combinar',
            observacoes: 'Lead cadastrado diretamente pelo formulário de contato do site.'
          })
        });
      })
      .catch(function(err){ console.warn('Supabase lead log error:', err); });

      var href = 'https://wa.me/' + (CFG.whatsapp || '') + '?text=' + encodeURIComponent(buildMessage(form));
      var opened = w.open(href, '_blank', 'noopener');
      var a = '<a href="' + href + '" target="_blank" rel="noopener">' + form.getAttribute('data-open-label') + '</a>';
      show(form.getAttribute('data-wa-status') + ' ' + a);
      if (!opened && status) status.focus();
    });
    var mailBtn = form.querySelector('[data-mail-button]');
    if (mailBtn) mailBtn.addEventListener('click', function () {
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var href = 'mailto:' + (CFG.email || '') + '?subject=' + encodeURIComponent(form.getAttribute('data-subject') || '') +
        '&body=' + encodeURIComponent(buildMessage(form));
      show(form.getAttribute('data-mail-status'));
      w.location.href = href;
    });
  });

  /* ---------- Formulário de Pedido de Orçamento (Conexão Supabase Real) ---------- */
  var orcForm = d.getElementById('form-orcamento');
  if (orcForm) {
    orcForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nomeInput = d.getElementById('orc-nome');
      var emailInput = d.getElementById('orc-email');
      var telInput = d.getElementById('orc-telefone');
      var setorInput = d.getElementById('orc-setor');
      var prazoInput = d.getElementById('orc-prazo');
      var msgInput = d.getElementById('orc-mensagem');
      var statusBox = d.getElementById('orcamento-status');
      var submitBtn = orcForm.querySelector('button[type="submit"]');

      var nome = (nomeInput ? nomeInput.value : '').trim();
      var email = (emailInput ? emailInput.value : '').trim();
      var tel = (telInput ? telInput.value : '').trim();
      var setor = (setorInput ? setorInput.value : 'Geral');
      var prazo = (prazoInput ? prazoInput.value : 'Em 1 a 3 meses');
      var msg = (msgInput ? msgInput.value : '').trim();

      if (!nome || !email || !msg) {
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.background = '#8A2B2B';
          statusBox.style.color = '#FFF';
          statusBox.textContent = 'Por favor, preencha seu nome, e-mail e os detalhes do projeto.';
        }
        return;
      }

      var servicos = [];
      orcForm.querySelectorAll('input[name="servicos"]:checked').forEach(function(ck) {
        servicos.push(ck.value);
      });
      if (servicos.length === 0) {
        servicos.push('Produção Audiovisual');
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('data-original-text', submitBtn.textContent);
        submitBtn.textContent = 'ENVIANDO AO BANCO DE DADOS...';
      }
      if (statusBox) {
        statusBox.hidden = false;
        statusBox.style.background = 'var(--areia)';
        statusBox.style.color = 'var(--chocolate)';
        statusBox.textContent = 'Gravando sua solicitação no sistema...';
      }

      var score = 3;
      if (setor.indexOf('Hotelaria') !== -1 || setor.indexOf('Imobiliário') !== -1) score += 1;
      if (servicos.length >= 2) score += 1;
      if (score > 5) score = 5;

      fetch(SUPABASE_URL + '/rest/v1/pedidos_orcamento?select=id,numero&order=id.desc&limit=1', {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON
        }
      })
      .then(function(res) { return res.json(); })
      .then(function(latest) {
        var nextNumStr = '0014';
        if (latest && latest.length > 0 && latest[0].numero) {
          var lastInt = parseInt(latest[0].numero, 10);
          if (!isNaN(lastInt)) {
            var n = lastInt + 1;
            nextNumStr = (n < 10 ? '000' : (n < 100 ? '00' : (n < 1000 ? '0' : ''))) + n;
          }
        }

        var payload = {
          numero: nextNumStr,
          cliente_nome: nome,
          cliente_email: email,
          cliente_telefone: tel || null,
          servicos: servicos,
          mensagem: msg,
          status: 'novo',
          score: score,
          idioma: 'pt',
          origem: 'Site Oficial (Formulário Direto)',
          prazo: prazo,
          observacoes: 'Solicitação registrada diretamente pela página mãe.'
        };

        return fetch(SUPABASE_URL + '/rest/v1/pedidos_orcamento', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': 'Bearer ' + SUPABASE_ANON,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        })
        .then(function(postRes) {
          if (!postRes.ok) throw new Error('HTTP ' + postRes.status);
          return postRes.json();
        })
        .then(function(saved) {
          var waLeadUrl = 'https://wa.me/68987043112?text=' + encodeURIComponent(
            'Olá Soft Communication! Acabei de enviar um pedido de orçamento no site:\n' +
            '• Nome: ' + nome + '\n' +
            '• Contato: ' + (tel || email) + '\n' +
            '• Setor: ' + setor + '\n' +
            '• Prazo: ' + prazo + '\n' +
            '• Mensagem: ' + msg
          );
          if (statusBox) {
            statusBox.hidden = false;
            statusBox.style.background = '#2E4B33';
            statusBox.style.color = '#FFF';
            statusBox.innerHTML = '<strong>✓ Pedido registrado com sucesso no banco de dados!</strong><br>' +
              'Protocolo Oficial: <strong>Nº ' + nextNumStr + '</strong><br>' +
              'Nossa equipe entrará em contato em até 24 horas úteis no e-mail <em>' + email + '</em>.<br>' +
              '<div style="margin-top:12px;"><a href="' + waLeadUrl + '" target="_blank" rel="noopener" style="background:var(--areia); color:var(--chocolate); display:inline-block; padding:10px 18px; font-weight:600; text-decoration:none;">Abrir conversa no WhatsApp agora &rarr;</a></div>';
          }
          try { w.open(waLeadUrl, '_blank', 'noopener'); } catch(e){}
          orcForm.reset();
        });
      })
      .catch(function(err) {
        console.warn('Erro ao salvar no Supabase:', err);
        var waFallback = 'https://wa.me/68987043112?text=' + encodeURIComponent('Olá Soft Communication, gostaria de um orçamento para ' + nome + ' (' + (tel || email) + '): ' + msg);
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.background = '#8A2B2B';
          statusBox.style.color = '#FFF';
          statusBox.innerHTML = 'Houve uma instabilidade temporária na rede ao salvar no banco. ' +
            'Por favor, clique para enviar diretamente pelo WhatsApp: ' +
            '<a href="' + waFallback + '" style="color:#FFF; text-decoration:underline;" target="_blank">Conversar no WhatsApp &rarr;</a>';
        }
      })
      .finally(function() {
        if (submitBtn) {
          submitBtn.disabled = false;
          var orig = submitBtn.getAttribute('data-original-text');
          if (orig) submitBtn.textContent = orig;
        }
      });
    });
  }
})(window, document);
