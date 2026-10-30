-- Classic procedural route seeds are shareable, immutable route recipes.
-- A seed alone resolves all inputs needed to reproduce the elevation profile.
-- Only signed-in riders may register routes; anyone may look up a seed.
create table if not exists public.classic_route_seeds (
  seed bigint primary key check (seed between 1 and 1000000000),
  miles double precision not null check (miles > 0 and miles <= 1000),
  gain_target_ft double precision check (gain_target_ft is null or (gain_target_ft >= 0 and gain_target_ft <= 200000)),
  terrain text not null check (terrain in ('flat','rolling','mountain','punchy')),
  difficulty double precision not null check (difficulty in (0.55,1,1.35)),
  generator_version smallint not null default 1 check (generator_version = 1),
  created_at timestamptz not null default now()
);
alter table public.classic_route_seeds enable row level security;
revoke all on public.classic_route_seeds from anon,authenticated;
grant select on public.classic_route_seeds to anon,authenticated;
grant insert (seed,miles,gain_target_ft,terrain,difficulty,generator_version)
  on public.classic_route_seeds to authenticated;
create policy "Shared Classic routes can be read by seed"
  on public.classic_route_seeds for select to anon,authenticated using (true);
create policy "Signed in riders can register immutable Classic routes"
  on public.classic_route_seeds for insert to authenticated with check (true);
-- Fixed Quick Start seeds have canonical recipes and are reproducible immediately.
insert into public.classic_route_seeds (seed,miles,gain_target_ft,terrain,difficulty,generator_version)
values (3001,10,null,'flat',0.55,1),
       (4502,15,null,'rolling',1,1),
       (6003,18,1800,'mountain',1.35,1)
on conflict (seed) do nothing;
