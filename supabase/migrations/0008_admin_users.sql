-- AfriQuiz — lista de utilizadores e perfis para o painel de Gestão (só administrador)

create function public.admin_list_users(p_search text default null, p_limit int default 100, p_offset int default 0)
returns table (
  id uuid, username text, display_name text, bio text, email text,
  created_at timestamptz, last_sign_in_at timestamptz, is_admin boolean,
  games bigint, points bigint, accuracy numeric,
  questions_sent bigint, articles_sent bigint, ideas bigint, comments bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select p.id, p.username, p.display_name, p.bio, u.email::text,
         p.created_at, u.last_sign_in_at,
         exists (select 1 from public.admins a where a.user_id = p.id),
         (select count(*) from public.quiz_sessions s where s.user_id = p.id and s.finished_at is not null),
         (select coalesce(sum(s.correct_count), 0) from public.quiz_sessions s where s.user_id = p.id and s.finished_at is not null)::bigint,
         (select round(100.0 * sum(s.correct_count) / nullif(sum(s.total), 0), 1)
            from public.quiz_sessions s where s.user_id = p.id and s.finished_at is not null),
         (select count(*) from public.questions q where q.author_id = p.id),
         (select count(*) from public.articles ar where ar.author_id = p.id),
         (select count(*) from public.ideas i where i.author_id = p.id),
         (select count(*) from public.idea_comments c where c.author_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where p_search is null or btrim(p_search) = ''
     or p.username ilike '%' || btrim(p_search) || '%'
     or p.display_name ilike '%' || btrim(p_search) || '%'
     or u.email ilike '%' || btrim(p_search) || '%'
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create function public.admin_user_games(p_user_id uuid, p_limit int default 10)
returns table (category_name text, score smallint, total smallint, finished_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select c.name, s.correct_count, s.total, s.finished_at
  from public.quiz_sessions s
  join public.categories c on c.id = s.category_id
  where s.user_id = p_user_id and s.finished_at is not null
  order by s.finished_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
end;
$$;

grant execute on function public.admin_list_users(text, int, int) to authenticated;
grant execute on function public.admin_user_games(uuid, int) to authenticated;
