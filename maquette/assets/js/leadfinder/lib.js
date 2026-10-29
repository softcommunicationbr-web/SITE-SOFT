/* ============================================================
   LeadFinder (porte estático) · utilitários puros
   Porte 1:1 de lib/categories.ts, lib/score.ts, lib/grid.ts,
   lib/regions.ts, lib/leads.ts e lib/types.ts do app Next.js.
   Sem DOM aqui: só dados e funções.
   ============================================================ */
(function (w) {
  'use strict';

  var LF = w.LF = w.LF || {};

  /* ---------- lib/types.ts ---------- */
  LF.STATUSES = ['Novo', 'Contato pendente', 'Contatado', 'Respondeu', 'Reunião marcada', 'Cliente', 'Descartado'];

  /* ---------- lib/categories.ts (os leads de demonstração vêm do servidor) ---------- */
  LF.CATEGORIES = [
    'Revendas de carros',
    'Equipamentos industriais',
    'Imobiliárias',
    'Restaurantes e lanchonetes',
    'Clínicas e estética',
    'Academias',
    'Lojas de móveis',
    'Farmácias',
    'Supermercados',
    'Igrejas',
    'Outras empresas'
  ];

  /* ---------- lib/score.ts ---------- */
  LF.GOALS = [
    { id: 'digital', label: 'Serviço digital', hint: 'Sobe quem tem reputação e ainda não tem site' },
    { id: 'balanced', label: 'Equilibrado', hint: 'Nota, volume de avaliações e presença de site' }
  ];

  /** Heurística de prioridade 0–100. Não prevê conversão nem orçamento. */
  LF.scoreLead = function (l, goal) {
    var rating = typeof l.rating === 'number' ? l.rating : 3;
    var count = typeof l.ratingCount === 'number' ? l.ratingCount : 0;
    var hasSite = Boolean(l.website);
    var raw = goal === 'digital'
      ? (rating / 5) * 45 + Math.min(25, Math.log10(count + 1) * 10) + (hasSite ? 0 : 30)
      : (rating / 5) * 65 + Math.min(20, Math.log10(count + 1) * 8) + (hasSite ? 8 : 0);
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  /* ---------- lib/grid.ts ---------- */
  /** Grade de centros que cobre um círculo grande com círculos pequenos (varredura de área). Quadrados inscritos: passo = r·√2 não deixa buracos. */
  LF.sweepCenters = function (lat, lng, areaRadiusKm, cellRadiusKm) {
    var step = cellRadiusKm * Math.SQRT2;
    var kmPerLat = 111.32;
    var out = [];
    var n = Math.ceil(areaRadiusKm / step);
    for (var i = -n; i <= n; i++) {
      for (var j = -n; j <= n; j++) {
        var dy = i * step, dx = j * step;
        if (Math.hypot(dx, dy) > areaRadiusKm + cellRadiusKm) continue; // fora da área
        var la = lat + dy / kmPerLat;
        if (Math.abs(la) > 85) continue; // perto dos polos a grade em lat/lng deixa de ser confiável
        var lo = lng + dx / (kmPerLat * Math.max(0.05, Math.cos((la * Math.PI) / 180)));
        out.push({ lat: la, lng: ((lo + 540) % 360) - 180 });
      }
    }
    return out;
  };

  /* ---------- lib/regions.ts ---------- */
  /** Sugestões rápidas (sem rede). Qualquer lugar do mundo pode ser digitado e localizado; esta lista é só atalho. */
  LF.REGIONS = [
    { label: 'Palhoça, SC, Brasil', lat: -27.6455, lng: -48.6697 },
    { label: 'Florianópolis, SC, Brasil', lat: -27.5954, lng: -48.548 },
    { label: 'São Paulo, SP, Brasil', lat: -23.5505, lng: -46.6333 },
    { label: 'Rio de Janeiro, RJ, Brasil', lat: -22.9068, lng: -43.1729 },
    { label: 'Lisboa, Portugal', lat: 38.7223, lng: -9.1393 },
    { label: 'Miami, FL, USA', lat: 25.7617, lng: -80.1918 },
    { label: 'New York, NY, USA', lat: 40.7128, lng: -74.006 },
    { label: 'Los Angeles, CA, USA', lat: 34.0522, lng: -118.2437 },
    { label: 'Londres, Reino Unido', lat: 51.5074, lng: -0.1278 },
    { label: 'Madri, Espanha', lat: 40.4168, lng: -3.7038 },
    { label: 'Paris, França', lat: 48.8566, lng: 2.3522 },
    { label: 'Dubai, Emirados Árabes', lat: 25.2048, lng: 55.2708 },
    { label: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816 },
    { label: 'Cidade do México, México', lat: 19.4326, lng: -99.1332 },
    { label: 'Tóquio, Japão', lat: 35.6762, lng: 139.6503 },
    { label: 'Sydney, Austrália', lat: -33.8688, lng: 151.2093 }
  ];

  /** Coordenada válida em qualquer lugar do planeta. */
  LF.validCoords = function (lat, lng) {
    return typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  };

  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
  LF.findRegion = function (q) {
    var n = norm(q || '');
    if (!n) return undefined;
    for (var i = 0; i < LF.REGIONS.length; i++) {
      var r = LF.REGIONS[i];
      if (norm(r.label) === n || norm(r.label.split(',')[0]) === n) return r;
    }
    return undefined;
  };

  /* ---------- lib/leads.ts ---------- */
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  function str(v, max) { return typeof v === 'string' ? v.slice(0, max || 300) : undefined; }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : undefined; }
  /** Só http/https passam (bloqueia javascript:, data:, etc.). */
  function httpUrl(v) {
    if (typeof v !== 'string') return undefined;
    try { var u = new URL(v); return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : undefined; } catch (e) { return undefined; }
  }
  LF.httpUrl = httpUrl;
  LF.isDate = function (v) { return typeof v === 'string' && DATE_RE.test(v); };

  /** Valida a análise da IA (mesmo formato de Lead.ai). */
  LF.sanitizeAi = function (a) {
    if (!a || typeof a !== 'object' || ['A', 'B', 'C'].indexOf(a.tier) < 0) return undefined;
    return {
      tier: a.tier,
      fit: Math.max(0, Math.min(100, num(a.fit) || 0)),
      reason: str(a.reason, 500) || '',
      opportunity: str(a.opportunity, 500) || '',
      message: str(a.message, 600) || '',
      missing: Array.isArray(a.missing) ? a.missing.filter(function (x) { return typeof x === 'string'; }).slice(0, 6).map(function (x) { return x.slice(0, 150); }) : []
    };
  };

  /** Valida/normaliza um lead vindo de fora (servidor, localStorage, backup, tabela). Bloqueia URLs não-http (ex.: javascript:). */
  LF.sanitizeLead = function (x) {
    if (!x || typeof x !== 'object') return null;
    var o = x;
    var id = str(o.id, 200), pending = o.pending === true;
    var name = (str(o.name, 200) || '').trim() || (pending ? 'Carregando…' : undefined);
    if (!id || !name) return null;
    var okCoords = LF.validCoords(o.lat, o.lng);
    return {
      id: id, name: name,
      address: str(o.address) || '',
      category: str(o.category, 80) || 'Outras empresas',
      rating: num(o.rating), ratingCount: num(o.ratingCount),
      website: httpUrl(o.website), phone: str(o.phone, 40), googleMapsUri: httpUrl(o.googleMapsUri),
      lat: okCoords ? num(o.lat) : undefined, lng: okCoords ? num(o.lng) : undefined,
      score: Math.max(0, Math.min(100, num(o.score) || 0)),
      status: LF.STATUSES.indexOf(o.status) >= 0 ? o.status : 'Novo',
      demo: o.demo === true, pending: pending,
      ai: LF.sanitizeAi(o.ai),
      notes: str(o.notes, 1000),
      nextAction: LF.isDate(o.nextAction) ? o.nextAction : undefined,
      lastContact: LF.isDate(o.lastContact) ? o.lastContact : undefined
    };
  };

  /** Data local de hoje no formato yyyy-mm-dd. */
  LF.todayLocal = function () { return new Date().toLocaleDateString('sv-SE'); };

  /** Distância em km (haversine). */
  LF.distanceKm = function (aLat, aLng, bLat, bLng) {
    var r = Math.PI / 180, dLat = (bLat - aLat) * r, dLng = (bLng - aLng) * r;
    var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  };

  /** Link wa.me: internacional (+código) em qualquer país; sem "+", só celular brasileiro (11 dígitos, 3º dígito 9). */
  LF.whatsappLink = function (phone, text) {
    if (!phone) return null;
    if (phone.trim().charAt(0) === '+') {
      var intl = phone.replace(/\D/g, '');
      return intl.length >= 8 && intl.length <= 15 ? 'https://wa.me/' + intl + '?text=' + encodeURIComponent(text) : null;
    }
    var d = phone.replace(/\D/g, '');
    if (d.indexOf('55') === 0 && d.length >= 12) d = d.slice(2);
    if (d.length !== 11 || d.charAt(2) !== '9') return null;
    return 'https://wa.me/55' + d + '?text=' + encodeURIComponent(text);
  };

  /* ---------- DOM seguro (só textContent/createElement) ---------- */
  /** el('div', {class:'x', text:'...', on:{click:fn}}, [filhos]) — atributos nunca recebem HTML. */
  LF.el = function (tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else if (k === 'value') n.value = v;
      else if (k === 'checked') n.checked = !!v;
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (p) { n.style[p] = v[p]; });
      else n.setAttribute(k, v === true ? '' : String(v));
    });
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return n;
  };

  /* Ícones do app (mesmos paths do page.tsx). Constantes nossas, montadas com createElementNS. */
  LF.ICONS = {
    search: 'M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
    download: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
    upload: 'M12 15V3m0 0L8 7m4-4l4 4M4 21h16',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
    star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    pin: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    out: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z',
    note: 'M5 3h14v18l-4-3-3 3-3-3-4 3zM8 8h8M8 12h5',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0'
  };
  LF.icon = function (name, size) {
    var NS = 'http://www.w3.org/2000/svg', s = String(size || 16);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', s); svg.setAttribute('height', s); svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', LF.ICONS[name]); svg.appendChild(p);
    return svg;
  };
})(window);
