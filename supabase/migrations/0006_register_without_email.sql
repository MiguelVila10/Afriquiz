-- AfriQuiz — registo sem email de confirmação.
-- Motivo: o serviço de email gratuito do Supabase só envia ~2 emails/hora,
-- o que impede registos em grupo (ex.: numa apresentação).
-- A conta é criada já confirmada e a pessoa entra logo com email + senha.
-- Contrapartida: o email não é verificado. Proteções: validação, limite global
-- de registos por 10 minutos e senha cifrada com bcrypt (igual ao Supabase).

create function public.register_user(
  p_username     text,
  p_email        text,
  p_password     text,
  p_display_name text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id     uuid := gen_random_uuid();
  v_email  text := lower(btrim(coalesce(p_email, '')));
  v_user   text := btrim(coalesce(p_username, ''));
  v_name   text := nullif(left(btrim(coalesce(p_display_name, '')), 50), '');
  v_recent int;
begin
  if v_user !~ '^[A-Za-z0-9_]{3,20}$' then
    raise exception 'O nome de utilizador deve ter 3 a 20 caracteres: letras, números ou _.' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then
    raise exception 'Email inválido.' using errcode = '22023';
  end if;
  if char_length(coalesce(p_password, '')) < 8 or char_length(p_password) > 72 then
    raise exception 'A senha deve ter entre 8 e 72 caracteres.' using errcode = '22023';
  end if;

  -- anti-abuso: no máximo 40 contas novas a cada 10 minutos (no site inteiro)
  select count(*) into v_recent from auth.users u where u.created_at > now() - interval '10 minutes';
  if v_recent >= 40 then
    raise exception 'Muitos registos ao mesmo tempo. Aguarde alguns minutos.' using errcode = 'P0001';
  end if;

  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Já existe uma conta com este email.' using errcode = '23505';
  end if;
  if exists (select 1 from public.profiles p where lower(p.username) = lower(v_user)) then
    raise exception 'Este nome de utilizador já está a ser usado.' using errcode = '23505';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'username', v_user,
                       'display_name', v_name, 'email_verified', true, 'phone_verified', false),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    v_id::text, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'username', v_user,
                       'display_name', v_name, 'email_verified', true, 'phone_verified', false),
    'email', now(), now(), now()
  );
  -- o perfil público é criado pelo trigger on_auth_user_created
end;
$$;

grant execute on function public.register_user(text, text, text, text) to anon, authenticated;
