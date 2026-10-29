-- AfriQuiz — fotos de perfil (Supabase Storage)
-- Cada pessoa só pode enviar/alterar ficheiros na sua própria pasta: avatars/<id-do-utilizador>/...
-- As fotos são públicas (aparecem no ranking e na comunidade).

alter table public.profiles
  add column avatar_url text
  check (avatar_url is null or avatar_url like 'https://aokoiqvyqokrsawzyohz.supabase.co/storage/v1/object/public/avatars/%');

grant update (avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatar: ver a própria pasta" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatar: enviar para a própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatar: substituir na própria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
