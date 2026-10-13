-- Track habit completions by local calendar day. Private user ownership is enforced by RLS.
create table if not exists public.habit_checkins (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.entries(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, habit_id, completed_on)
);

create index if not exists habit_checkins_user_day_idx on public.habit_checkins (user_id, completed_on desc);

alter table public.habit_checkins enable row level security;
alter table public.habit_checkins force row level security;

create policy "Own habit checkins select" on public.habit_checkins
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Own habit checkins insert" on public.habit_checkins
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.entries e
      where e.id = habit_id and e.user_id = (select auth.uid()) and e.kind = 'habit'
    )
  );

create policy "Own habit checkins delete" on public.habit_checkins
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.habit_checkins from anon;
grant select, insert, delete on public.habit_checkins to authenticated;
