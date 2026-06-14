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

-- Sin políticas públicas: solo el servidor (service role) accede a los datos.

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
