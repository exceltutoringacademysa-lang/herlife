-- HerLife private access gate.
-- A signed-in account must be explicitly approved by the project administrator.
-- Authentication alone never grants access to private app records.
create table if not exists public.app_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now()
);

alter table public.app_members enable row level security;
alter table public.app_members force row level security;

create policy "Members see own approval" on public.app_members
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.app_members from anon;
revoke all on public.app_members from authenticated;
grant select on public.app_members to authenticated;

-- Recreate the existing RLS policies to require administrator approval as well
-- as authenticated ownership. Unapproved accounts can never access records.
drop policy if exists "Own entries select" on public.entries;
drop policy if exists "Own entries insert" on public.entries;
drop policy if exists "Own entries update" on public.entries;
drop policy if exists "Own entries delete" on public.entries;

create policy "Own entries select" on public.entries
  for select to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Own entries insert" on public.entries
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Own entries update" on public.entries
  for update to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  ) with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Own entries delete" on public.entries
  for delete to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );

drop policy if exists "Own preferences select" on public.preferences;
drop policy if exists "Own preferences insert" on public.preferences;
drop policy if exists "Own preferences update" on public.preferences;
create policy "Own preferences select" on public.preferences
  for select to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Own preferences insert" on public.preferences
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Own preferences update" on public.preferences
  for update to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  ) with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );

drop policy if exists "Own habit checkins select" on public.habit_checkins;
drop policy if exists "Own habit checkins insert" on public.habit_checkins;
drop policy if exists "Own habit checkins delete" on public.habit_checkins;
create policy "Own habit checkins select" on public.habit_checkins
  for select to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );
create policy "Own habit checkins insert" on public.habit_checkins
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
    and exists (select 1 from public.entries e
      where e.id = habit_id and e.user_id = (select auth.uid()) and e.kind = 'habit')
  );
create policy "Own habit checkins delete" on public.habit_checkins
  for delete to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.app_members m where m.user_id = (select auth.uid()))
  );

-- ADMIN ONLY: Approve the intended account using the Supabase SQL editor
-- after that account has confirmed its email address:
--
-- insert into public.app_members (user_id)
-- select id from auth.users where email = '<recipient account email>'
-- on conflict (user_id) do nothing;
--
-- Never embed the recipient email in committed SQL.
