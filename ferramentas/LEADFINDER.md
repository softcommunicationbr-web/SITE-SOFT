# LeadFinder no painel (/admin/leads)

O app LeadFinder (Next.js) portado para o site estático, com a mesma tela e o mesmo servidor:

| Parte | Arquivo |
|---|---|
| Tela | `maquette/admin/leads.html`, `maquette/assets/js/admin-leads.js`, `maquette/assets/css/leadfinder.css` |
| Servidor (mesmas rotas do original: `/leads`, `/places`, `/ai`, `/geocode`, `/bug`) | `supabase/functions/leadfinder/index.ts` |
| Banco (carteira compartilhada, teto de custo, registro) | `ferramentas/leadfinder.sql` |
| Login do painel (e-mail + senha ou Google, só e-mails da lista) | `ferramentas/admin_login.sql`, `maquette/assets/js/admin-auth.js` |

## Segurança

- **Login:** Supabase Auth com e-mail + senha ou Google. Só entra quem está em `portfolio_admins` (conferido no servidor por `admin_eh_permitido()`). Um login só vale para o painel inteiro e para a prospecção. A sessão some ao fechar a aba.
- **Prospecção:** o servidor confere de novo se o e-mail está em `leadfinder_membros` antes de gastar Google ou Claude.
- **Histórico:** `leadfinder_historico` guarda buscas, abordagens, mudanças de status e ideias (só o place_id, nunca dados da empresa). Ninguém edita; cada um só apaga as próprias ideias.
- **Chaves:** Google e Anthropic só nos secrets do Supabase, nunca no navegador nem no Git.

## Ligar (uma vez, no Supabase do projeto)

1. **SQL Editor:** rode `ferramentas/leadfinder.sql` e depois `ferramentas/admin_login.sql`.
2. **Usuário:** Authentication → Users → *Add user → Create new user* com o e-mail autorizado e a senha, marcando *Auto Confirm User*.
3. **Fechar cadastro:** Authentication → Sign In / Providers → desligar *Allow new users to sign up* (ninguém cria conta sozinho, nem pelo Google).
4. **Google:** Authentication → Sign In / Providers → Google → ligar e colar Client ID e Secret (criados no Google Cloud → APIs e serviços → Credenciais → ID do cliente OAuth, tipo Web, com o URI de redirecionamento `https://xvabghgvrhpnyywpmodb.supabase.co/auth/v1/callback`). Em URL Configuration → *Redirect URLs*: `https://softcommunicaiton.com/admin/**` e `https://www.softcommunicaiton.com/admin/**`.
5. **Função:** publicar `leadfinder` com **verify JWT desligado** (a função confere o usuário por conta própria).
6. **Secrets** (Edge Functions → Secrets):

| Secret | Valor |
|---|---|
| `GOOGLE_MAPS_API_KEY` | chave restrita **só** à Places API (New). Sem ela, o app roda em modo demonstração |
| `ANTHROPIC_API_KEY` | chave da Anthropic (começa com `sk-ant-api`) |
| `LEADFINDER_AI_MODEL` | opcional; padrão `claude-sonnet-5-5` |
| `LEADFINDER_AI_EFFORT` | opcional; padrão `low` |
| `LEADFINDER_DAILY_CALL_CAP` / `LEADFINDER_AI_DAILY_CAP` | opcionais; tetos diários (padrão 200 / 300) |
| `LEADFINDER_AGENT_TOKEN` | opcional; token do agente Hermes para `POST /ai` |
| `LEADFINDER_ALERT_WEBHOOK`, `LEADFINDER_ALERT_FORMAT` | opcionais; avisos de erro (como no original) |
| `RESEND_API_KEY` | chave do [Resend](https://resend.com) para o e-mail diário. Sem ela, o lembrete só aparece no painel |
| `LEADFINDER_RESUMO_FROM` | remetente do e-mail, ex.: `LeadFinder <avisos@softcommunicaiton.com>` (domínio verificado no Resend). Sem domínio verificado, o Resend só entrega no e-mail da própria conta |
| `LEADFINDER_CRON_SECRET` | segredo longo (o mesmo do `ferramentas/leadfinder_lembrete.sql`) |
| `LEADFINDER_TZ` | opcional; fuso para "hoje" (padrão `America/Sao_Paulo`) |
| `LEADFINDER_PAINEL_URL` | opcional; link do botão no e-mail (padrão `https://softcommunicaiton.com/admin/leads`) |

7. **Mapa:** para ver leads reais no mapa, crie uma **segunda** chave do Google, só Maps JavaScript API, restrita por referenciador a `https://softcommunicaiton.com/*`, e coloque em `googleMapsBrowserKey` no `assets/js/config.js`. Essa pode ficar pública, porque está restrita.
8. **Lembrete diário:** depois dos secrets acima, rode `ferramentas/leadfinder_lembrete.sql` trocando `SEGREDO_AQUI` pelo valor de `LEADFINDER_CRON_SECRET`. No painel, o botão "Enviar este resumo para meu e-mail" testa o envio só para você.
9. **Teto no fornecedor:** orçamento com alerta no Google Cloud e limite de gasto mensal na Anthropic.

## IA

Claude Sonnet 5.5 com esforço baixo (`output_config.effort: "low"`), API `2026-10-21`. Se o Sonnet recusar um pedido, a Anthropic tenta o modelo recomendado (`fallbacks: "default"`). O prompt fala dos serviços da Soft, usa só os dados do Google e diz o que falta.

## Como a tela funciona (por próximo passo)

Cada lead está numa etapa e mostra **um botão principal**: o que fazer agora. O resto fica no menu ⋯.

| Etapa | Botão principal | O que aparece junto |
|---|---|---|
| 1. Avaliar | Avaliar (raio-X) | — |
| 2. Abordar | Abordar no WhatsApp (passo 1) | raio-X e vídeos certos |
| 3. Aguardando | Passo 2/3 no dia certo · "Respondeu" | trilha da sequência e vídeos |
| 4. Respondeu | Fazer proposta → depois Marcar reunião / Virou cliente / Não fechou | formulário da proposta |
| 5. Negociando | Virou cliente / Não fechou | — |

- **Hoje** (tela inicial): a fila do dia em ordem — atrasados, quem respondeu, retornos de hoje, decisões, prontos para abordar e até 10 novos para avaliar. Barra "feitas · na fila", botão **Avaliar os N novos de uma vez** (mostra o custo antes) e **Começar**, o modo foco.
- **Modo foco**: um lead por vez em tela cheia; depois de cada ação passa sozinho para o próximo. Pular (→), Anterior e Sair (Esc).
- **Todos os leads**: consulta por etapa. **Histórico**, **Mapa/rota** e **Relatório** continuam como antes; a linha do tempo de cada empresa fica no ⋯ do card.

## Vender mais

| Recurso | Onde fica | Custo por uso |
|---|---|---|
| **Raio-X do lead** | card → *Vender* → Fazer raio-X. Lê só a página inicial do site que o Google informa (nunca um endereço vindo do navegador), respeita o robots.txt, bloqueia endereços internos, lê no máximo 1,5 MB em 8 s. Lista as falhas medidas, liga cada uma a um serviço e sugere como abrir a conversa. Instagram não é lido (o Instagram bloqueia robôs): o raio-X acha o @ no site e deixa o link para conferir à mão | 1 Google + 1 IA |
| **Portfólio certo** | card → *Vender*. Escolhe 3 vídeos ativos do catálogo pela categoria do lead e pelos serviços do raio-X; avisa quando os direitos estão "a confirmar" | grátis |
| **Proposta** | card → *Vender* → Gerar proposta (português, inglês ou francês). Abre na marca Soft (4 cores, Cormorant Garamond + Poppins), editável, e salva em PDF pelo navegador. A IA escreve só o texto; nome, descrição, entregáveis e preço de cada serviço vêm de `maquette/assets/js/leadfinder/ofertas.js` (preço vazio = "sob consulta") | 1 IA |
| **Sequência de abordagem** | botão de WhatsApp do card + 3 mensagens na coluna da esquerda. Passo 1 → 3 dias → passo 2 (com `{video}` = 1º vídeo do portfólio) → 4 dias → passo 3. Agenda o retorno sozinho e para quando o status vira Respondeu, Reunião, Cliente ou Descartado | grátis |
| **Hoje + e-mail diário** | quadro "Hoje" no topo da lista e e-mail às 8h (pg_cron) | nomes buscados no Google na hora (até 15) |
| **Rota do dia** | aba *Mapa*. Pré-seleciona os retornos de hoje, ordena as paradas (vizinho mais próximo + 2-opt) e abre no Google Maps (até 10 paradas) | grátis |
| **Relatório do mês** | aba *Relatório*. Funil, taxa de resposta, qual mensagem/categoria/passo funciona mais, por pessoa e áreas. Exporta CSV e imprime | grátis |

Tudo o que acontece entra no histórico (`leadfinder_historico`): busca, abordagem (com a mensagem, trocando o nome da empresa por `{nome}`), status, raio-X e proposta.
