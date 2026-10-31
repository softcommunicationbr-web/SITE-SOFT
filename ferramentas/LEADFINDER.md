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

7. **Mapa:** para ver leads reais no mapa, crie uma **segunda** chave do Google, só Maps JavaScript API, restrita por referenciador a `https://softcommunicaiton.com/*`, e coloque em `googleMapsBrowserKey` no `assets/js/config.js`. Essa pode ficar pública, porque está restrita.
8. **Teto no fornecedor:** orçamento com alerta no Google Cloud e limite de gasto mensal na Anthropic.

## IA

Claude Sonnet 5.5 com esforço baixo (`output_config.effort: "low"`), API `2026-10-21`. Se o Sonnet recusar um pedido, a Anthropic tenta o modelo recomendado (`fallbacks: "default"`). O prompt fala dos serviços da Soft, usa só os dados do Google e diz o que falta.
