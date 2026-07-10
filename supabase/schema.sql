-- Ejecuta este script en Supabase → SQL Editor

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  toploader boolean not null default false,
  keychain boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint registrations_username_unique unique (username)
);

create index if not exists idx_registrations_toploader
  on public.registrations (username)
  where toploader = true;

create index if not exists idx_registrations_keychain
  on public.registrations (username)
  where keychain = true;

alter table public.registrations enable row level security;

revoke all on public.registrations from anon, authenticated;

create table if not exists public.raffle_settings (
  id int primary key default 1 check (id = 1),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.raffle_settings enable row level security;
revoke all on public.raffle_settings from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists registrations_set_updated_at on public.registrations;

create trigger registrations_set_updated_at
  before update on public.registrations
  for each row
  execute function public.set_updated_at();

create or replace function public.register_participant(
  p_username text,
  p_toploader boolean,
  p_keychain boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  select starts_at, ends_at
  into v_starts_at, v_ends_at
  from public.raffle_settings
  where id = 1;

  if v_starts_at is null or v_ends_at is null then
    raise exception 'raffle_not_configured';
  end if;

  if now() < v_starts_at then
    raise exception 'raffle_not_open';
  end if;

  if now() >= v_ends_at then
    raise exception 'raffle_closed';
  end if;

  v_username := lower(trim(regexp_replace(coalesce(p_username, ''), '^@+', '')));

  if v_username = '' then
    raise exception 'invalid_username';
  end if;

  if not coalesce(p_toploader, false) and not coalesce(p_keychain, false) then
    raise exception 'no_option_selected';
  end if;

  insert into public.registrations (username, toploader, keychain)
  values (v_username, coalesce(p_toploader, false), coalesce(p_keychain, false))
  on conflict (username) do update set
    toploader = excluded.toploader,
    keychain = excluded.keychain,
    updated_at = now();
end;
$$;

grant execute on function public.register_participant(text, boolean, boolean) to anon, authenticated;
