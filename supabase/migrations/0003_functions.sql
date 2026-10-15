-- AfriQuiz — funções chamadas pelo site (RPC)
-- Todas usam search_path vazio e nomes totalmente qualificados.

-- ===============================================================
-- UTILIDADES
-- ===============================================================
create function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles p where lower(p.username) = lower(p_username))
$$;

-- ===============================================================
-- QUIZ — a resposta certa nunca sai do servidor antes de responder
-- ===============================================================
create function public.start_quiz(p_category text, p_count int)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_cat     smallint;
  v_n       int;
  v_session uuid;
begin
  if p_count is null or p_count not in (5, 10, 15, 20, 25) then
    raise exception 'Número de questões inválido.' using errcode = '22023';
  end if;

  select c.id into v_cat from public.categories c where c.slug = p_category;
  if v_cat is null then
    raise exception 'Categoria inválida.' using errcode = '22023';
  end if;

  select count(*) into v_n
  from public.questions q where q.category_id = v_cat and q.status = 'approved';
  v_n := least(v_n, p_count);
  if v_n = 0 then
    raise exception 'Esta categoria ainda não tem perguntas.' using errcode = '22023';
  end if;

  -- limpeza: sessões anónimas com mais de 1 dia
  delete from public.quiz_sessions s
  where s.user_id is null and s.started_at < now() - interval '1 day';

  insert into public.quiz_sessions (user_id, category_id, total)
  values (auth.uid(), v_cat, v_n)
  returning id into v_session;

  insert into public.quiz_session_questions (session_id, position, question_id)
  select v_session, (row_number() over ())::smallint, r.id
  from (
    select q.id from public.questions q
    where q.category_id = v_cat and q.status = 'approved'
    order by random()
    limit v_n
  ) r;

  return v_session;
end;
$$;

-- Devolve a pergunta atual (sem a resposta). O cronómetro conta no servidor.
create function public.next_question(p_session uuid)
returns table (q_position smallint, q_total smallint, q_text text, q_options text[], q_time_left int)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_owner   uuid;
  v_total   smallint;
  v_pos     smallint;
  v_served  timestamptz;
  v_text    text;
  v_options text[];
begin
  select s.user_id, s.total into v_owner, v_total
  from public.quiz_sessions s where s.id = p_session;
  if not found or (v_owner is not null and v_owner is distinct from auth.uid()) then
    raise exception 'Sessão inválida.' using errcode = '42501';
  end if;

  select sq.position, sq.served_at, q.question, q.options
    into v_pos, v_served, v_text, v_options
  from public.quiz_session_questions sq
  join public.questions q on q.id = sq.question_id
  where sq.session_id = p_session and sq.answered_at is null
  order by sq.position
  limit 1;

  if v_pos is null then
    return; -- quiz terminado
  end if;

  if v_served is null then
    v_served := now();
    update public.quiz_session_questions sq
    set served_at = v_served
    where sq.session_id = p_session and sq.position = v_pos;
  end if;

  return query select
    v_pos, v_total, v_text, v_options,
    greatest(0, 15 - floor(extract(epoch from (now() - v_served)))::int);
end;
$$;

-- Corrige a resposta. p_choice = null significa "tempo esgotado".
create function public.answer_question(p_session uuid, p_choice int)
returns table (r_correct boolean, r_correct_index smallint, r_explanation text,
               r_finished boolean, r_score smallint, r_total smallint)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_owner    uuid;
  v_total    smallint;
  v_finished timestamptz;
  v_pos      smallint;
  v_served   timestamptz;
  v_qid      uuid;
  v_ci       smallint;
  v_expl     text;
  v_choice   smallint;
  v_ok       boolean;
  v_score    smallint;
begin
  -- "for update" impede responder duas vezes em simultâneo
  select s.user_id, s.total, s.finished_at into v_owner, v_total, v_finished
  from public.quiz_sessions s where s.id = p_session
  for update;
  if not found or (v_owner is not null and v_owner is distinct from auth.uid()) then
    raise exception 'Sessão inválida.' using errcode = '42501';
  end if;
  if v_finished is not null then
    raise exception 'Este quiz já terminou.' using errcode = '22023';
  end if;

  if p_choice is not null and (p_choice < 0 or p_choice > 3) then
    raise exception 'Resposta inválida.' using errcode = '22023';
  end if;

  select sq.position, sq.served_at, sq.question_id into v_pos, v_served, v_qid
  from public.quiz_session_questions sq
  where sq.session_id = p_session and sq.answered_at is null
  order by sq.position
  limit 1;
  if v_pos is null or v_served is null then
    raise exception 'Não há nenhuma pergunta ativa.' using errcode = '22023';
  end if;

  select q.correct_index, q.explanation into v_ci, v_expl
  from public.questions q where q.id = v_qid;

  -- 15 s + 3 s de tolerância para a rede
  if now() - v_served > interval '18 seconds' then
    v_choice := null;
  else
    v_choice := p_choice;
  end if;
  v_ok := coalesce(v_choice = v_ci, false);

  update public.quiz_session_questions sq
  set answered_at = now(), chosen_index = v_choice, is_correct = v_ok
  where sq.session_id = p_session and sq.position = v_pos;

  update public.quiz_sessions s
  set correct_count = s.correct_count + (case when v_ok then 1 else 0 end),
      finished_at   = case when v_pos >= v_total then now() else null end
  where s.id = p_session
  returning s.correct_count into v_score;

  return query select v_ok, v_ci, v_expl, (v_pos >= v_total), v_score, v_total;
end;
$$;

-- Ranking (só jogadores com conta, só jogos terminados)
create function public.leaderboard(p_category text default null, p_limit int default 20)
returns table (pos bigint, username text, display_name text, points bigint, games bigint, accuracy numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select rank() over (order by sum(s.correct_count) desc),
         p.username, p.display_name,
         sum(s.correct_count)::bigint,
         count(*)::bigint,
         round(100.0 * sum(s.correct_count) / nullif(sum(s.total), 0), 1)
  from public.quiz_sessions s
  join public.profiles p on p.id = s.user_id
  join public.categories c on c.id = s.category_id
  where s.finished_at is not null
    and (p_category is null or c.slug = p_category)
  group by p.id, p.username, p.display_name
  order by sum(s.correct_count) desc, count(*) asc
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
$$;

-- Histórico do próprio jogador
create function public.my_history(p_limit int default 30)
returns table (session_id uuid, category_slug text, category_name text,
               score smallint, total smallint, started_at timestamptz, finished_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, c.slug, c.name, s.correct_count, s.total, s.started_at, s.finished_at
  from public.quiz_sessions s
  join public.categories c on c.id = s.category_id
  where s.user_id = auth.uid() and s.finished_at is not null
  order by s.finished_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100)
$$;

-- ===============================================================
-- CONTRIBUIR — tudo entra como "pendente"
-- ===============================================================
create function public.submit_question(p_category text, p_question text, p_options text[],
                                       p_correct int, p_explanation text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_cat     smallint;
  v_pending int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception 'Precisa de iniciar sessão.' using errcode = '42501';
  end if;
  select c.id into v_cat from public.categories c where c.slug = p_category;
  if v_cat is null then
    raise exception 'Categoria inválida.' using errcode = '22023';
  end if;
  select count(*) into v_pending
  from public.questions q where q.author_id = v_uid and q.status = 'pending';
  if v_pending >= 20 then
    raise exception 'Tem 20 perguntas à espera de revisão. Aguarde a moderação.' using errcode = 'P0001';
  end if;

  insert into public.questions (category_id, question, options, correct_index, explanation, status, author_id)
  values (
    v_cat,
    btrim(p_question),
    (select array_agg(btrim(t.x) order by t.ord) from unnest(p_options) with ordinality as t(x, ord)),
    p_correct,
    nullif(btrim(p_explanation), ''),
    'pending',
    v_uid
  )
  returning id into v_id;
  return v_id;
end;
$$;

create function public.my_questions()
returns table (id uuid, category_slug text, question text, options text[], correct_index smallint,
               explanation text, status public.content_status, moderation_note text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select q.id, c.slug, q.question, q.options, q.correct_index, q.explanation,
         q.status, q.moderation_note, q.created_at
  from public.questions q
  join public.categories c on c.id = q.category_id
  where q.author_id = auth.uid()
  order by q.created_at desc
$$;

create function public.submit_article(p_category text, p_title text, p_summary text,
                                      p_body text, p_sources text default null)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_cat     smallint;
  v_pending int;
  v_id      uuid;
begin
  if v_uid is null then
    raise exception 'Precisa de iniciar sessão.' using errcode = '42501';
  end if;
  select c.id into v_cat from public.categories c where c.slug = p_category;
  if v_cat is null then
    raise exception 'Categoria inválida.' using errcode = '22023';
  end if;
  select count(*) into v_pending
  from public.articles a where a.author_id = v_uid and a.status = 'pending';
  if v_pending >= 10 then
    raise exception 'Tem 10 conhecimentos à espera de revisão. Aguarde a moderação.' using errcode = 'P0001';
  end if;

  insert into public.articles (category_id, title, summary, body, sources, status, author_id)
  values (v_cat, btrim(p_title), nullif(btrim(p_summary), ''), btrim(p_body),
          nullif(btrim(p_sources), ''), 'pending', v_uid)
  returning id into v_id;
  return v_id;
end;
$$;

-- ===============================================================
-- COMUNIDADE — lista com contagem de votos (respeita o RLS)
-- ===============================================================
create function public.list_ideas(p_sort text default 'recentes', p_limit int default 20, p_offset int default 0)
returns table (id uuid, kind public.idea_kind, title text, body text, hidden boolean, created_at timestamptz,
               author_username text, author_display_name text, votes bigint, comments bigint, voted_by_me boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.id, i.kind, i.title, i.body, i.hidden, i.created_at,
         p.username, p.display_name,
         (select count(*) from public.idea_votes v where v.idea_id = i.id),
         (select count(*) from public.idea_comments c where c.idea_id = i.id and not c.hidden),
         exists (select 1 from public.idea_votes v where v.idea_id = i.id and v.user_id = auth.uid())
  from public.ideas i
  join public.profiles p on p.id = i.author_id
  order by
    case when p_sort = 'populares'
         then (select count(*) from public.idea_votes v where v.idea_id = i.id) end desc nulls last,
    i.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- ===============================================================
-- ADMINISTRAÇÃO — todas verificam is_admin() no servidor
-- ===============================================================
create function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso reservado ao administrador.' using errcode = '42501';
  end if;
end;
$$;

create function public.admin_counts()
returns table (pending_questions bigint, pending_articles bigint, hidden_ideas bigint, users bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query select
    (select count(*) from public.questions q where q.status = 'pending'),
    (select count(*) from public.articles a where a.status = 'pending'),
    (select count(*) from public.ideas i where i.hidden),
    (select count(*) from public.profiles);
end;
$$;

create function public.admin_list_questions(p_status public.content_status default 'pending',
                                            p_limit int default 50, p_offset int default 0)
returns table (id uuid, category_slug text, question text, options text[], correct_index smallint,
               explanation text, status public.content_status, moderation_note text,
               author_username text, created_at timestamptz, reviewed_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select q.id, c.slug, q.question, q.options, q.correct_index, q.explanation, q.status,
         q.moderation_note, p.username, q.created_at, q.reviewed_at
  from public.questions q
  join public.categories c on c.id = q.category_id
  left join public.profiles p on p.id = q.author_id
  where q.status = p_status
  order by q.created_at asc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create function public.admin_update_question(p_id uuid, p_category text, p_question text,
                                             p_options text[], p_correct int, p_explanation text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_cat smallint;
begin
  perform public.assert_admin();
  select c.id into v_cat from public.categories c where c.slug = p_category;
  if v_cat is null then
    raise exception 'Categoria inválida.' using errcode = '22023';
  end if;
  update public.questions q
  set category_id   = v_cat,
      question      = btrim(p_question),
      options       = (select array_agg(btrim(t.x) order by t.ord) from unnest(p_options) with ordinality as t(x, ord)),
      correct_index = p_correct,
      explanation   = nullif(btrim(p_explanation), '')
  where q.id = p_id;
  if not found then
    raise exception 'Pergunta não encontrada.' using errcode = '22023';
  end if;
end;
$$;

create function public.admin_review_question(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.questions q
  set status = case when p_approve then 'approved'::public.content_status else 'rejected'::public.content_status end,
      moderation_note = nullif(btrim(p_note), ''),
      reviewed_at = now()
  where q.id = p_id;
  if not found then
    raise exception 'Pergunta não encontrada.' using errcode = '22023';
  end if;
end;
$$;

create function public.admin_review_article(p_id uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.articles a
  set status = case when p_approve then 'approved'::public.content_status else 'rejected'::public.content_status end,
      moderation_note = nullif(btrim(p_note), ''),
      reviewed_at = now()
  where a.id = p_id;
  if not found then
    raise exception 'Conhecimento não encontrado.' using errcode = '22023';
  end if;
end;
$$;

create function public.admin_set_idea_hidden(p_id uuid, p_hidden boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.ideas i set hidden = p_hidden where i.id = p_id;
end;
$$;

create function public.admin_set_comment_hidden(p_id uuid, p_hidden boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  update public.idea_comments c set hidden = p_hidden where c.id = p_id;
end;
$$;

-- ===============================================================
-- PERMISSÕES DE EXECUÇÃO — fechar tudo e abrir só o necessário
-- ===============================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.is_admin(),
  public.options_valid(text[]),
  public.username_available(text),
  public.start_quiz(text, int),
  public.next_question(uuid),
  public.answer_question(uuid, int),
  public.leaderboard(text, int),
  public.list_ideas(text, int, int)
to anon, authenticated;

grant execute on function
  public.my_history(int),
  public.submit_question(text, text, text[], int, text),
  public.my_questions(),
  public.submit_article(text, text, text, text, text),
  public.admin_counts(),
  public.admin_list_questions(public.content_status, int, int),
  public.admin_update_question(uuid, text, text, text[], int, text),
  public.admin_review_question(uuid, boolean, text),
  public.admin_review_article(uuid, boolean, text),
  public.admin_set_idea_hidden(uuid, boolean),
  public.admin_set_comment_hidden(uuid, boolean)
to authenticated;
