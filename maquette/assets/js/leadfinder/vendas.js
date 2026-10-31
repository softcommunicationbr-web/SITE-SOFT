/* ============================================================
   LeadFinder · vender mais (funções puras, testáveis)
   - portfólio certo para cada lead
   - sequência de abordagem (1º contato, vídeo-exemplo, último toque)
   - rota do dia (ordem de visitas)
   - relatório do mês (a partir do histórico)
   ============================================================ */
(function (w) {
  'use strict';
  var LF = w.LF = w.LF || {};

  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  /* ---------- Portfólio certo para cada lead ---------- */
  // Palavras que ligam a categoria do lead aos vídeos do catálogo (título, etiquetas, setor, serviço).
  var CAT_WORDS = {
    'Restaurantes e lanchonetes': ['gastronomia', 'restaurante', 'lifestyle', 'ugc', 'social', 'reels'],
    'Clínicas e estética': ['retrato', 'presenca', 'estetica', 'lifestyle', 'stories', 'institucional', 'luz natural'],
    'Imobiliárias': ['imobili', 'arquitetura', 'villa', 'hotel', 'paisagem', 'tropical', 'hotellerie'],
    'Revendas de carros': ['automotivo', 'rally', 'acao', 'impacto', 'motion', 'concessionaria'],
    'Equipamentos industriais': ['institucional', 'motion', 'render', 'conceit', 'detalhe', 'servicos'],
    'Academias': ['impacto', 'reels', 'social', 'ugc', 'acao', 'viral'],
    'Lojas de móveis': ['arquitetura', 'detalhe', 'design', 'estetica', 'textura', 'render'],
    'Farmácias': ['institucional', 'servicos', 'motion', 'reels', 'stories'],
    'Supermercados': ['gastronomia', 'ugc', 'reels', 'social', 'lifestyle'],
    'Igrejas': ['institucional', 'stories', 'bastidores', 'cinema', 'natureza', 'retrato'],
    'Outras empresas': ['showreel', 'servicos', 'institucional', 'motion']
  };
  // O serviço indicado no raio-X puxa um formato.
  var SERV_WORDS = {
    motion: ['reels', 'motion', 'showreel', 'impacto'],
    instagram: ['reels', 'stories', 'social', 'ugc'],
    site: ['institucional', 'cinema', 'showreel'],
    branding: ['motion', 'estetica', 'conceit', 'design'],
    manual: ['estetica', 'design', 'motion']
  };
  var VERTICAL = { instagram: true, motion: true };

  function text(it) { return norm([it.title, it.label, it.tags, it.sector, it.service, it.alt].join(' ')); }
  function group(it) { return norm(String(it.tags || '').split(',')[0]); }

  /**
   * Escolhe até `n` vídeos do catálogo para mostrar a este lead.
   * Ativos primeiro; direitos confirmados ganham ponto; no máximo 2 do mesmo grupo de etiqueta.
   * Devolve [{ item, score, motivos[], direitos }].
   */
  LF.pickPortfolio = function (lead, items, raiox, n) {
    n = n || 3;
    var cat = CAT_WORDS[lead && lead.category] || CAT_WORDS['Outras empresas'];
    var servs = (raiox && raiox.servicos) || [];
    var wantVertical = servs.some(function (s) { return VERTICAL[s]; });
    var scored = (items || []).filter(function (it) { return it && it.active !== false && (it.url || it.filename); }).map(function (it) {
      var t = text(it), score = 0, motivos = [];
      cat.forEach(function (k) { if (t.indexOf(k) >= 0) { score += 3; if (motivos.length < 2) motivos.push(k); } });
      servs.forEach(function (s, i) { (SERV_WORDS[s] || []).forEach(function (k) { if (t.indexOf(k) >= 0) score += i === 0 ? 2 : 1; }); });
      var vertical = it.w && it.h ? it.h > it.w : /9:16/.test(it.aspect || '');
      if (wantVertical && vertical) { score += 2; motivos.push('formato vertical'); }
      if (!wantVertical && !vertical) score += 1;
      if (it.rights === 'confirmado') score += 1;
      if (/showreel|servicos/.test(t)) score += 0.5; // peça coringa
      return { item: it, score: score, motivos: motivos, direitos: it.rights === 'confirmado' };
    }).sort(function (a, b) { return b.score - a.score || (a.item.position || 0) - (b.item.position || 0); });
    var out = [], perGroup = {};
    for (var i = 0; i < scored.length && out.length < n; i++) {
      var g = group(scored[i].item);
      if ((perGroup[g] || 0) >= 2) continue;
      perGroup[g] = (perGroup[g] || 0) + 1;
      out.push(scored[i]);
    }
    return out;
  };

  LF.videoUrl = function (it, base) { return it.url || (String(base || '') + it.filename); };

  /* ---------- Sequência de abordagem ---------- */
  LF.SEQ = [
    { passo: 1, nome: '1º contato', espera: 3 },
    { passo: 2, nome: 'Vídeo-exemplo', espera: 4 },
    { passo: 3, nome: 'Último toque', espera: 0 }
  ];
  LF.SEQ_DEFAULTS = [
    'Olá! Tudo bem? Vi a {nome} no Google e gostei do trabalho de vocês. Posso te mostrar uma ideia rápida para atrair mais clientes? Se preferir não receber mensagens, é só avisar.',
    'Oi! Passando para mostrar um exemplo do que fazemos: {video} Dá para criar algo nessa linha para a {nome}. Se preferir não receber mensagens, é só avisar.',
    'Oi! Última mensagem por aqui. Se em algum momento fizer sentido conversar sobre vídeo ou marca para a {nome}, é só me chamar. Obrigado!'
  ];
  var SEQ_ATIVA = ['Novo', 'Contato pendente', 'Contatado'];

  function addDays(iso, n) {
    var p = iso.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2] + n);
    return d.toLocaleDateString('sv-SE');
  }
  LF.addDays = addDays;

  /** Estado da sequência de um lead: { ativa, feito, proximo (objeto do passo) | null, motivo } */
  LF.seqState = function (lead) {
    var feito = Math.max(0, Math.min(3, lead && lead.seq || 0));
    if (SEQ_ATIVA.indexOf(lead && lead.status) < 0) return { ativa: false, feito: feito, proximo: null, motivo: feito ? 'Encerrada: ' + lead.status : '' };
    if (feito >= 3) return { ativa: false, feito: 3, proximo: null, motivo: 'Sequência concluída' };
    return { ativa: true, feito: feito, proximo: LF.SEQ[feito], motivo: '' };
  };

  /** Mudanças no lead depois de fazer o passo `passo` hoje. */
  LF.seqPatch = function (lead, passo, today) {
    var p = LF.SEQ[passo - 1];
    var patch = { seq: Math.max(lead.seq || 0, passo), lastContact: today };
    if (lead.status === 'Novo') patch.status = 'Contato pendente';
    // próximo retorno automático, sem apagar uma data manual mais distante
    if (p.espera > 0) {
      var auto = addDays(today, p.espera);
      patch.nextAction = lead.nextAction && lead.nextAction > auto ? lead.nextAction : auto;
    } else patch.nextAction = undefined;
    return patch;
  };

  /** Monta a mensagem do passo, trocando {nome} e {video}. */
  LF.seqMessage = function (templates, passo, nome, videoUrl) {
    var t = (templates && templates[passo - 1]) || LF.SEQ_DEFAULTS[passo - 1];
    return t.replace(/\{nome\}/gi, nome || '').replace(/\{video\}/gi, videoUrl || '').replace(/[ \t]{2,}/g, ' ').trim();
  };

  /* ---------- Rota do dia ---------- */
  var km = function (a, b) { return LF.distanceKm(a.lat, a.lng, b.lat, b.lng); };
  function pathKm(start, order) {
    var t = 0, prev = start;
    order.forEach(function (p) { t += km(prev, p); prev = p; });
    return t;
  }
  /** Ordem das paradas: vizinho mais próximo + melhoria 2-opt (rota aberta, começa em `start`). */
  LF.planRoute = function (start, stops) {
    var rest = stops.filter(function (s) { return LF.validCoords(s.lat, s.lng); }).slice();
    var order = [], cur = start;
    while (rest.length) {
      var bi = 0, bd = Infinity;
      rest.forEach(function (s, i) { var d = km(cur, s); if (d < bd) { bd = d; bi = i; } });
      cur = rest.splice(bi, 1)[0]; order.push(cur);
    }
    var better = true, guard = 0;
    while (better && guard++ < 50) {
      better = false;
      for (var i = 0; i < order.length - 1; i++) {
        for (var j = i + 1; j < order.length; j++) {
          var cand = order.slice(0, i).concat(order.slice(i, j + 1).reverse(), order.slice(j + 1));
          if (pathKm(start, cand) + 1e-9 < pathKm(start, order)) { order = cand; better = true; }
        }
      }
    }
    return { order: order, km: pathKm(start, order) };
  };
  /** Link do Google Maps com a rota (até 9 paradas intermediárias + destino). */
  LF.routeUrl = function (start, order, mode) {
    if (!order.length) return '';
    var ll = function (p) { return p.lat.toFixed(6) + ',' + p.lng.toFixed(6); };
    var dest = order[order.length - 1], mid = order.slice(0, -1).slice(0, 9);
    var u = 'https://www.google.com/maps/dir/?api=1&travelmode=' + (mode || 'driving') + '&origin=' + ll(start) + '&destination=' + ll(dest);
    if (dest.id && !dest.demo) u += '&destination_place_id=' + encodeURIComponent(dest.id);
    if (mid.length) {
      u += '&waypoints=' + mid.map(ll).join('%7C');
      if (mid.every(function (p) { return p.id && !p.demo; })) u += '&waypoint_place_ids=' + mid.map(function (p) { return encodeURIComponent(p.id); }).join('%7C');
    }
    return u;
  };
  LF.ROUTE_MAX = 10;

  /* ---------- Relatório do mês ---------- */
  var RESPONDEU = ['Respondeu', 'Reunião marcada', 'Cliente'];
  /**
   * rows: histórico desde o início do mês até hoje (ordem qualquer).
   * Contagens = eventos do mês; conversão de mensagens = leads abordados no mês que responderam depois (até hoje).
   */
  LF.monthReport = function (rows, from, to) {
    var inMonth = rows.filter(function (h) { return h.em >= from && h.em < to; });
    var uniq = function (list) { return new Set(list.map(function (h) { return h.place_id; }).filter(Boolean)).size; };
    var by = function (tipo) { return inMonth.filter(function (h) { return h.tipo === tipo; }); };
    var statusTo = function (s) { return by('status').filter(function (h) { return h.para === s; }); };
    var contatos = by('contato');
    var responded = {};
    rows.forEach(function (h) { if (h.tipo === 'status' && RESPONDEU.indexOf(h.para) >= 0 && h.place_id) { var t = responded[h.place_id]; if (!t || h.em < t) responded[h.place_id] = h.em; } });
    var abordados = {};
    contatos.forEach(function (h) { if (h.place_id && (!abordados[h.place_id] || h.em < abordados[h.place_id].em)) abordados[h.place_id] = h; });
    var ids = Object.keys(abordados);
    var resp = ids.filter(function (id) { return responded[id] && responded[id] >= abordados[id].em; });

    function groupRate(keyFn) {
      var m = {};
      ids.forEach(function (id) {
        var k = keyFn(abordados[id]) || '(sem informação)';
        m[k] = m[k] || { chave: k, abordados: 0, responderam: 0 };
        m[k].abordados++;
        if (responded[id] && responded[id] >= abordados[id].em) m[k].responderam++;
      });
      return Object.keys(m).map(function (k) { var x = m[k]; x.taxa = x.abordados ? x.responderam / x.abordados : 0; return x; })
        .sort(function (a, b) { return b.abordados - a.abordados || b.taxa - a.taxa; });
    }
    var pessoas = {};
    contatos.forEach(function (h) { var k = String(h.email || '').split('@')[0] || 'alguém'; pessoas[k] = (pessoas[k] || 0) + 1; });
    var areas = {};
    by('busca').forEach(function (h) { if (h.texto) areas[h.texto] = (areas[h.texto] || 0) + 1; });

    return {
      buscas: by('busca').length,
      areas: Object.keys(areas).length,
      abordados: ids.length,
      abordagens: contatos.length,
      responderam: resp.length,
      reunioes: uniq(statusTo('Reunião marcada')),
      clientes: uniq(statusTo('Cliente')),
      descartados: uniq(statusTo('Descartado')),
      propostas: by('proposta').length,
      raiox: by('raiox').length,
      ideias: by('ideia').length,
      taxaResposta: ids.length ? resp.length / ids.length : 0,
      porMensagem: groupRate(function (h) { return (h.texto || '').slice(0, 140); }).slice(0, 8),
      porCategoria: groupRate(function (h) { return h.categoria; }).slice(0, 11),
      porCanal: groupRate(function (h) { return h.de; }),
      porPessoa: Object.keys(pessoas).map(function (k) { return { pessoa: k, abordagens: pessoas[k] }; }).sort(function (a, b) { return b.abordagens - a.abordagens; }),
      topAreas: Object.keys(areas).map(function (k) { return { area: k, buscas: areas[k] }; }).sort(function (a, b) { return b.buscas - a.buscas; }).slice(0, 10)
    };
  };

  /** Início e fim (ISO, UTC) de um mês local "yyyy-mm". */
  LF.monthRange = function (ym) {
    var p = ym.split('-').map(Number);
    return { from: new Date(p[0], p[1] - 1, 1).toISOString(), to: new Date(p[0], p[1], 1).toISOString() };
  };
})(window);
