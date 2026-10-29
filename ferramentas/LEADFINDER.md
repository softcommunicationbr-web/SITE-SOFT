# LeadFinder no painel (/admin/leads)

O app LeadFinder (Next.js) portado para o site estático, com a mesma tela e o mesmo servidor:

| Parte | Arquivo |
|---|---|
| Tela | `maquette/admin/leads.html`, `maquette/assets/js/admin-leads.js`, `maquette/assets/css/leadfinder.css` |
| Servidor (mesmas rotas do original: `/leads`, `/places`, `/ai`, `/geocode`, `/bug`) | `supabase/functions/leadfinder/index.ts` |
| Banco (carteira compartilhada, teto de custo, registro) | `ferramentas/leadfinder.sql` |
| Senha do painel no servidor | `ferramentas/admin_senha.sql` |

## Segurança

- **Senha do painel:** só o hash fica no banco. O código do site não tem mais senha. 10 erros em 10 minutos bloqueiam por 10 minutos.
- **Prospecção:** além da senha do painel, exige login por link mágico (Supabase Auth) de um e-mail cadastrado em `leadfinder_membros`. O servidor confere tudo; a senha do painel sozinha não libera o gasto.
- **Chaves:** Google e Anthropic só nos secrets do Supabase, nunca no navegador nem no Git.

## Ligar (uma vez, no Supabase do projeto)

1. **SQL Editor:** rode `ferramentas/leadfinder.sql` e depois `ferramentas/admin_senha.sql`. Em seguida, defina a senha (troque pela senha escolhida):
   `update public.admin_auth set password_hash = extensions.crypt('SENHA', extensions.gen_salt('bf'));`
2. **Membros:** `insert into public.leadfinder_membros (email) values ('a@x.com'),('b@x.com'),('c@x.com');`
3. **Usuários:** Authentication → Users → *Invite user* para os mesmos 3 e-mails.
4. **Redirect:** Authentication → URL Configuration → *Redirect URLs*: `https://softcommunicaiton.com/admin/leads` e `https://www.softcommunicaiton.com/admin/leads`.
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
