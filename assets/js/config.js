/* ============================================================
   Soft Communication · configuração do site e do painel
   Edite este arquivo para ligar o painel ao Supabase.
   ============================================================ */
window.SOFT_CONFIG = {
  /* Contato (botões e formulário da página) */
  whatsapp: '68987043112',                      /* formato internacional, só dígitos: +689 87 04 31 12 */
  email: 'soft.communicationbr@gmail.com',
  instagram: 'https://instagram.com/soft.communicationbr',
  instagramHandle: '@soft.communicationbr',

  /* Backend do painel (Supabase).
     Vazio = modo local: as alterações do painel ficam só neste navegador.
     Passo a passo: SETUP_SUPABASE.md */
  supabaseUrl: 'https://xvabghgvrhpnyywpmodb.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2YWJnaGd2cmhwbnl5d3Btb2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NTgwNTEsImV4cCI6MjEwNzMzNDA1MX0.d0CNiaTYEnpsCY4N9qS6HNIxa3u7DYtzAOErvZHzC0w',
  table: 'portfolio_videos',
  bucket: 'videos-portifolio',

  /* Regras de publicação */
  enforceRights: false,                         /* true: o site público só mostra vídeos com direitos confirmados */
  showAdminLinks: false                         /* false: remove o botão ADMIN e o selo "Área Administrativa" */
};
