# Guia Completo de Automações · Soft Communication

Este documento reúne todas as automações implementadas no projeto, divididas em:
1. **Automações Locais (Build, Watcher, Auditoria e Sync)**
2. **Automações de Banco de Dados no Supabase (Lead Scoring, Protocolos e Triggers)**
3. **Automação de Notificações em Tempo Real (Discord, Telegram e E-mail)**
4. **Automação de Agendamentos (Cal.com / Calendly integrado ao Kanban Admin)**

---

## 1. Automações Locais de Desenvolvimento

Todos os scripts ficam em `ferramentas/` e funcionam 100% com a biblioteca padrão do Python (sem necessidade de instalar pacotes adicionais).

| Ferramenta | Comando | Para que serve |
| --- | --- | --- |
| **Watcher & Auto-Build** | `python3 ferramentas/dev_watch.py` | Monitora alterações em `build_site.py`, `legal_content.py`, `preloader.py` e `origem/`. Ao salvar qualquer arquivo, reescreve as 16 páginas do site em menos de 1 segundo automaticamente. |
| **Watcher + Servidor Local** | `python3 ferramentas/dev_watch.py --serve` | Além do auto-build contínuo, inicia um servidor HTTP local em `http://localhost:8080/maquette/`. Adicione `--open` para abrir direto no navegador padrão. |
| **Auditoria e Validação** | `python3 ferramentas/audit_site.py` | Escaneia todas as 24 páginas HTML, checa todos os links relativos (zero links quebrados/404), valida tags de SEO (H1 único, títulos, meta descriptions, hreflang PT/FR/EN), integridade de imagens e os 52 itens do catálogo. |
| **Auto-Renovação SEO/AEO/GEO** | `python3 ferramentas/auto_renovar_seo.py` | Renova automaticamente as tags de produção de SEO, AEO e GEO (canônicos, hreflang, robots, JSON-LD, sitemap lastmod e llms.txt), valida conformidade com 0 erros e suporta ping IndexNow e modo `--watch`. Integrado ao final do `build_site.py` e `dev_watch.py`. |
| **Sincronizador do Catálogo** | `python3 ferramentas/sync_catalog.py` | Conecta diretamente na API do Supabase e baixa todos os vídeos atualizados para `catalog.json` e `catalog.js`, criando backups automáticos `.bak`. Garante que o site funcione offline ou mesmo se o Supabase cair. |
| **Simulador de Notificações** | `python3 ferramentas/test_lead_notification.py --dry-run` | Testa e simula o disparo de alertas para novos leads formatados com cores da marca, score em estrelas e campos comerciais. |

---

## 2. Automações no Banco de Dados (Supabase)

Foram implementadas e ativadas diretamente na tabela `pedidos_orcamento` do Supabase:

1. **Trigger de `updated_at` Automático (`trg_pedidos_orcamento_touch`)**:
   - Sempre que o status de um lead é alterado no Kanban (`admin/demandes.html`) ou por webhook, o campo `updated_at` é atualizado para `now()`.
2. **Trigger de Lead Scoring Inteligente (`trg_processar_novo_lead`)**:
   - Avalia novos pedidos e atribui uma pontuação de 1 a 5 estrelas automaticamente:
     - **Setores prioritários (+1 estrela)**: Hotelaria, Resorts, Imobiliário, Companhias Aéreas, Automotivo, Luxo, Moda e Lifestyle.
     - **Múltiplos serviços (+1 estrela)**: Quando o cliente marca 2 ou mais serviços (ex: Filme de Marca + Reels contínuos).
     - **Prazo urgente (+1 estrela)**: Prazos imediatos ou de 1 mês.
     - Base de 3 estrelas, limitado entre 1 e 5.
3. **Geração Segura de Protocolo Sequencial**:
   - Se o lead for criado sem número, o banco gera automaticamente o sequencial seguro formatado em 4 dígitos (`0017`, `0018`...).
4. **Tabela de Auditoria e Webhooks (`lead_webhook_logs`)**:
   - Tabela dedicada para registrar histórico de notificações disparadas e respostas dos serviços externos.

---

## 3. Notificação Imediata de Novos Leads

Localizada em `supabase/functions/lead-notifier/index.ts`.

### O que faz:
Assim que o cliente envia o formulário no site, uma notificação rica é disparada instantaneamente:
- **Discord**: Card embed com as cores oficiais da marca (#24140E), nome, telefone com link para WhatsApp, e-mail, serviços, score calculado em estrelas e mensagem.
- **Telegram**: Notificação Markdown no celular com alerta sonoro.
- **E-mail (Resend)**: Notificação para `soft.communicationbr@gmail.com` e e-mail automático de confirmação para o prospect com o link do Cal.com para agendar a chamada.

### Como ativar:
1. No painel do Supabase: *Project Settings → Edge Functions → Secrets* (ou `.env`):
   - `DISCORD_WEBHOOK_URL`: URL do Webhook do canal do Discord.
   - `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` (opcional).
   - `RESEND_API_KEY` (opcional).
2. Em *Database → Webhooks*:
   - Crie um Database Webhook apontando para a Edge Function no evento `INSERT` da tabela `pedidos_orcamento`.

---

## 4. Integração de Agendamentos (Cal.com / Calendly)

Localizada em `supabase/functions/cal-webhook/index.ts`.

### O que faz:
Quando um prospect agenda uma reunião pelo Cal.com:
1. O webhook do Cal.com envia os dados da reunião (`BOOKING_CREATED`).
2. O sistema busca o lead pelo e-mail na tabela `pedidos_orcamento`.
3. Se o lead já existir:
   - Move o lead automaticamente para a coluna **"Appel prévu" (Reunião)** no Kanban do painel administrativo (`admin/demandes.html`).
   - Grava no campo `reuniao_info` a data, horário e link da videochamada.
4. Se o cliente agendou direto pelo link sem preencher o formulário antes:
   - Cria um novo lead automaticamente com status `'reuniao'` e score 4.

### Como conectar:
1. No painel do Cal.com: *Settings → Developer → Webhooks → New Webhook*.
2. Cole a URL da função: `https://xvabghgvrhpnyywpmodb.supabase.co/functions/v1/cal-webhook`
3. Eventos selecionados: `Booking Created`, `Booking Rescheduled`, `Booking Cancelled`.
