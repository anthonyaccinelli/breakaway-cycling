-- Run in the Supabase SQL editor. Enable email authentication in Supabase Auth settings.
create table if not exists public.rides (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 filename text not null,
 tcx text not null,
 started_at timestamptz,
 ended_at timestamptz,
 distance_m double precision not null default 0,
 calories_kcal integer not null default 0,
 created_at timestamptz not null default now(),
 unique(user_id,filename)
);
alter table public.rides enable row level security;
create policy "Users can view own rides" on public.rides for select to authenticated using ((select auth.uid())=user_id);
create policy "Users can insert own rides" on public.rides for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users can update own rides" on public.rides for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users can delete own rides" on public.rides for delete to authenticated using ((select auth.uid())=user_id);
