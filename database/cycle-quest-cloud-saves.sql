-- Cycle Quest cloud saves. Run once in the Supabase SQL editor.
-- Rows are keyed by a SHA-256 hash of the rider's private save code; the code is never stored.
-- Row level security is on with no policies, so only the server's service role key can
-- read or write (api/_quest-cloud.js). Browsers never talk to this table directly.
create table if not exists public.cycle_quest_saves (
  code_hash text primary key,
  save text not null,
  history text,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.cycle_quest_saves enable row level security;
