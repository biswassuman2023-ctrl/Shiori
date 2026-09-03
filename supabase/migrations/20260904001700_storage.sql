-- ============================================================================
-- Supabase Storage buckets.
--
-- Two classes of object with different rules:
--   content media (audio, stroke-order graphics) -- world-readable, written
--     only by ingestion scripts using the service-role key;
--   avatars -- readable by anyone, writable only by the owning learner, whose
--     id is the first path segment.
--
-- Bucket rows are inserted idempotently so `supabase db reset` and a hosted
-- `db push` behave the same way.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'content-audio',
    'content-audio',
    true,
    52428800, -- 50 MB
    array['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm']
  ),
  (
    'content-graphics',
    'content-graphics',
    true,
    10485760, -- 10 MB
    array['image/svg+xml', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Content buckets: read-only to learners.
--
-- No insert/update/delete policy is defined, so those commands are denied for
-- every role that does not bypass RLS.
-- ---------------------------------------------------------------------------
create policy "content media is readable by everyone"
  on storage.objects for select
  using (bucket_id in ('content-audio', 'content-graphics'));

-- ---------------------------------------------------------------------------
-- Avatars: path convention is `<user_id>/<filename>`, which is what makes
-- ownership checkable without a database lookup.
-- ---------------------------------------------------------------------------
create policy "avatars are readable by everyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "learners can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "learners can replace their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "learners can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
