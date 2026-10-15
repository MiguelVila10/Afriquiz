-- AfriQuiz — esquema base
-- Princípio: nada é acessível pelo navegador a não ser o que está explicitamente concedido.

-- ---------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------
create type public.content_status as enum ('pending', 'approved', 'rejected');
create type public.idea_kind as enum ('ideia', 'sugestao');

-- ---------------------------------------------------------------
-- Validação das alternativas: 4 opções, não vazias, sem repetições
-- ---------------------------------------------------------------
create function public.options_valid(o text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_length(o, 1), 0) = 4
     and (select bool_and(x is not null and char_length(btrim(x)) between 1 and 120) from unnest(o) as t(x))
     and (select count(distinct lower(btrim(x))) from unnest(o) as t(x)) = 4
$$;

-- ---------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------
create table public.categories (
  id          smallint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 300),
  sort_order  smallint not null default 0
);

-- ---------------------------------------------------------------
-- Perfis (dados públicos do utilizador — o email NUNCA fica aqui)
-- ---------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) between 1 and 50),
  bio          text check (char_length(bio) <= 280),
  created_at   timestamptz not null default now()
);
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- ---------------------------------------------------------------
-- Administradores (sem qualquer acesso pela API — só por SQL no painel)
-- ---------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Perguntas do quiz (nunca lidas diretamente pelo navegador)
-- ---------------------------------------------------------------
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  category_id     smallint not null references public.categories (id),
  question        text not null check (char_length(question) between 10 and 300),
  options         text[] not null check (public.options_valid(options)),
  correct_index   smallint not null check (correct_index between 0 and 3),
  explanation     text check (char_length(explanation) <= 600),
  status          public.content_status not null default 'pending',
  author_id       uuid references public.profiles (id) on delete set null,
  moderation_note text check (char_length(moderation_note) <= 600),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index questions_category_status_idx on public.questions (category_id, status);
create index questions_author_idx on public.questions (author_id);
create index questions_status_idx on public.questions (status);

-- ---------------------------------------------------------------
-- Conhecimentos (secção "Aprender")
-- ---------------------------------------------------------------
create table public.articles (
  id              uuid primary key default gen_random_uuid(),
  category_id     smallint not null references public.categories (id),
  title           text not null check (char_length(title) between 5 and 120),
  summary         text check (char_length(summary) <= 300),
  body            text not null check (char_length(body) between 50 and 20000),
  sources         text check (char_length(sources) <= 1000),
  status          public.content_status not null default 'pending',
  author_id       uuid references public.profiles (id) on delete set null,
  moderation_note text check (char_length(moderation_note) <= 600),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index articles_category_status_idx on public.articles (category_id, status);
create index articles_author_idx on public.articles (author_id);
create index articles_status_idx on public.articles (status);

-- ---------------------------------------------------------------
-- Comunidade: ideias e sugestões, comentários e votos
-- ---------------------------------------------------------------
create table public.ideas (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind       public.idea_kind not null default 'ideia',
  title      text not null check (char_length(btrim(title)) between 5 and 120),
  body       text not null check (char_length(btrim(body)) between 10 and 5000),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index ideas_created_idx on public.ideas (created_at desc);
create index ideas_author_idx on public.ideas (author_id);

create table public.idea_comments (
  id         uuid primary key default gen_random_uuid(),
  idea_id    uuid not null references public.ideas (id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
create index idea_comments_idea_idx on public.idea_comments (idea_id, created_at);
create index idea_comments_author_idx on public.idea_comments (author_id);

create table public.idea_votes (
  idea_id    uuid not null references public.ideas (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);
create index idea_votes_user_idx on public.idea_votes (user_id);

-- ---------------------------------------------------------------
-- Sessões de jogo (a correção é feita aqui, no servidor)
-- ---------------------------------------------------------------
create table public.quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles (id) on delete cascade, -- null = jogador anónimo
  category_id   smallint not null references public.categories (id),
  total         smallint not null check (total between 1 and 25),
  correct_count smallint not null default 0,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index quiz_sessions_user_idx on public.quiz_sessions (user_id);
create index quiz_sessions_category_idx on public.quiz_sessions (category_id);
create index quiz_sessions_finished_idx on public.quiz_sessions (finished_at) where finished_at is not null;
create index quiz_sessions_anon_started_idx on public.quiz_sessions (started_at) where user_id is null;

create table public.quiz_session_questions (
  session_id   uuid not null references public.quiz_sessions (id) on delete cascade,
  position     smallint not null,
  question_id  uuid not null references public.questions (id) on delete cascade,
  served_at    timestamptz,
  answered_at  timestamptz,
  chosen_index smallint,
  is_correct   boolean,
  primary key (session_id, position)
);
create index quiz_session_questions_question_idx on public.quiz_session_questions (question_id);
