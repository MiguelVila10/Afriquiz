-- AfriQuiz — secção Vídeos (vídeos do YouTube publicados só pelo administrador)

create table public.videos (
  id           uuid primary key default gen_random_uuid(),
  youtube_id   text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  title        text not null check (char_length(btrim(title)) between 3 and 150),
  description  text check (description is null or char_length(description) <= 3000),
  category_id  smallint references public.categories(id),
  hidden       boolean not null default false,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index videos_created_idx on public.videos (created_at desc);

alter table public.videos enable row level security;
revoke all on public.videos from anon, authenticated;
grant select on public.videos to anon, authenticated;

-- Toda a gente vê os vídeos visíveis; o administrador vê também os ocultos
create policy videos_read on public.videos
  for select using (not hidden or (select public.is_admin()));

-- Extrai o código de 11 caracteres de um link do YouTube (ou aceita o próprio código)
create function public.youtube_id_from(p_url text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    substring(btrim(p_url) from '(?:v=|youtu\.be/|/shorts/|/embed/|/live/)([A-Za-z0-9_-]{11})'),
    case when btrim(p_url) ~ '^[A-Za-z0-9_-]{11}$' then btrim(p_url) end
  );
$$;

create function public.admin_add_video(p_url text, p_title text, p_description text, p_category text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_yt  text;
  v_cat smallint;
  v_id  uuid;
begin
  perform public.assert_admin();
  v_yt := public.youtube_id_from(p_url);
  if v_yt is null then
    raise exception 'Link do YouTube inválido.' using errcode = '22023';
  end if;
  if p_category is not null and p_category <> '' then
    select c.id into v_cat from public.categories c where c.slug = p_category;
    if v_cat is null then
      raise exception 'Categoria inválida.' using errcode = '22023';
    end if;
  end if;
  insert into public.videos (youtube_id, title, description, category_id, created_by)
  values (v_yt, btrim(p_title), nullif(btrim(p_description), ''), v_cat, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create function public.admin_update_video(p_id uuid, p_title text, p_description text, p_category text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_cat smallint;
begin
  perform public.assert_admin();
  if p_category is not null and p_category <> '' then
    select c.id into v_cat from public.categories c where c.slug = p_category;
    if v_cat is null then
      raise exception 'Categoria inválida.' using errcode = '22023';
    end if;
  end if;
  update public.videos v
  set title = btrim(p_title), description = nullif(btrim(p_description), ''), category_id = v_cat
  where v.id = p_id;
  if not found then
    raise exception 'Vídeo não encontrado.' using errcode = '22023';
  end if;
end;
$$;

create function public.admin_set_video_hidden(p_id uuid, p_hidden boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.videos v set hidden = p_hidden where v.id = p_id;
  if not found then
    raise exception 'Vídeo não encontrado.' using errcode = '22023';
  end if;
end;
$$;

grant execute on function public.admin_add_video(text, text, text, text) to authenticated;
grant execute on function public.admin_update_video(uuid, text, text, text) to authenticated;
grant execute on function public.admin_set_video_hidden(uuid, boolean) to authenticated;
