create table if not exists public.calendar_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 180),
 starts_at timestamptz not null,
 reminder_minutes integer not null default 15 check(reminder_minutes in (0,5,15,30,60,1440)),
 notes text not null default '', created_at timestamptz not null default now()
);
create index if not exists herlife_events_user_start on public.calendar_events(user_id,starts_at);
alter table public.calendar_events enable row level security;
alter table public.calendar_events force row level security;
revoke all on public.calendar_events from anon;
grant select,insert,update,delete on public.calendar_events to authenticated;
create policy "Owner calendar events" on public.calendar_events for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())));
create table if not exists public.shopping_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 180), price numeric(12,2) not null check(price>=0),
 quantity integer not null default 1 check(quantity between 1 and 999),
 shop text not null default '', product_url text not null default '',
 purchased boolean not null default false, created_at timestamptz not null default now()
);
alter table public.shopping_items enable row level security;
alter table public.shopping_items force row level security;
revoke all on public.shopping_items from anon;
grant select,insert,update,delete on public.shopping_items to authenticated;
create policy "Owner shopping bag" on public.shopping_items for all to authenticated
 using(user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())));