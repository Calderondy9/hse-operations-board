create table if not exists public.hse_app_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.hse_app_state enable row level security;

drop policy if exists "Allow shared HSE state read" on public.hse_app_state;
create policy "Allow shared HSE state read"
on public.hse_app_state
for select
to anon
using (true);

drop policy if exists "Allow shared HSE state insert" on public.hse_app_state;
create policy "Allow shared HSE state insert"
on public.hse_app_state
for insert
to anon
with check (
  id <> 'production'
  or coalesce(state->>'appBuildVersion', '') >= '2026-06-26-operational-july-start'
);

drop policy if exists "Allow shared HSE state update" on public.hse_app_state;
create policy "Allow shared HSE state update"
on public.hse_app_state
for update
to anon
using (true)
with check (
  id <> 'production'
  or coalesce(state->>'appBuildVersion', '') >= '2026-06-26-operational-july-start'
);
