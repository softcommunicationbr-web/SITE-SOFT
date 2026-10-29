# Prospecção no painel (LeadFinder → /admin/leads)

Página `maquette/admin/leads.html` + `assets/js/admin-leads.js` (tela), `supabase/functions/leadfinder/index.ts` (servidor) e `ferramentas/leadfinder.sql` (banco). É a porta do app LeadFinder (Next.js) para o painel estático da Soft. Busca empresas no Google Places, guarda uma carteira compartilhada e usa o Claude para analisar cada lead ou responder perguntas livres.

## Por que é diferente do resto do painel

A senha do painel (`admin-auth.js`) só esconde a tela: ela não protege nada no servidor. Esta página gasta dinheiro (Google e Anthropic), então tem **um segundo login, real**:

- link mágico do Supabase Auth, sem cadastro aberto (`create_user: false`);
- e-mail precisa estar em `leadfinder_membros`;
- toda chamada paga passa pela Edge Function, que confere a sessão e o teto diário (`leadfinder_uso`, persistente);
- as chaves do Google e da Anthropic ficam só nos secrets do Supabase, nunca no navegador nem no Git.

## Ligar (uma vez)

1. **Banco:** rode `ferramentas/leadfinder.sql` no SQL Editor e cadastre os 3 e-mails:
   `insert into public.leadfinder_membros (email) values ('a@x.com'),('b@x.com'),('c@x.com');`
2. **Usuários:** Supabase → Authentication → Users → *Invite user* para os mesmos 3 e-mails.
3. **Redirect do link:** Authentication → URL Configuration → *Redirect URLs*: `https://softcommunicaiton.com/admin/leads` e `https://www.softcommunicaiton.com/admin/leads`.
4. **Função:** `supabase functions deploy leadfinder` (ou pelo painel, colando `index.ts`).
5. **Secrets** (Edge Functions → Secrets), na conta do Calebe:

| Secret | Obrigatório | Valor |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | para buscar | chave restrita **só** à Places API (New), sem restrição de referenciador (é usada no servidor) |
| `ANTHROPIC_API_KEY` | para a IA | chave da Anthropic. Sem ela, a página funciona e avisa "IA não ligada" |
| `LEADFINDER_AI_MODEL` | não | padrão `claude-haiku-5-5` (barato). Trocar por `claude-sonnet-5-5` se quiser análises mais finas |
| `LEADFINDER_DAILY_CALL_CAP` | não | teto diário de chamadas ao Google (padrão 200) |
| `LEADFINDER_AI_DAILY_CAP` | não | teto diário de análises/perguntas à IA (padrão 100) |
| `LEADFINDER_ORIGINS` | não | domínios que podem chamar a função (padrão: softcommunicaiton.com, www, site-soft.vercel.app, localhost:8000) |

6. **Teto no fornecedor (a proteção real):** orçamento com alerta e cota diária no Google Cloud; limite de gasto mensal no Console da Anthropic.

## Regras de uso

- **Google Places:** a carteira guarda só o `place_id`; nome, endereço e telefone são buscados de novo ao abrir. Não exportar listas, não mostrar em mapa que não seja do Google.
- **Contato:** individual e revisado, nunca em massa. Toda mensagem sugerida oferece "não receber mais". Empresas (pessoa jurídica) apenas. A Polinésia segue a lei francesa (Informatique et Libertés/RGPD); o Brasil, a LGPD. O `leadfinder_log` registra quem buscou e analisou.
- **IA:** a análise usa só os dados da busca e diz o que falta. Revise antes de enviar.

## O que fica de fora (de propósito)

- Mapa, varredura de área, exportação CSV e backup do app original: o mapa exige Google Maps JS com chave de navegador, e a exportação conflita com os termos do Places.
- O token do agente Hermes (`LEADFINDER_AGENT_TOKEN`): não foi trazido para cá. Se precisar, ele ganha uma conta própria em `leadfinder_membros`.
