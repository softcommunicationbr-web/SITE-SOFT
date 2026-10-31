-- ============================================================
-- Soft Communication · login do painel (/admin)
-- Login real do Supabase Auth: e-mail + senha ou Google.
-- Só entra quem está em public.portfolio_admins (conferido no servidor).
-- Rode no SQL Editor. Seguro para rodar de novo.
-- ============================================================

-- 1) Lista de quem pode entrar no painel (a mesma que libera editar o catálogo)
create table if not exists public.portfolio_admins (
  email text primary key
);
alter table public.portfolio_admins enable row level security;
insert into public.portfolio_admins (email) values ('soft.communicationbr@gmail.com') on conflict do nothing;

-- 2) A tela de login pergunta ao servidor: "este usuário pode entrar?"
create or replace function public.admin_eh_permitido() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.portfolio_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.admin_eh_permitido() from public, anon;
grant execute on function public.admin_eh_permitido() to authenticated;

-- 3) A prospecção usa a mesma lista: quem é admin do painel também é membro
insert into public.leadfinder_membros (email) values ('soft.communicationbr@gmail.com') on conflict do nothing;

-- 4) Aposenta a senha antiga do painel (conferência por senha única)
drop function if exists public.admin_verificar_senha(text);
drop table if exists public.admin_login_tentativas;
do $$ begin
  if to_regclass('public.admin_auth') is not null then
    execute 'alter table public.admin_auth enable row level security';
    execute 'revoke all on public.admin_auth from anon, authenticated';
  end if;
end $$;
