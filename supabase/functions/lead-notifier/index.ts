// supabase/functions/lead-notifier/index.ts
// Automação: Notificação Imediata de Novos Leads (Discord, Telegram e E-mail Resend)
// Disparada quando um novo lead é inserido na tabela 'pedidos_orcamento'.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface LeadRecord {
  id: number;
  numero: string;
  cliente_nome: string;
  cliente_email?: string;
  cliente_telefone?: string;
  empresa_setor?: string;
  servicos?: string[];
  mensagem?: string;
  status?: string;
  score?: number;
  idioma?: string;
  origem?: string;
  prazo?: string;
  created_at?: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: LeadRecord;
  old_record?: LeadRecord;
}

const BRAND_NAME = "Soft Communication";
const BRAND_COLOR = 0x24140e; // Tom chocolate oficial da marca

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    const lead: LeadRecord = payload.record || payload;

    if (!lead || !lead.cliente_nome) {
      return new Response(JSON.stringify({ error: "Payload sem dados de lead válidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const discordWebhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const telegramChatId = Deno.env.get("TELEGRAM_CHAT_ID");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("NOTIFICATION_EMAIL") || "soft.communicationbr@gmail.com";

    const results: Record<string, string> = {};

    // 1. Notificação via Discord Webhook
    if (discordWebhookUrl) {
      const scoreStars = "⭐".repeat(Math.max(1, Math.min(5, lead.score || 3)));
      const servicosText = Array.isArray(lead.servicos) && lead.servicos.length > 0
        ? lead.servicos.join(", ")
        : "Não especificado";

      const discordBody = {
        username: "Soft Communication Leads",
        avatar_url: "https://xvabghgvrhpnyywpmodb.supabase.co/storage/v1/object/public/videos-portifolio/brand-avatar.png",
        embeds: [
          {
            title: `🎯 Novo Lead Recebido · Protocolo Nº ${lead.numero || lead.id}`,
            color: BRAND_COLOR,
            description: `**Cliente:** ${lead.cliente_nome}\n**Score de Potencial:** ${scoreStars} (${lead.score || 3}/5)`,
            fields: [
              { name: "📞 Contato", value: `${lead.cliente_telefone || "Sem telefone"} | ${lead.cliente_email || "Sem e-mail"}`, inline: false },
              { name: "🏢 Setor / Marca", value: lead.empresa_setor || "Geral / Não informado", inline: true },
              { name: "⏳ Prazo", value: lead.prazo || "A combinar", inline: true },
              { name: "🎬 Serviços Desejados", value: servicosText, inline: false },
              { name: "💬 Mensagem do Cliente", value: lead.mensagem ? `_${lead.mensagem}_` : "_Sem mensagem adicional_", inline: false },
              { name: "🌐 Idioma & Origem", value: `${(lead.idioma || "pt").toUpperCase()} • ${lead.origem || "Site"}`, inline: true },
            ],
            footer: { text: "Soft Communication · Sistema Automatizado de Leads" },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const resDiscord = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordBody),
      });
      results.discord = resDiscord.ok ? "enviado" : `erro_${resDiscord.status}`;
    }

    // 2. Notificação via Telegram Bot
    if (telegramBotToken && telegramChatId) {
      const tgText = `🚀 *NOVO LEAD · ${BRAND_NAME}*\n\n` +
        `*Protocolo:* Nº ${lead.numero || lead.id}\n` +
        `*Nome:* ${lead.cliente_nome}\n` +
        `*Telefone:* ${lead.cliente_telefone || "N/A"}\n` +
        `*E-mail:* ${lead.cliente_email || "N/A"}\n` +
        `*Setor:* ${lead.empresa_setor || "Geral"}\n` +
        `*Score:* ${"⭐".repeat(lead.score || 3)} (${lead.score || 3}/5)\n` +
        `*Serviços:* ${(lead.servicos || []).join(", ") || "Audiovisual"}\n` +
        `*Mensagem:* ${lead.mensagem || "Sem mensagem"}\n\n` +
        `_Acesse o painel para responder em até 24h._`;

      const resTg = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: tgText,
          parse_mode: "Markdown",
        }),
      });
      results.telegram = resTg.ok ? "enviado" : `erro_${resTg.status}`;
    }

    // 3. E-mail de notificação para o estúdio via Resend
    if (resendApiKey) {
      const emailHtml = `
        <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; background:#FBF9F5; border-top:4px solid #24140E;">
          <h2 style="color:#24140E; margin-top:0;">Novo Pedido de Orçamento · Nº ${lead.numero || lead.id}</h2>
          <p><strong>Cliente:</strong> ${lead.cliente_nome}</p>
          <p><strong>E-mail:</strong> ${lead.cliente_email || "Não informado"}</p>
          <p><strong>Telefone / WhatsApp:</strong> ${lead.cliente_telefone || "Não informado"}</p>
          <p><strong>Setor:</strong> ${lead.empresa_setor || "Geral"}</p>
          <p><strong>Serviços:</strong> ${(lead.servicos || []).join(", ")}</p>
          <p><strong>Score Calculado:</strong> ${"⭐".repeat(lead.score || 3)} (${lead.score || 3}/5)</p>
          <div style="background:#FFF; padding:15px; border-radius:4px; border:1px solid #E5DDD3; margin:15px 0;">
            <strong>Mensagem:</strong><br>${lead.mensagem || "Sem mensagem."}
          </div>
          <p style="color:#666; font-size:12px;">Soft Communication · Notificação Automática</p>
        </div>
      `;

      const resResend = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Soft Communication <leads@softcommunication.com>",
          to: [notifyEmail],
          subject: `🎯 Novo Lead: ${lead.cliente_nome} (Nº ${lead.numero || lead.id})`,
          html: emailHtml,
        }),
      });
      results.email = resResend.ok ? "enviado" : `erro_${resResend.status}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        protocolo: lead.numero || lead.id,
        status: results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
