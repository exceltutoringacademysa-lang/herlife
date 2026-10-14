-- Applied to Supabase project mgmhsezfrbfnvuqkosyz.
-- Sharing is explicitly granted to approved HerLife accounts, never anonymous links.
create table if not exists public.note_shares (
 note_id uuid not null references public.life_items(id) on delete cascade,
 owner_id uuid not null references auth.users(id),
 collaborator_id uuid not null references auth.users(id),
 access text not null default 'edit' check(access in ('view','edit')),
 created_at timestamptz not null default now(),
 primary key(note_id,collaborator_id),
 constraint note_shares_distinct_members check(owner_id<>collaborator_id)
);
create index if not exists note_shares_collaborator_idx on public.note_shares(collaborator_id);
alter table public.note_shares enable row level security;
alter table public.note_shares force row level security;
create policy "Only participants can see invitations" on public.note_shares for select to authenticated
 using((owner_id=auth.uid() or collaborator_id=auth.uid()) and exists(select 1 from public.app_members where user_id=auth.uid()));
create policy "Owner revokes or participant leaves" on public.note_shares for delete to authenticated
 using((owner_id=auth.uid() or collaborator_id=auth.uid()) and exists(select 1 from public.app_members where user_id=auth.uid()));
grant select,delete on public.note_shares to authenticated;
create policy "Invited members can read only shared notes" on public.life_items for select to authenticated
 using(kind in ('note','journal') and exists(select 1 from public.app_members where user_id=auth.uid()) and exists(select 1 from public.note_shares s where s.note_id=id and s.owner_id=user_id and s.collaborator_id=auth.uid()));
create or replace function public.invite_note_member(p_note uuid,p_email text,p_access text default 'edit')
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare owner uuid:=auth.uid();target uuid;
begin
 if owner is null or not exists(select 1 from public.app_members where user_id=owner) then raise exception 'Not authorised';end if;
 if p_access not in ('view','edit') then raise exception 'Invalid permission';end if;
 if not exists(select 1 from public.life_items where id=p_note and user_id=owner and kind in ('note','journal')) then raise exception 'Note not found or not owned';end if;
 select u.id into target from auth.users u where lower(u.email)=lower(trim(p_email)) and u.id<>owner and exists(select 1 from public.app_members m where m.user_id=u.id) limit 1;
 if target is null then return false;end if;
 insert into public.note_shares(note_id,owner_id,collaborator_id,access) values(p_note,owner,target,p_access)
 on conflict(note_id,collaborator_id) do update set access=excluded.access;
 return true;
end;$$;
revoke all on function public.invite_note_member(uuid,text,text) from public;
grant execute on function public.invite_note_member(uuid,text,text) to authenticated;
create or replace function public.save_collaborative_note(p_note uuid,p_title text,p_body text,p_details jsonb,p_expected_at timestamptz)
returns public.life_items language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();item public.life_items;
begin
 if actor is null or not exists(select 1 from public.app_members where user_id=actor) then raise exception 'Not authorised';end if;
 if length(p_title)>180 or length(p_body)>300000 or octet_length(p_details::text)>1000000 then raise exception 'Note too large';end if;
 select * into item from public.life_items where id=p_note and kind in ('note','journal') for update;
 if not found then raise exception 'Note not found';end if;
 if item.user_id<>actor and not exists(select 1 from public.note_shares s where s.note_id=item.id and s.owner_id=item.user_id and s.collaborator_id=actor and s.access='edit') then raise exception 'Not allowed to edit';end if;
 if item.updated_at is distinct from p_expected_at then raise exception 'EDIT_CONFLICT: this note changed on another device';end if;
 update public.life_items set title=coalesce(nullif(trim(p_title),''),'Untitled'),body=p_body,details=p_details,updated_at=clock_timestamp() where id=p_note returning * into item;
 return item;
end;$$;
revoke all on function public.save_collaborative_note(uuid,text,text,jsonb,timestamptz) from public;
grant execute on function public.save_collaborative_note(uuid,text,text,jsonb,timestamptz) to authenticated;
update storage.buckets set allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm','application/pdf'] where id='herlife-private-memories';
create policy "Invited note participants can read note media" on storage.objects for select to authenticated using(
 bucket_id='herlife-private-memories' and (storage.foldername(name))[2]='notes' and
 exists(select 1 from public.app_members where user_id=auth.uid()) and
 exists(select 1 from public.note_shares s where s.note_id::text=(storage.foldername(name))[3] and s.owner_id::text=(storage.foldername(name))[1] and s.collaborator_id=auth.uid())
);
do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='life_items') then
 alter publication supabase_realtime add table public.life_items;
 end if;
end $$;
