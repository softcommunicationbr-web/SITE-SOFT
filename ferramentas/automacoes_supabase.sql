-- ============================================================
-- Soft Communication · Automações no Banco de Dados (Supabase)
-- 
-- 1. Trigger de updated_at automático em pedidos_orcamento
-- 2. Trigger de cálculo automático de Lead Scoring (1 a 5)
-- 3. Trigger de numeração de protocolo sequencial segura (0001, 0002...)
-- 4. Tabela e logs de Webhooks / Notificações
-- ============================================================

-- 1) Função e Trigger para atualizar updated_at automaticamente
create or replace function public.fn_pedidos_orcamento_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_pedidos_orcamento_touch on public.pedidos_orcamento;
create trigger trg_pedidos_orcamento_touch
  before update on public.pedidos_orcamento
  for each row execute function public.fn_pedidos_orcamento_touch();

-- 2) Função e Trigger para cálculo automático do Lead Scoring e geração de protocolo
create or replace function public.fn_processar_novo_lead()
returns trigger
language plpgsql
as $$
declare
  calc_score integer := 3;
  setor_txt text := lower(coalesce(new.empresa_setor, '') || ' ' || coalesce(new.mensagem, ''));
  prazo_txt text := lower(coalesce(new.prazo, ''));
  max_num integer;
begin
  -- A) Geração automática do protocolo oficial sequencial se não informado
  if new.numero is null or btrim(new.numero) = '' then
    select coalesce(max(case when numero ~ '^\d+$' then numero::integer else 0 end), 0) + 1
      into max_num
      from public.pedidos_orcamento;
    new.numero := lpad(max_num::text, 4, '0');
  end if;

  -- B) Cálculo do Score (se não foi fixado manualmente pelo admin com score >= 1)
  if new.score is null or new.score <= 0 then
    -- Setores prioritários da marca Soft (+1 ponto)
    if setor_txt ~* '(hotel|hôtellerie|resort|hospitality|imobil|immob|real estate|aérien|aviat|auto|luxe|luxo|beauté|beleza|lifestyle)' then
      calc_score := calc_score + 1;
    end if;

    -- Múltiplos serviços solicitados (+1 ponto)
    if new.servicos is not null and array_length(new.servicos, 1) >= 2 then
      calc_score := calc_score + 1;
    end if;

    -- Prazo urgente ou prioritário (+1 ponto)
    if prazo_txt ~* '(urgente|urgent|1 mês|1 mois|imediato|court|breve)' then
      calc_score := calc_score + 1;
    end if;

    -- Limita pontuação entre 1 e 5 estrelas
    if calc_score > 5 then
      calc_score := 5;
    elsif calc_score < 1 then
      calc_score := 1;
    end if;

    new.score := calc_score;
  end if;

  -- C) Garante status padrão
  if new.status is null or btrim(new.status) = '' then
    new.status := 'novo';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_processar_novo_lead on public.pedidos_orcamento;
create trigger trg_processar_novo_lead
  before insert on public.pedidos_orcamento
  for each row execute function public.fn_processar_novo_lead();

-- 3) Tabela de Fila e Histórico de Notificações de Leads (Webhooks)
create table if not exists public.lead_webhook_logs (
  id          bigserial primary key,
  lead_id     bigint references public.pedidos_orcamento(id) on delete cascade,
  evento      text not null, -- 'novo_lead', 'reuniao_agendada', 'lembrete_24h'
  canal       text not null, -- 'discord', 'telegram', 'resend', 'cal.com'
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pendente', -- 'pendente', 'sucesso', 'falha'
  resposta    text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_lead_webhook_lead on public.lead_webhook_logs(lead_id);
create index if not exists idx_lead_webhook_status on public.lead_webhook_logs(status);

-- ============================================================
-- 4) Kanban Operacional Exclusivo · Pedro & Calebe
--    Totalmente editável (colunas + cartões + checklists)
-- ============================================================
create table if not exists public.soft_kanban_columns (
  id          text primary key,
  title       text not null,
  subtitle    text not null default '',
  position    integer not null default 0,
  color_tag   text not null default 'areia',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.soft_kanban_cards (
  id              bigserial primary key,
  column_id       text not null references public.soft_kanban_columns(id) on delete cascade,
  title           text not null,
  description     text not null default '',
  assignee        text not null default 'ambos' check (assignee in ('pedro', 'calebe', 'ambos')),
  priority        text not null default 'normal' check (priority in ('urgente', 'alta', 'normal', 'baixa')),
  category        text not null default 'Geral',
  client_project  text not null default '',
  due_date        text not null default '',
  checklist       jsonb not null default '[]'::jsonb,
  links           text not null default '',
  position        integer not null default 0,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_soft_kanban_cols_pos on public.soft_kanban_columns(position);
create index if not exists idx_soft_kanban_cards_col_pos on public.soft_kanban_cards(column_id, position);
create index if not exists idx_soft_kanban_cards_assignee on public.soft_kanban_cards(assignee);

