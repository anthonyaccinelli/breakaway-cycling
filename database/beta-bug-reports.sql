-- Private report inbox. Public clients may submit bounded reports only.
create table public.beta_bug_reports (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 trainer text not null check (char_length(btrim(trainer)) between 1 and 120),
 browser text not null check (char_length(btrim(browser)) between 1 and 200),
 mode text not null check (mode in ('Classic','Survival','Cycle Quest')),
 description text not null check (char_length(btrim(description)) between 1 and 5000),
 build text not null check (char_length(build) between 1 and 100)
);
alter table public.beta_bug_reports enable row level security;
revoke all on public.beta_bug_reports from public, anon, authenticated;
grant insert (trainer,browser,mode,description,build) on public.beta_bug_reports to anon, authenticated;
grant all on public.beta_bug_reports to service_role;
create policy "Visitors may submit bounded beta reports" on public.beta_bug_reports
 for insert to anon, authenticated
 with check (
 char_length(btrim(trainer)) between 1 and 120 and
 char_length(btrim(browser)) between 1 and 200 and
 mode in ('Classic','Survival','Cycle Quest') and
 char_length(btrim(description)) between 1 and 5000 and
 char_length(build) between 1 and 100
 );
create index beta_bug_reports_created_at_idx on public.beta_bug_reports (created_at desc);
