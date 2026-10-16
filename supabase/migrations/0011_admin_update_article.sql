-- AfriQuiz — o administrador pode editar conhecimentos (título, resumo, texto, fontes, categoria)
create function public.admin_update_article(p_id uuid, p_category text, p_title text, p_summary text, p_body text, p_sources text)
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
  update public.articles a
  set category_id = v_cat,
      title       = btrim(p_title),
      summary     = nullif(btrim(p_summary), ''),
      body        = btrim(p_body),
      sources     = nullif(btrim(p_sources), '')
  where a.id = p_id;
  if not found then
    raise exception 'Conhecimento não encontrado.' using errcode = '22023';
  end if;
end;
$$;

grant execute on function public.admin_update_article(uuid, text, text, text, text, text) to authenticated;
