-- HerLife: private, owner-scoped memory film. No public media URLs.
-- Only signed-in, internally linked accounts may see objects in their OWN user-ID folder.
-- Upload the film via the Supabase Dashboard (admin), not in this public repository.
begin;
alter table public.preferences add column if not exists welcome_film_seen_at timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('herlife-memories','herlife-memories',false,52428800,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','audio/mpeg','audio/mp4'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Objects must live under <auth user UUID>/ as their first path segment.
drop policy if exists "HerLife owner view memories" on storage.objects;
create policy "HerLife owner view memories" on storage.objects
for select to authenticated using (
  bucket_id = 'herlife-memories'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.app_members where user_id = (select auth.uid()))
);
-- No storage INSERT, UPDATE or DELETE policy for ordinary authenticated users:
-- owner photos/videos and soundtrack must be provisioned by an admin in Dashboard.
commit;
