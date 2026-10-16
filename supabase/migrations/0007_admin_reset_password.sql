-- AfriQuiz — o administrador pode repor a senha de um utilizador (sem depender de email)
create function public.admin_reset_password(p_username text, p_new_password text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  perform public.assert_admin();
  if char_length(coalesce(p_new_password, '')) < 8 or char_length(p_new_password) > 72 then
    raise exception 'A senha deve ter entre 8 e 72 caracteres.' using errcode = '22023';
  end if;
  select p.id into v_id from public.profiles p where lower(p.username) = lower(btrim(p_username));
  if v_id is null then
    raise exception 'Utilizador não encontrado.' using errcode = '22023';
  end if;
  update auth.users u
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where u.id = v_id;
end;
$$;

revoke execute on function public.admin_reset_password(text, text) from public, anon;
grant execute on function public.admin_reset_password(text, text) to authenticated;
