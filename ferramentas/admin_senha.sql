-- ============================================================
-- Soft Communication · senha do painel conferida no SERVIDOR
-- A senha nunca fica no código do site: só o hash (bcrypt) no banco.
-- Para trocar a senha, rode no SQL Editor (troque NOVA_SENHA):
--   update public.admin_auth set password_hash = extensions.crypt('NOVA_SENHA', extensions.gen_salt('bf')) where true;
-- ============================================================
create extension if not exists pgcrypto with schema extensions;

-- Tabela da senha (cria se ainda não existir; se já existe, não mexe)
create table if not exists public.admin_auth (
  id int primary key default 1,
  password_hash text,
  last_login timestamptz
);
insert into public.admin_auth (password_hash)
  select null where not exists (select 1 from public.admin_auth);

-- Tentativas erradas (trava: 10 erros em 10 minutos bloqueiam por 10 minutos)
create table if not exists public.admin_login_tentativas (
  id bigserial primary key,
  em timestamptz not null default now()
);
alter table public.admin_login_tentativas enable row level security;

create or replace function public.admin_verificar_senha(p_senha text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare ok boolean;
begin
  if (select count(*) from public.admin_login_tentativas where em > now() - interval '10 minutes') >= 10 then
    raise exception 'Muitas tentativas. Aguarde 10 minutos.' using errcode = 'P0001';
  end if;
  select exists (select 1 from public.admin_auth a
                 where a.password_hash like '$2%' and a.password_hash = extensions.crypt(coalesce(p_senha, ''), a.password_hash))
    into ok;
  if ok then
    update public.admin_auth set last_login = now() where true;
    delete from public.admin_login_tentativas where em < now() - interval '1 day';
  else
    insert into public.admin_login_tentativas default values;
  end if;
  return ok;
end $$;
revoke all on function public.admin_verificar_senha(text) from public;
grant execute on function public.admin_verificar_senha(text) to anon, authenticated;

-- Ninguém lê nem altera a tabela de senha pela API pública
alter table public.admin_auth enable row level security;
revoke all on public.admin_auth from anon, authenticated;
