/* ============================================================
   LeadFinder · proposta automática (documento para o cliente)
   Abre uma janela com a proposta no padrão da marca Soft:
   4 cores (chocolate, creme, areia, quase-preto), Cormorant Garamond + Poppins,
   sem sombra, sem degradê. Todo texto é editável antes de salvar em PDF.
   Nada vindo de fora entra como HTML: só textContent.
   ============================================================ */
(function (w) {
  'use strict';
  var LF = w.LF = w.LF || {};

  var T = {
    'pt-BR': { para: 'Proposta para', diag: 'O que vimos', prop: 'O que propomos', invest: 'Investimento', consulta: 'Investimento sob consulta', entreg: 'Inclui', portf: 'Trabalhos para você ver', ver: 'Assistir', passos: 'Próximos passos', contato: 'Contato', imprimir: 'Salvar em PDF', fechar: 'Fechar', dica: 'Clique em qualquer texto para editar. Depois, Salvar em PDF.', gerando: 'Gerando a proposta…', data: 'Data' },
    en: { para: 'Proposal for', diag: 'What we noticed', prop: 'What we propose', invest: 'Investment', consulta: 'Investment on request', entreg: 'Includes', portf: 'Work to see', ver: 'Watch', passos: 'Next steps', contato: 'Contact', imprimir: 'Save as PDF', fechar: 'Close', dica: 'Click any text to edit it, then Save as PDF.', gerando: 'Writing the proposal…', data: 'Date' },
    fr: { para: 'Proposition pour', diag: 'Ce que nous avons observé', prop: 'Ce que nous proposons', invest: 'Investissement', consulta: 'Investissement sur demande', entreg: 'Comprend', portf: 'Projets à voir', ver: 'Voir', passos: 'Prochaines étapes', contato: 'Contact', imprimir: 'Enregistrer en PDF', fechar: 'Fermer', dica: 'Cliquez sur un texte pour le modifier, puis Enregistrer en PDF.', gerando: 'Rédaction de la proposition…', data: 'Date' }
  };

  var CSS =
    '@import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@400;500;600&display=swap");' +
    ':root{--choc:#3B2A20;--creme:#F3EDE3;--areia:#D8C8B0;--preto:#1A1A1A}' +
    '*{box-sizing:border-box}html,body{margin:0;background:var(--creme);color:var(--choc);font-family:Poppins,system-ui,sans-serif;font-size:14px;line-height:1.6}' +
    '.bar{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--choc);color:var(--creme)}' +
    '.bar p{margin:0;font-size:12px}.bar button{font:600 13px Poppins,sans-serif;border:1px solid var(--creme);border-radius:8px;padding:8px 14px;cursor:pointer;background:var(--creme);color:var(--choc)}' +
    '.bar button.sec{background:transparent;color:var(--creme)}' +
    '.doc{max-width:820px;margin:0 auto;padding:48px 40px 64px}' +
    'header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:24px;border-bottom:1px solid var(--areia)}' +
    'header img{height:40px;width:auto}.meta{text-align:right;font-size:12px}' +
    'h1,h2,h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;color:var(--choc);margin:0}' +
    'h1{font-size:44px;line-height:1.05;margin:40px 0 12px}h2{font-size:28px;margin:40px 0 12px}h3{font-size:21px}' +
    '.kicker{font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}' +
    'ul{margin:0;padding-left:20px}li{margin:6px 0}' +
    '.item{border:1px solid var(--areia);border-radius:16px;padding:20px 24px;margin:12px 0;break-inside:avoid}' +
    '.item .preco{margin-top:12px;font-weight:600}.item .desc{margin:4px 0 8px}' +
    '.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}' +
    '.vid{border:1px solid var(--areia);border-radius:8px;overflow:hidden;break-inside:avoid;text-decoration:none;color:var(--choc)}' +
    '.vid img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;background:var(--areia)}.vid span{display:block;padding:8px 10px;font-size:12px;font-weight:500}' +
    'footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--areia);font-size:12px;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between}' +
    '[contenteditable]:hover{outline:1px dashed var(--areia);outline-offset:2px}[contenteditable]:focus{outline:1px solid var(--choc);outline-offset:2px}' +
    '.wait{padding:96px 24px;text-align:center;font-family:"Cormorant Garamond",serif;font-size:28px}.erro{color:var(--choc);border:1px solid var(--choc);border-radius:8px;padding:16px;margin:24px}' +
    '@media (max-width:640px){.doc{padding:32px 16px}.grid{grid-template-columns:1fr}h1{font-size:34px}header{flex-direction:column}.meta{text-align:left}}' +
    '@media print{.bar{display:none}html,body{background:#fff}.doc{padding:0}[contenteditable]:hover,[contenteditable]:focus{outline:none}a{color:var(--choc)}@page{margin:16mm}}';

  /** Abre a janela já no clique (evita bloqueio de pop-up) e mostra "gerando". */
  LF.proposalWindow = function (idioma) {
    var t = T[idioma] || T['pt-BR'];
    var win = w.open('', '_blank');
    if (!win) return null;
    var d = win.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proposta · Soft Communication</title></head><body></body></html>');
    d.close();
    var st = d.createElement('style'); st.textContent = CSS; d.head.appendChild(st);
    var wait = d.createElement('div'); wait.className = 'wait'; wait.textContent = t.gerando; d.body.appendChild(wait);
    return win;
  };

  LF.proposalError = function (win, msg) {
    if (!win || win.closed) return;
    var d = win.document; d.body.textContent = '';
    var p = d.createElement('p'); p.className = 'erro'; p.textContent = msg; d.body.appendChild(p);
  };

  /**
   * data: { idioma, empresa, categoria, texto (resposta do /proposta), servicos[], ofertas, videos:[{titulo,url,poster}], contato:{email,whatsapp,instagram,site}, logo }
   */
  LF.renderProposal = function (win, data) {
    if (!win || win.closed) return;
    var t = T[data.idioma] || T['pt-BR'];
    var d = win.document, x = data.texto || {};
    d.documentElement.lang = data.idioma === 'pt-BR' ? 'pt-BR' : data.idioma;
    d.title = (x.titulo || t.para + ' ' + data.empresa) + ' · Soft Communication';
    d.body.textContent = '';
    function el(tag, cls, txt, edit) {
      var n = d.createElement(tag);
      if (cls) n.className = cls;
      if (txt !== undefined && txt !== null) n.textContent = txt;
      if (edit) n.setAttribute('contenteditable', 'true');
      return n;
    }
    function add(parent, kids) { kids.forEach(function (k) { if (k) parent.appendChild(k); }); return parent; }

    var bar = add(el('div', 'bar'), [el('p', null, t.dica), add(el('div'), [
      (function () { var b = el('button', null, t.imprimir); b.type = 'button'; b.addEventListener('click', function () { win.print(); }); return b; })(),
      (function () { var b = el('button', 'sec', t.fechar); b.type = 'button'; b.style.marginLeft = '8px'; b.addEventListener('click', function () { win.close(); }); return b; })()
    ])]);
    d.body.appendChild(bar);

    var doc = el('main', 'doc');
    var logo = d.createElement('img'); logo.src = data.logo; logo.alt = 'Soft Communication';
    var hoje = new Date().toLocaleDateString(data.idioma === 'en' ? 'en-GB' : data.idioma === 'fr' ? 'fr-FR' : 'pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    add(doc, [add(el('header'), [logo, add(el('div', 'meta'), [el('div', 'kicker', t.para), el('div', null, data.empresa, true), el('div', null, t.data + ': ' + hoje, true)])])]);

    add(doc, [el('h1', null, x.titulo || (t.para + ' ' + data.empresa), true)]);
    if (x.abertura) doc.appendChild(el('p', null, x.abertura, true));

    if (x.diagnostico && x.diagnostico.length) {
      doc.appendChild(el('h2', null, t.diag, true));
      add(doc, [add(el('ul'), x.diagnostico.map(function (p) { return el('li', null, p, true); }))]);
    }

    doc.appendChild(el('h2', null, t.prop, true));
    (x.itens || []).forEach(function (it) {
      var o = (data.ofertas || {})[it.servico] || { nome: it.servico, descricao: '', entregaveis: [], preco: '' };
      var box = add(el('section', 'item'), [el('h3', null, o.nome, true), o.descricao ? el('p', 'desc', o.descricao, true) : null, it.porque ? el('p', null, it.porque, true) : null]);
      if (o.entregaveis && o.entregaveis.length) add(box, [el('div', 'kicker', t.entreg), add(el('ul'), o.entregaveis.map(function (e) { return el('li', null, e, true); }))]);
      box.appendChild(el('div', 'preco', o.preco ? t.invest + ': ' + o.preco : t.consulta, true));
      doc.appendChild(box);
    });

    var vids = (data.videos || []).filter(function (v) { return LF.httpUrl(v.url); });
    if (vids.length) {
      doc.appendChild(el('h2', null, t.portf, true));
      add(doc, [add(el('div', 'grid'), vids.map(function (v) {
        var a = d.createElement('a'); a.className = 'vid'; a.href = LF.httpUrl(v.url); a.target = '_blank'; a.rel = 'noopener noreferrer';
        if (v.poster && LF.httpUrl(v.poster)) { var im = d.createElement('img'); im.src = LF.httpUrl(v.poster); im.alt = ''; im.loading = 'lazy'; a.appendChild(im); }
        a.appendChild(el('span', null, v.titulo + ' · ' + t.ver));
        return a;
      }))]);
    }

    if (x.proximos_passos && x.proximos_passos.length) {
      doc.appendChild(el('h2', null, t.passos, true));
      add(doc, [add(el('ul'), x.proximos_passos.map(function (p) { return el('li', null, p, true); }))]);
    }
    if (x.fechamento) doc.appendChild(el('p', null, x.fechamento, true));

    var c = data.contato || {};
    add(doc, [add(el('footer'), [
      el('div', null, 'Soft Communication'),
      c.email ? el('div', null, c.email) : null,
      c.whatsapp ? el('div', null, 'WhatsApp +' + String(c.whatsapp).replace(/\D/g, '')) : null,
      c.instagram ? el('div', null, c.instagram) : null,
      c.site ? el('div', null, c.site.replace(/^https?:\/\//, '').replace(/\/$/, '')) : null
    ])]);
    d.body.appendChild(doc);
    win.focus();
  };
})(window);
