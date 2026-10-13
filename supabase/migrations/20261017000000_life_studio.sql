create table if not exists public.life_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('note','wardrobe','goal')),
  title text not null default '',
  body text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists life_items_user_kind_index on public.life_items(user_id,kind,updated_at desc);
alter table public.life_items enable row level security;
alter table public.life_items force row level security;
revoke all on public.life_items from anon;
grant select,insert,update,delete on public.life_items to authenticated;
create policy "Private linked account life items" on public.life_items for all to authenticated
using (user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())))
with check (user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())));
