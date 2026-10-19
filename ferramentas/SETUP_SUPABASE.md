# Ligar o painel ao Supabase (publicar para todos, de qualquer aparelho)

Sem isto, o painel funciona em **modo local**: o que você muda fica só no seu navegador (rascunho) e
o botão **Exportar catálogo** gera o arquivo `assets/data/catalog.js` para você substituir no site.

Com isto, qualquer mudança no painel vai para o site **na hora**, no celular e no computador, com login.

## O que você precisa
- O projeto Supabase onde estão os vídeos (`xvabghgvrhpnyywpmodb`, bucket `videos-portifolio`).
- Acesso ao painel do Supabase como dono do projeto.

## Passo a passo
1. **Login do dono.** No Supabase: *Authentication → Users → Add user*. Cadastre o e-mail e uma senha forte.
   Em *Authentication → Providers → Email*, deixe "Allow new users to sign up" **desligado**.
2. **Tabela e permissões.** *SQL Editor → New query*: cole `supabase.sql`, troque `dono@exemplo.com`
   pelo e-mail do passo 1 na linha do `insert ... portfolio_admins` e rode.
3. **Catálogo inicial.** No mesmo editor, cole `supabase_seed.sql` e rode (cria os 52 vídeos).
4. **Chave pública.** *Project Settings → API*: copie a chave **anon public**.
   Abra `maquette/assets/js/config.js` e cole em `supabaseAnonKey`. **Nunca** use a `service_role`.
5. **Teste.** Abra `admin/mediatheque.html`: aparece a janela de login. Entre, edite um título e abra o site.
   O banner do painel passa a dizer "Conectado ao Supabase".
6. **Feche os pedidos de orçamento.** Hoje a chave pública consegue ler a tabela `pedidos_orcamento`
   (nomes, e-mails e telefones de clientes). Depois do passo 5, siga o bloco 5 de `supabase.sql`.
7. **Antes de publicar o site:** em `config.js`, `showAdminLinks: false` (esconde o botão ADMIN)
   e, quando os direitos estiverem confirmados, `enforceRights: true` (o site só mostra vídeos com direitos confirmados).

## Como funciona
| Quem | O que consegue |
| --- | --- |
| Visitante do site | Lê só os vídeos **ativos** (política `publico le videos ativos`). |
| Dono logado (e-mail em `portfolio_admins`) | Lê tudo, cria, edita, remove e envia arquivos. |
| Qualquer outra pessoa | Nada além da leitura pública. |

- O painel guarda a sessão só na aba (`sessionStorage`). Fechou a aba, precisa entrar de novo.
- Enviar arquivo: o painel manda o vídeo e a capa para o bucket e cria a linha na tabela.
- Remover um vídeo no painel tira do site, mas **não apaga** o arquivo do bucket.

## Limites desta versão
- Não há autenticação em dois fatores nem histórico de versões (previstos para a etapa 4).
- O painel não grava alterações de textos fixos da página (títulos de seção, serviços): só vídeos e destaques.
- Se o Supabase ficar fora do ar, o site mostra o catálogo padrão embutido (`assets/data/catalog.js`).
