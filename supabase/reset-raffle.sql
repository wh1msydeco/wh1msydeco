-- Ejecuta este script en Supabase -> SQL Editor para dejar el sorteo limpio.
-- Horario de Madrid: abre el 11/07/2026 a las 13:00 y cierra el 13/07/2026 a las 13:00.

begin;

truncate table public.registrations restart identity;

insert into public.raffle_settings (id, starts_at, ends_at, updated_at)
values (
  1,
  timestamptz '2026-07-11 13:00:00 Europe/Madrid',
  timestamptz '2026-07-13 13:00:00 Europe/Madrid',
  now()
)
on conflict (id) do update set
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  updated_at = now();

commit;
