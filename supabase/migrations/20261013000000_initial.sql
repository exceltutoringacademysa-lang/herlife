-- HerLife: private user-owned records with enforced Row Level Security.
create extension if not exists pgcrypto;

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  quiet_time time not null default '06:00',
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('task','journal','habit','goal','transaction','prayer','quiet_time')),
  title text not null check (char_length(title) between 1 and 180),
  content text not null default '' check (char_length(content) <= 12000),
  value numeric(14,2) not null default 0,
  done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_kind_created_idx on public.entries (user_id, kind, created_at desc);
alter table public.entries enable row level security;
alter table public.preferences enable row level security;
alter table public.entries force row level security;
alter table public.preferences force row level security;

create policy "Own entries select" on public.entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own entries insert" on public.entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own entries update" on public.entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Own entries delete" on public.entries for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Own preferences select" on public.preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own preferences insert" on public.preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own preferences update" on public.preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.entries, public.preferences from anon;
grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, update on public.preferences to authenticated;
