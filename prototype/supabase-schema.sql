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

create table if not exists public.feedback_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.feedback_admins enable row level security;
revoke all on public.feedback_admins from anon, authenticated;

create or replace function public.is_feedback_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.feedback_admins
    where feedback_admins.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_feedback_admin() from public, anon;
grant execute on function public.is_feedback_admin() to authenticated;

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('content', 'audio', 'display', 'account', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  contact text not null default '' check (char_length(contact) <= 120),
  edition text not null check (edition in ('cn', 'global')),
  app_version text not null check (char_length(app_version) between 1 and 80),
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_feedback enable row level security;
revoke all on public.user_feedback from anon, authenticated;
grant insert (category, message, contact, edition, app_version) on public.user_feedback to anon, authenticated;
grant select on public.user_feedback to authenticated;
grant update (status) on public.user_feedback to authenticated;

drop policy if exists "anonymous feedback insert" on public.user_feedback;
create policy "anonymous feedback insert"
on public.user_feedback for insert
to anon, authenticated
with check (status = 'new');

drop policy if exists "admin feedback select" on public.user_feedback;
create policy "admin feedback select"
on public.user_feedback for select
to authenticated
using ((select public.is_feedback_admin()));

drop policy if exists "admin feedback update" on public.user_feedback;
create policy "admin feedback update"
on public.user_feedback for update
to authenticated
using ((select public.is_feedback_admin()))
with check ((select public.is_feedback_admin()));

create or replace function public.set_feedback_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_feedback_updated_at on public.user_feedback;
create trigger set_feedback_updated_at
before update on public.user_feedback
for each row execute function public.set_feedback_updated_at();

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
-- 7. After the owner signs in with Gmail once, register only that auth UID:
--    insert into public.feedback_admins (user_id)
--    select id from auth.users where lower(email) = lower('OWNER_GMAIL_HERE');
-- 8. Deploy supabase/functions/feedback-notify and configure the private
--    Database Webhook described in docs/feedback-backend-setup.md.
