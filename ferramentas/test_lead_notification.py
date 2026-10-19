#!/usr/bin/env python3
"""test_lead_notification.py · Testador e despachante local de notificações de leads.

Permite:
1. Simular o envio de um novo lead para canais de notificação (Discord / Telegram / Resend).
2. Testar o funcionamento das chaves e webhooks antes de colocar em produção.
3. Servir como worker opcional de envio direto a partir do Supabase.

Uso:
  python3 ferramentas/test_lead_notification.py --dry-run
  python3 ferramentas/test_lead_notification.py --discord "https://discord.com/api/webhooks/..."
  python3 ferramentas/test_lead_notification.py --telegram "TOKEN:CHAT_ID"
"""

import sys
import json
import urllib.request
import urllib.error

SAMPLE_LEAD = {
    "numero": "9999",
    "cliente_nome": "Hotel Bora Bora Paradise",
    "cliente_telefone": "+689 87 12 34 56",
    "cliente_email": "direcao@boraboraparadise.com",
    "empresa_setor": "Hotelaria & Resort de Luxo",
    "servicos": ["Filme de Marca", "Reels & UGC Autêntico", "Imobiliário IA"],
    "mensagem": "Gostaríamos de produzir o novo filme institucional da nossa temporada de verão e um pacote contínuo de Reels para o Instagram.",
    "score": 5,
    "idioma": "fr",
    "origem": "Formulário Oficial do Site",
    "prazo": "1 mês"
}

def send_discord(webhook_url, lead):
    print(f"📡 Enviando notificação para o Discord Webhook...")
    stars = "⭐" * int(lead.get('score', 3))
    services = ", ".join(lead.get('servicos', []))

    embed = {
        "title": f"🎯 Novo Lead Recebido · Protocolo Nº {lead.get('numero')}",
        "color": 0x24140E,
        "description": f"**Cliente:** {lead.get('cliente_nome')}\n**Score de Potencial:** {stars} ({lead.get('score')}/5)",
        "fields": [
            {"name": "📞 Contato", "value": f"{lead.get('cliente_telefone')} | {lead.get('cliente_email')}", "inline": False},
            {"name": "🏢 Setor / Marca", "value": lead.get('empresa_setor'), "inline": True},
            {"name": "⏳ Prazo", "value": lead.get('prazo'), "inline": True},
            {"name": "🎬 Serviços", "value": services, "inline": False},
            {"name": "💬 Mensagem", "value": f"_{lead.get('mensagem')}_", "inline": False},
            {"name": "🌐 Idioma & Origem", "value": f"{lead.get('idioma', 'pt').upper()} • {lead.get('origem')}", "inline": True}
        ],
        "footer": {"text": "Soft Communication · Sistema Automatizado de Leads"}
    }

    body = json.dumps({"username": "Soft Communication Leads", "embeds": [embed]}).encode('utf-8')
    req = urllib.request.Request(webhook_url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            print(f"✓ Notificação enviada ao Discord com sucesso! (HTTP {res.status})")
            return True
    except Exception as e:
        print(f"❌ Falha ao enviar para o Discord: {e}")
        return False

def send_telegram(token, chat_id, lead):
    print(f"📡 Enviando notificação para o Telegram Bot...")
    stars = "⭐" * int(lead.get('score', 3))
    services = ", ".join(lead.get('servicos', []))
    text = (
        f"🚀 *NOVO LEAD · Soft Communication*\n\n"
        f"*Protocolo:* Nº {lead.get('numero')}\n"
        f"*Nome:* {lead.get('cliente_nome')}\n"
        f"*Contato:* {lead.get('cliente_telefone')} | {lead.get('cliente_email')}\n"
        f"*Setor:* {lead.get('empresa_setor')}\n"
        f"*Score:* {stars} ({lead.get('score')}/5)\n"
        f"*Serviços:* {services}\n"
        f"*Mensagem:* {lead.get('mensagem')}\n\n"
        f"_Acesse o painel administrativo para responder._"
    )

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            print(f"✓ Notificação enviada ao Telegram com sucesso! (HTTP {res.status})")
            return True
    except Exception as e:
        print(f"❌ Falha ao enviar para o Telegram: {e}")
        return False

def dry_run(lead):
    print("=" * 64)
    print("  SIMULAÇÃO DE NOTIFICAÇÃO DE LEAD (DRY-RUN)")
    print("=" * 64)
    print(f"Protocolo : Nº {lead['numero']}")
    print(f"Cliente   : {lead['cliente_nome']}")
    print(f"Contato   : {lead['cliente_telefone']} | {lead['cliente_email']}")
    print(f"Setor     : {lead['empresa_setor']}")
    print(f"Serviços  : {', '.join(lead['servicos'])}")
    print(f"Score     : {'⭐' * lead['score']} ({lead['score']}/5)")
    print(f"Prazo     : {lead['prazo']}")
    print(f"Mensagem  : {lead['mensagem']}")
    print("=" * 64)
    print("✓ Payload pronto e validado para disparo em produção.")

def main():
    args = sys.argv[1:]
    if not args or '--dry-run' in args:
        dry_run(SAMPLE_LEAD)
        return

    for i, a in enumerate(args):
        if a == '--discord' and i + 1 < len(args):
            send_discord(args[i + 1], SAMPLE_LEAD)
        elif a == '--telegram' and i + 1 < len(args):
            parts = args[i + 1].split(':')
            if len(parts) >= 2:
                token = parts[0] + ":" + parts[1] if len(parts) > 2 else parts[0]
                chat_id = parts[-1]
                send_telegram(token, chat_id, SAMPLE_LEAD)

if __name__ == '__main__':
    main()
