// supabase/functions/cal-webhook/index.ts
// Automação: Integração de Agendamentos do Cal.com com o Kanban Administrativo
// Eventos: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase não configuradas no ambiente.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    const triggerEvent = body.triggerEvent || body.event || "BOOKING_CREATED";
    const payload = body.payload || body;

    const attendees = payload.attendees || [];
    const mainAttendee = attendees[0] || {};
    const clientEmail = (mainAttendee.email || payload.email || "").trim().toLowerCase();
    const clientName = mainAttendee.name || payload.name || "Cliente Agendado";
    const startTime = payload.startTime ? new Date(payload.startTime).toLocaleString("pt-BR") : "Horário a confirmar";
    const meetingUrl = payload.metadata?.videoCallUrl || payload.meetingUrl || payload.location || "Link no e-mail";

    const infoReuniao = `Reunião agendada (${startTime}) | Link: ${meetingUrl}`;

    if (!clientEmail) {
      return new Response(JSON.stringify({ error: "E-mail do participante não identificado" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Procura se já existe lead cadastrado com este e-mail
    const { data: existingLeads, error: searchErr } = await supabase
      .from("pedidos_orcamento")
      .select("id, numero, cliente_nome, status")
      .ilike("cliente_email", clientEmail)
      .order("id", { ascending: false })
      .limit(1);

    if (searchErr) {
      console.error("Erro na busca de lead:", searchErr);
    }

    if (existingLeads && existingLeads.length > 0) {
      const lead = existingLeads[0];

      if (triggerEvent === "BOOKING_CANCELLED") {
        await supabase
          .from("pedidos_orcamento")
          .update({
            observacoes: `[Reunião Cancelada pelo Cliente em ${new Date().toLocaleDateString("pt-BR")}]`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        return new Response(JSON.stringify({ message: "Lead atualizado: Reunião cancelada", id: lead.id }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Atualiza para status 'reuniao' (coluna "Appel prévu" / Reunião no painel)
      const { error: updateErr } = await supabase
        .from("pedidos_orcamento")
        .update({
          status: "reuniao",
          reuniao_info: infoReuniao,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({
          message: "Lead atualizado com sucesso para 'reuniao'",
          lead_id: lead.id,
          protocolo: lead.numero,
          cliente: lead.cliente_nome,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // 2. Cliente agendou diretamente sem preencher o formulário prévio do site
      const { data: newLead, error: insertErr } = await supabase
        .from("pedidos_orcamento")
        .insert({
          cliente_nome: clientName,
          cliente_email: clientEmail,
          cliente_telefone: mainAttendee.phoneNumber || "Informado no Cal.com",
          empresa_setor: "A definir na chamada",
          servicos: ["Diagnóstico e Proposta Audiovisual"],
          mensagem: `Agendamento direto realizado via Cal.com (${startTime}).`,
          status: "reuniao",
          score: 4, // Alta intenção por já ter reservado vaga na agenda
          idioma: "fr", // Ancoragem Polinésia Francesa padrão
          origem: "Cal.com (Agendamento Direto)",
          prazo: "Imediato",
          reuniao_info: infoReuniao,
          observacoes: "Lead criado automaticamente a partir de agendamento na agenda.",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      return new Response(
        JSON.stringify({
          message: "Novo lead criado automaticamente a partir de agendamento no Cal.com",
          lead_id: newLead.id,
          protocolo: newLead.numero,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("Erro no cal-webhook:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
