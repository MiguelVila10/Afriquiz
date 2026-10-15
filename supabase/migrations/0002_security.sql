-- AfriQuiz — permissões (RLS), perfis automáticos e limites de publicação

-- ---------------------------------------------------------------
-- É administrador? (lê a tabela admins, que a API não consegue ver)
-- ---------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid())
$$;

-- ---------------------------------------------------------------
-- Cria o perfil automaticamente quando alguém se regista
-- ---------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text := coalesce(new.raw_user_meta_data ->> 'username', '');
  v_try  text;
  v_i    int := 0;
begin
  if v_base !~ '^[A-Za-z0-9_]{3,20}$' then
    v_base := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  v_try := v_base;
  while exists (select 1 from public.profiles p where lower(p.username) = lower(v_try)) loop
    v_i := v_i + 1;
    v_try := left(v_base, 16) || '_' || v_i::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    v_try,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 50), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- Limite de publicações (anti-spam): N inserções por janela de tempo
-- ---------------------------------------------------------------
create function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max    int      := tg_argv[0]::int;
  v_window interval := tg_argv[1]::interval;
  v_count  int;
begin
  execute format(
    'select count(*) from %I.%I where author_id = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name
  ) into v_count using new.author_id, v_window;

  if v_count >= v_max then
    raise exception 'Está a publicar demasiado depressa. Tente novamente mais tarde.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger ideas_rate_limit
  before insert on public.ideas
  for each row execute function public.enforce_rate_limit('5', '1 hour');

create trigger idea_comments_rate_limit
  before insert on public.idea_comments
  for each row execute function public.enforce_rate_limit('20', '10 minutes');

-- ---------------------------------------------------------------
-- RLS ativo em TODAS as tabelas. Tabela sem política = acesso negado.
-- ---------------------------------------------------------------
alter table public.categories             enable row level security;
alter table public.profiles               enable row level security;
alter table public.admins                 enable row level security;
alter table public.questions              enable row level security;
alter table public.articles               enable row level security;
alter table public.ideas                  enable row level security;
alter table public.idea_comments          enable row level security;
alter table public.idea_votes             enable row level security;
alter table public.quiz_sessions          enable row level security;
alter table public.quiz_session_questions enable row level security;

-- Começar do zero: retirar todos os privilégios por omissão do Supabase
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Tabelas futuras também nascem fechadas
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- categories: leitura pública
grant select on public.categories to anon, authenticated;
create policy "categorias visíveis a todos" on public.categories
  for select to anon, authenticated using (true);

-- profiles: leitura pública; cada um só edita o seu nome e bio
grant select on public.profiles to anon, authenticated;
grant update (display_name, bio) on public.profiles to authenticated;
create policy "perfis visíveis a todos" on public.profiles
  for select to anon, authenticated using (true);
create policy "cada um edita o seu perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- admins, questions, quiz_sessions, quiz_session_questions:
-- sem privilégios nem políticas → só acessíveis via funções controladas.

-- articles: aprovados são públicos; o autor vê os seus; o admin vê tudo
grant select on public.articles to anon, authenticated;
create policy "artigos aprovados, próprios ou admin" on public.articles
  for select to anon, authenticated
  using (
    status = 'approved'
    or author_id = (select auth.uid())
    or (select public.is_admin())
  );

-- ideas
grant select on public.ideas to anon, authenticated;
grant insert (kind, title, body) on public.ideas to authenticated;
grant delete on public.ideas to authenticated;
create policy "ideias visíveis" on public.ideas
  for select to anon, authenticated
  using (not hidden or author_id = (select auth.uid()) or (select public.is_admin()));
create policy "publicar ideia em nome próprio" on public.ideas
  for insert to authenticated
  with check (author_id = (select auth.uid()) and hidden = false);
create policy "apagar a própria ideia (ou admin)" on public.ideas
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

-- idea_comments
grant select on public.idea_comments to anon, authenticated;
grant insert (idea_id, body) on public.idea_comments to authenticated;
grant delete on public.idea_comments to authenticated;
create policy "comentários visíveis" on public.idea_comments
  for select to anon, authenticated
  using (not hidden or author_id = (select auth.uid()) or (select public.is_admin()));
create policy "comentar em nome próprio numa ideia visível" on public.idea_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and hidden = false
    and exists (select 1 from public.ideas i where i.id = idea_id and not i.hidden)
  );
create policy "apagar o próprio comentário (ou admin)" on public.idea_comments
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

-- idea_votes
grant select on public.idea_votes to anon, authenticated;
grant insert (idea_id) on public.idea_votes to authenticated;
grant delete on public.idea_votes to authenticated;
create policy "votos visíveis" on public.idea_votes
  for select to anon, authenticated using (true);
create policy "votar em nome próprio numa ideia visível" on public.idea_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.ideas i where i.id = idea_id and not i.hidden)
  );
create policy "retirar o próprio voto" on public.idea_votes
  for delete to authenticated
  using (user_id = (select auth.uid()));
