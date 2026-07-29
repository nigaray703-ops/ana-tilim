create table if not exists public.learning_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null,
  payload jsonb not null,
  client_updated_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.learning_backups enable row level security;
grant select, insert, update on public.learning_backups to authenticated;

drop policy if exists "read own learning backup" on public.learning_backups;
create policy "read own learning backup"
on public.learning_backups for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert own learning backup" on public.learning_backups;
create policy "insert own learning backup"
on public.learning_backups for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update own learning backup" on public.learning_backups;
create policy "update own learning backup"
on public.learning_backups for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "update own avatar" on storage.objects;
create policy "update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "delete own avatar" on storage.objects;
create policy "delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Ana Tilim dashboard setup
-- 1. Run this file in the Supabase SQL Editor.
-- 2. Enable Google under Authentication > Providers. Keep the Google Client
--    ID and Client Secret in the Supabase dashboard only.
-- 3. Add the production Vercel URL and local development URL under
--    Authentication > URL Configuration.
-- 4. Configure the email OTP template to display {{ .Token }}.
-- 5. The avatars bucket is public for profile-image viewing. Write and delete
--    access remains restricted to each authenticated user's own folder.
-- 6. Put only the Project URL and Publishable key in cloud-config.js.
