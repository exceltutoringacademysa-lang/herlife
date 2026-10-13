alter table public.entries add column if not exists category text not null default 'Other';
create table if not exists public.finance_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 monthly_budget numeric(14,2) not null default 0 check(monthly_budget>=0),
 updated_at timestamptz not null default now()
);
alter table public.finance_preferences enable row level security;
alter table public.finance_preferences force row level security;
revoke all on public.finance_preferences from anon;
grant select,insert,update,delete on public.finance_preferences to authenticated;
create policy "Linked user finance preferences" on public.finance_preferences for all to authenticated
using(user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())))
with check(user_id=(select auth.uid()) and exists(select 1 from public.app_members where user_id=(select auth.uid())));
