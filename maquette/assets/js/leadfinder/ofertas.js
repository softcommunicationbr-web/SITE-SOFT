/* ============================================================
   Soft Communication · ofertas usadas na proposta automática
   EDITE AQUI: nome, descrição, entregáveis e preço de cada serviço.
   Preço vazio ('') aparece na proposta como "Investimento sob consulta".
   A IA nunca escreve preço, prazo nem entregável: só o "porquê".
   ============================================================ */
(function (w) {
  'use strict';
  var LF = w.LF = w.LF || {};

  LF.OFERTAS = {
    branding: {
      curto: 'Branding',
      nome: 'Branding e identidade visual',
      descricao: 'Posicionamento e identidade visual da marca.',
      entregaveis: [],   // ex.: ['Logo e variações', 'Paleta e tipografia', 'Aplicações principais']
      preco: ''          // ex.: 'R$ 0.000' ou 'a partir de 0.000 XPF'
    },
    manual: {
      curto: 'Manual',
      nome: 'Manual de marca',
      descricao: 'Regras de uso da marca para manter tudo consistente.',
      entregaveis: [],
      preco: ''
    },
    site: {
      curto: 'Site',
      nome: 'Criação de site',
      descricao: 'Site rápido, pensado para o celular e para ser encontrado no Google.',
      entregaveis: [],
      preco: ''
    },
    motion: {
      curto: 'Vídeo',
      nome: 'Motion design e vídeo',
      descricao: 'Vídeos institucionais, publicitários e conteúdo curto para redes.',
      entregaveis: [],
      preco: ''
    },
    instagram: {
      curto: 'Instagram',
      nome: 'Gestão e automação de Instagram',
      descricao: 'Conteúdo, rotina de publicação e respostas automáticas.',
      entregaveis: [],
      preco: ''
    }
  };

  /* Contato que aparece no fim da proposta (vem do config.js do site). */
  LF.PROPOSTA_SITE = 'https://softcommunicaiton.com/';
})(window);
