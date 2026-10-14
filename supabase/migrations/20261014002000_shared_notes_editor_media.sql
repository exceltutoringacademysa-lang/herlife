-- Applied to Supabase: secure shared note media and owner-only metadata
create policy "Invited editors can upload private note assets" on storage.objects for insert to authenticated with check (
 bucket_id='herlife-private-memories' and (storage.foldername(name))[2]='notes'
 and exists(select 1 from public.app_members where user_id=auth.uid())
 and exists(select 1 from public.note_shares s where s.note_id::text=(storage.foldername(name))[3] and s.owner_id::text=(storage.foldername(name))[1] and s.collaborator_id=auth.uid() and s.access='edit')
);
create or replace function public.save_collaborative_note(p_note uuid,p_title text,p_body text,p_details jsonb,p_expected_at timestamptz)
returns public.life_items language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();item public.life_items;
begin
 if actor is null or not exists(select 1 from public.app_members where user_id=actor) then raise exception 'Not authorised';end if;
 if length(p_title)>180 or length(p_body)>300000 or octet_length(p_details::text)>8000000 then raise exception 'Note too large';end if;
 select * into item from public.life_items where id=p_note and kind in ('note','journal') for update;
 if not found then raise exception 'Note not found';end if;
 if item.user_id<>actor and not exists(select 1 from public.note_shares s where s.note_id=item.id and s.owner_id=item.user_id and s.collaborator_id=actor and s.access='edit') then raise exception 'Not allowed to edit';end if;
 if item.updated_at is distinct from p_expected_at then raise exception 'EDIT_CONFLICT: this note changed on another device';end if;
 if item.user_id<>actor then
  p_details=(p_details-'folder'-'pinned'-'deletedAt') || jsonb_build_object('folder',item.details->'folder','pinned',item.details->'pinned','deletedAt',item.details->'deletedAt');
 end if;
 update public.life_items set title=coalesce(nullif(trim(p_title),''),'Untitled'),body=p_body,details=p_details,updated_at=clock_timestamp() where id=p_note returning * into item;
 return item;
end;$$;