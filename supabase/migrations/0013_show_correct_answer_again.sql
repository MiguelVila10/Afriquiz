-- AfriQuiz — depois de responder, o jogo volta a mostrar a certa (verde) e a errada (vermelho)
create or replace function public.answer_question(p_session uuid, p_choice int)
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
