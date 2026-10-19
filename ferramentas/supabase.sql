-- ============================================================
-- Soft Communication · catálogo de vídeos no Supabase
-- Rode no SQL Editor do projeto, na ordem. Seguro para rodar de novo.
-- ============================================================

-- 1) Quem pode editar o catálogo (e-mails das contas de login)
create table if not exists public.portfolio_admins (
  email text primary key
);
-- TROQUE pelo e-mail real do dono e rode (uma vez por pessoa):
-- insert into public.portfolio_admins (email) values ('dono@exemplo.com') on conflict do nothing;

-- 2) Tabela do catálogo
create table if not exists public.portfolio_videos (
  id          text primary key,
  filename    text not null,
  url         text,
  aspect      text,
  w           integer,
  h           integer,
  duration    numeric,
  size        bigint,
  placement   text not null default 'library'
              check (placement in ('grid-1','grid-2','grid-3','grid-4','band-1','band-2','band-3','library')),
  position    integer not null default 0,
  title       text not null,
  label       text,
  tags        text,
  alt         text,
  active      boolean not null default true,
  hero        boolean not null default false,
  rights      text not null default 'a-confirmar'
              check (rights in ('a-confirmar','confirmado','proprio','terceiros')),
  note        text,
  poster      text,
  service     text,
  sector      text,
  meta        text,
  ai          boolean not null default false,
  i18n        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists portfolio_videos_ordem on public.portfolio_videos (placement, position);

create or replace function public.portfolio_touch() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists portfolio_videos_touch on public.portfolio_videos;
create trigger portfolio_videos_touch before update on public.portfolio_videos
  for each row execute function public.portfolio_touch();

-- 3) Permissões (RLS): o público só LÊ vídeos ativos; só admins escrevem
alter table public.portfolio_videos enable row level security;
alter table public.portfolio_admins enable row level security;

drop policy if exists "publico le videos ativos" on public.portfolio_videos;
create policy "publico le videos ativos" on public.portfolio_videos
  for select to anon using (active = true);

drop policy if exists "admins leem tudo" on public.portfolio_videos;
create policy "admins leem tudo" on public.portfolio_videos
  for select to authenticated
  using (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "admins inserem" on public.portfolio_videos;
create policy "admins inserem" on public.portfolio_videos
  for insert to authenticated
  with check (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "admins atualizam" on public.portfolio_videos;
create policy "admins atualizam" on public.portfolio_videos
  for update to authenticated
  using (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')))
  with check (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "admins removem" on public.portfolio_videos;
create policy "admins removem" on public.portfolio_videos
  for delete to authenticated
  using (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

-- (portfolio_admins não tem política: ninguém lê pela API; as políticas acima consultam a tabela por dentro.)

-- 4) Armazenamento: o bucket "videos-portifolio" já é público para leitura.
--    Envio, troca e remoção só para admins logados.
drop policy if exists "admins enviam arquivos" on storage.objects;
create policy "admins enviam arquivos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'videos-portifolio'
              and exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "admins trocam arquivos" on storage.objects;
create policy "admins trocam arquivos" on storage.objects
  for update to authenticated
  using (bucket_id = 'videos-portifolio'
         and exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

drop policy if exists "admins removem arquivos" on storage.objects;
create policy "admins removem arquivos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'videos-portifolio'
         and exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));

-- ============================================================
-- 5) RECOMENDADO · pedidos de orçamento (dados de clientes)
--    Hoje a chave pública consegue LER a tabela pedidos_orcamento.
--    Faça isto SÓ DEPOIS de configurar o login (SETUP_SUPABASE.md, passos 1 a 4),
--    porque a tela de Pedidos passa a exigir login.
--
--    a) Veja as regras atuais:
--       select policyname, cmd, roles from pg_policies where tablename = 'pedidos_orcamento';
--    b) Remova as regras abertas ao público (troque o nome):
--       drop policy "NOME_DA_REGRA" on public.pedidos_orcamento;
--    c) Crie as regras corretas:
--       alter table public.pedidos_orcamento enable row level security;
--       create policy "admins leem pedidos" on public.pedidos_orcamento for select to authenticated
--         using (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));
--       create policy "admins atualizam pedidos" on public.pedidos_orcamento for update to authenticated
--         using (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));
--       create policy "admins criam pedidos" on public.pedidos_orcamento for insert to authenticated
--         with check (exists (select 1 from public.portfolio_admins a where a.email = (auth.jwt() ->> 'email')));
--       -- se um formulário público passar a gravar pedidos, permita só INSERT ao público:
--       -- create policy "site registra pedido" on public.pedidos_orcamento for insert to anon with check (true);
-- ============================================================
