-- ============================================================
-- Soft Communication · Prospecção (LeadFinder no /admin)
-- Rode no SQL Editor do Supabase. Seguro para rodar de novo.
-- Mesmo padrão de ferramentas/supabase.sql: lista de e-mails + RLS.
-- ============================================================

-- 1) Quem pode usar a prospecção (contas do Supabase Auth, login por link mágico)
create table if not exists public.leadfinder_membros (
  email text primary key
);
-- Hoje só o dono usa. Para liberar mais alguém, acrescente uma linha aqui e em
-- portfolio_admins (ferramentas/admin_login.sql) e crie o usuário no Supabase Auth.
insert into public.leadfinder_membros (email) values ('soft.communicationbr@gmail.com') on conflict do nothing;

create or replace function public.leadfinder_eh_membro() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.leadfinder_membros m
                 where lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.leadfinder_eh_membro() from public, anon;
grant execute on function public.leadfinder_eh_membro() to authenticated;

-- 2) Carteira de leads compartilhada.
-- Termos do Google Places: guardamos só o place_id; nome, endereço e telefone
-- são buscados de novo ao abrir a página. Status, notas e análise são nossos.
create table if not exists public.leadfinder_leads (
  place_id      text primary key check (place_id ~ '^[A-Za-z0-9_-]{10,200}$'),
  categoria     text not null default 'Outras empresas' check (char_length(categoria) <= 80),
  status        text not null default 'Novo'
                check (status in ('Novo','Contato pendente','Contatado','Respondeu','Reunião marcada','Cliente','Descartado')),
  notas         text check (char_length(notas) <= 1000),
  proxima_acao  date,
  ultimo_contato date,
  ia            jsonb,
  criado_por    text not null default coalesce(auth.jwt() ->> 'email', ''),
  atualizado_por text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create or replace function public.leadfinder_touch() returns trigger
language plpgsql as $$
begin
  new.atualizado_em = now();
  new.atualizado_por = coalesce(auth.jwt() ->> 'email', new.atualizado_por);
  return new;
end $$;
drop trigger if exists leadfinder_leads_touch on public.leadfinder_leads;
create trigger leadfinder_leads_touch before insert or update on public.leadfinder_leads
  for each row execute function public.leadfinder_touch();

-- 3) Contador de custo persistente (o servidor reserva antes de chamar Google/Claude)
create table if not exists public.leadfinder_uso (
  dia      date not null,
  tipo     text not null check (tipo in ('google','ia','geo')),
  chamadas integer not null default 0,
  primary key (dia, tipo)
);

create or replace function public.leadfinder_reservar(p_tipo text, p_n integer, p_cap integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare atual integer;
begin
  if p_n < 1 or p_cap < 0 then return false; end if;
  insert into public.leadfinder_uso (dia, tipo, chamadas) values (current_date, p_tipo, 0)
    on conflict (dia, tipo) do nothing;
  update public.leadfinder_uso set chamadas = chamadas + p_n
    where dia = current_date and tipo = p_tipo and chamadas + p_n <= p_cap
    returning chamadas into atual;
  return atual is not null;
end $$;
-- Só o servidor (service_role) reserva: ninguém chama pela API pública.
revoke all on function public.leadfinder_reservar(text, integer, integer) from public, anon, authenticated;

-- 4) Registro de quem fez o quê (ajuda na LGPD/RGPD e no controle de custo)
create table if not exists public.leadfinder_log (
  id     bigserial primary key,
  em     timestamptz not null default now(),
  email  text not null,
  acao   text not null,
  detalhe jsonb
);

-- 5) Permissões (RLS)
alter table public.leadfinder_membros enable row level security;
alter table public.leadfinder_leads   enable row level security;
alter table public.leadfinder_uso     enable row level security;
alter table public.leadfinder_log     enable row level security;

drop policy if exists "membros leem leads" on public.leadfinder_leads;
create policy "membros leem leads" on public.leadfinder_leads
  for select to authenticated using (public.leadfinder_eh_membro());
drop policy if exists "membros criam leads" on public.leadfinder_leads;
create policy "membros criam leads" on public.leadfinder_leads
  for insert to authenticated with check (public.leadfinder_eh_membro());
drop policy if exists "membros atualizam leads" on public.leadfinder_leads;
create policy "membros atualizam leads" on public.leadfinder_leads
  for update to authenticated using (public.leadfinder_eh_membro()) with check (public.leadfinder_eh_membro());
drop policy if exists "membros removem leads" on public.leadfinder_leads;
create policy "membros removem leads" on public.leadfinder_leads
  for delete to authenticated using (public.leadfinder_eh_membro());

drop policy if exists "membros leem uso" on public.leadfinder_uso;
create policy "membros leem uso" on public.leadfinder_uso
  for select to authenticated using (public.leadfinder_eh_membro());
drop policy if exists "membros leem log" on public.leadfinder_log;
create policy "membros leem log" on public.leadfinder_log
  for select to authenticated using (public.leadfinder_eh_membro());
-- leadfinder_membros, escrita em uso e log: sem política = só o servidor (service_role).
-- anon não tem nenhuma política aqui: o site público não enxerga nada disso.

-- 6) Histórico da equipe: evita repetir lead, área pesquisada, abordagem e ideia.
-- Só guarda o place_id (termos do Google); nome da empresa nunca vai para cá.
create table if not exists public.leadfinder_historico (
  id        bigserial primary key,
  em        timestamptz not null default now(),
  email     text not null default coalesce(auth.jwt() ->> 'email', ''),
  tipo      text not null check (tipo in ('status','contato','ideia','busca','proposta','raiox')),
  place_id  text check (place_id is null or place_id ~ '^[A-Za-z0-9_-]{10,200}$'),
  categoria text check (char_length(categoria) <= 80),
  de        text check (char_length(de) <= 60),
  para      text check (char_length(para) <= 60),
  texto     text check (char_length(texto) <= 1000)
);
create index if not exists leadfinder_historico_em on public.leadfinder_historico (em desc);
create index if not exists leadfinder_historico_place on public.leadfinder_historico (place_id);

-- Mudança de status e data de contato entram sozinhas no histórico.
create or replace function public.leadfinder_registra() returns trigger
language plpgsql security definer set search_path = public as $$
declare quem text := coalesce(auth.jwt() ->> 'email', '');
begin
  if tg_op = 'INSERT' then
    insert into public.leadfinder_historico (email, tipo, place_id, categoria, de, para)
      values (quem, 'status', new.place_id, new.categoria, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.leadfinder_historico (email, tipo, place_id, categoria, de, para)
      values (quem, 'status', new.place_id, new.categoria, old.status, new.status);
  end if;
  return new;
end $$;
revoke all on function public.leadfinder_registra() from public, anon, authenticated;
drop trigger if exists leadfinder_leads_historico on public.leadfinder_leads;
create trigger leadfinder_leads_historico after insert or update on public.leadfinder_leads
  for each row execute function public.leadfinder_registra();

alter table public.leadfinder_historico enable row level security;
drop policy if exists "membros leem historico" on public.leadfinder_historico;
create policy "membros leem historico" on public.leadfinder_historico
  for select to authenticated using (public.leadfinder_eh_membro());
-- O app registra contato, ideia, busca, proposta e raio-X, sempre no nome de quem está logado.
drop policy if exists "membros registram" on public.leadfinder_historico;
create policy "membros registram" on public.leadfinder_historico
  for insert to authenticated with check (
    public.leadfinder_eh_membro()
    and tipo in ('contato','ideia','busca','proposta','raiox')
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
-- Ninguém edita o histórico; cada um só apaga as próprias ideias.
drop policy if exists "apaga a propria ideia" on public.leadfinder_historico;
create policy "apaga a propria ideia" on public.leadfinder_historico
  for delete to authenticated using (
    public.leadfinder_eh_membro() and tipo = 'ideia'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- 7) Vender mais: raio-X do lead e sequência de abordagem (1º contato, vídeo-exemplo, último toque).
-- raiox guarda só códigos (lacunas e serviços indicados) e a data; nada vindo do Google.
alter table public.leadfinder_leads add column if not exists raiox jsonb;
alter table public.leadfinder_leads add column if not exists sequencia smallint not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'leadfinder_leads_sequencia_check') then
    alter table public.leadfinder_leads add constraint leadfinder_leads_sequencia_check check (sequencia between 0 and 3);
  end if;
end $$;
-- Quem rodou a versão anterior: amplia os tipos aceitos no histórico.
alter table public.leadfinder_historico drop constraint if exists leadfinder_historico_tipo_check;
alter table public.leadfinder_historico add constraint leadfinder_historico_tipo_check
  check (tipo in ('status','contato','ideia','busca','proposta','raiox'));
