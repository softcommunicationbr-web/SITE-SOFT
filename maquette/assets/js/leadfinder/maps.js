/* ============================================================
   LeadFinder (porte estático) · mapas
   - LeadMap: Leaflet 1.9.4 + OpenStreetMap, só para leads demo.
   - GoogleLeadMap: Maps JS do Google, obrigatório para leads reais
     (termos do Places). Carregado só quando há chave e leads reais.
   O elemento de cada mapa é criado uma vez e reaproveitado entre
   renderizações (equivale ao componente montado no React).
   ============================================================ */
(function (w, d) {
  'use strict';

  var LF = w.LF = w.LF || {};
  var el = LF.el;

  var LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  var LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
  var LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';

  function hasPoint(l) { return typeof l.lat === 'number' && typeof l.lng === 'number'; }

  /* ---------- carregadores (uma vez só) ---------- */
  var leafletLoader = null;
  function loadLeaflet() {
    if (w.L && w.L.map) return Promise.resolve(w.L);
    if (leafletLoader) return leafletLoader;
    leafletLoader = new Promise(function (resolve, reject) {
      if (!d.querySelector('link[data-lf-leaflet]')) {
        var css = d.createElement('link');
        css.rel = 'stylesheet'; css.href = LEAFLET_CSS; css.integrity = LEAFLET_CSS_SRI; css.crossOrigin = '';
        css.setAttribute('data-lf-leaflet', '');
        d.head.appendChild(css);
      }
      var s = d.createElement('script');
      s.src = LEAFLET_JS; s.integrity = LEAFLET_JS_SRI; s.crossOrigin = ''; s.async = true;
      s.onload = function () { resolve(w.L); };
      s.onerror = function () { leafletLoader = null; reject(new Error('Falha ao carregar o mapa (Leaflet)')); };
      d.head.appendChild(s);
    });
    return leafletLoader;
  }

  var googleLoader = null;
  function loadGoogle(key) {
    if (w.google && w.google.maps) return Promise.resolve(w.google);
    if (googleLoader) return googleLoader;
    googleLoader = new Promise(function (resolve, reject) {
      var s = d.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&language=pt-BR';
      s.async = true;
      s.onload = function () { resolve(w.google); };
      s.onerror = function () { googleLoader = null; reject(new Error('Falha ao carregar o Google Maps')); };
      d.head.appendChild(s);
    });
    return googleLoader;
  }

  /* ---------- LeadMap (Leaflet/OSM) ---------- */
  var lm = { box: null, map: null, layer: null, icon: null, last: null };

  function leafletPopup(lead) {
    var box = el('div', null, [
      el('strong', { text: lead.name }), el('br'),
      lead.category, el('br'),
      lead.address, el('br'),
      el('small', { text: 'Prioridade: ' + lead.score + '/100' })
    ]);
    var href = LF.httpUrl(lead.googleMapsUri);
    if (href) { box.appendChild(el('br')); box.appendChild(el('a', { href: href, target: '_blank', rel: 'noopener noreferrer', text: 'Abrir no Google Maps' })); }
    return box;
  }

  /** Assinatura dos dados do mapa: só redesenha quando muda (igual às dependências do useEffect). */
  function mapKey(leads, center) {
    return JSON.stringify([center ? [center.lat, center.lng] : null, leads.map(function (l) { return [l.id, l.lat, l.lng, l.score, l.name, l.pending ? 1 : 0]; })]);
  }

  function drawLeaflet(L, leads, center) {
    var key = mapKey(leads, center);
    if (lm.map && lm.last === key) { lm.map.invalidateSize(); return; }
    lm.last = key;
    if (!lm.map) {
      lm.map = L.map(lm.inner, { center: center ? [center.lat, center.lng] : [20, 0], zoom: center ? 10 : 2, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' // texto fixo nosso, sem dado externo
      }).addTo(lm.map);
      lm.layer = L.layerGroup().addTo(lm.map);
      lm.icon = L.divIcon({ className: 'pin', html: '<span></span>', iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26] }); // HTML fixo, sem dado
    }
    lm.map.invalidateSize();
    lm.layer.clearLayers();
    var pts = leads.filter(hasPoint);
    pts.forEach(function (lead) {
      L.marker([lead.lat, lead.lng], { icon: lm.icon }).bindPopup(leafletPopup(lead)).addTo(lm.layer);
    });
    if (pts.length) lm.map.fitBounds(L.latLngBounds(pts.map(function (l) { return [l.lat, l.lng]; })), { padding: [28, 28], maxZoom: 13 });
    else if (center) lm.map.setView([center.lat, center.lng], 10);
    else lm.map.setView([20, 0], 2);
  }

  /** Devolve o elemento do mapa OSM (sempre o mesmo) e atualiza os pinos. */
  LF.leadMap = function (leads, center) {
    if (!lm.box) {
      lm.inner = el('div', { class: 'map' });
      lm.box = lm.inner;
      lm.loading = el('div', { class: 'map empty', text: 'Carregando mapa…' });
    }
    var wrap = (w.L && w.L.map) ? lm.box : lm.loading;
    loadLeaflet().then(function (L) {
      if (lm.loading.parentNode) lm.loading.parentNode.replaceChild(lm.box, lm.loading);
      // espera o elemento estar no documento (o React só desenha depois de montar)
      w.setTimeout(function () { if (d.body.contains(lm.box)) drawLeaflet(L, leads, center); }, 0);
    }, function (e) {
      lm.loading.textContent = e.message + '. Confira sua conexão.';
    });
    return wrap;
  };

  /* ---------- GoogleLeadMap ---------- */
  var gm = { box: null, map: null, markers: [], info: null, err: null };

  /** Mapa Google real (obrigatório pelos termos do Places para mostrar resultados do Places em mapa). */
  LF.googleLeadMap = function (leads, center, apiKey) {
    if (gm.err) return el('div', { class: 'map empty', text: gm.err + '. Confira a chave do navegador (Maps JavaScript API ativada e restrição de referenciador).' });
    if (!gm.box) gm.box = el('div', { class: 'map' });
    var box = gm.box;
    var loading = null;
    if (!(w.google && w.google.maps)) loading = el('div', { class: 'map empty', text: 'Carregando mapa Google…' });
    loadGoogle(apiKey).then(function (g) {
      if (loading && loading.parentNode) loading.parentNode.replaceChild(box, loading);
      if (!d.body.contains(box)) return;
      if (!gm.map) gm.map = new g.maps.Map(box, { center: center || { lat: 20, lng: 0 }, zoom: center ? 10 : 2, streetViewControl: false });
      if (!gm.info) gm.info = new g.maps.InfoWindow();
      var key = mapKey(leads, center);
      if (gm.last === key) return;
      gm.last = key;
      gm.markers.forEach(function (m) { m.setMap(null); }); gm.markers = [];
      var pts = leads.filter(function (l) { return hasPoint(l) && !l.pending; });
      var bounds = new g.maps.LatLngBounds();
      pts.forEach(function (l) {
        var m = new g.maps.Marker({ position: { lat: l.lat, lng: l.lng }, map: gm.map, title: l.name });
        m.addListener('click', function () {
          var b = el('div', null, [el('strong', { text: l.name }), el('br'), l.category + ' · ' + l.address + ' · ' + l.score + '/100']);
          gm.info.setContent(b); gm.info.open({ map: gm.map, anchor: m });
        });
        gm.markers.push(m); bounds.extend(m.getPosition());
      });
      if (pts.length) gm.map.fitBounds(bounds, 40); else if (center) { gm.map.setCenter(center); gm.map.setZoom(10); }
    }, function (e) {
      gm.err = e instanceof Error ? e.message : 'Erro no mapa';
      var target = loading && loading.parentNode ? loading : (box.parentNode ? box : null);
      if (target) target.parentNode.replaceChild(LF.googleLeadMap(leads, center, apiKey), target);
    });
    return loading || box;
  };
})(window, document);
