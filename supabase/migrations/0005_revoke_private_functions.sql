-- AfriQuiz: fechar as funções que não devem ser chamadas por visitantes anónimos
revoke execute on function
  public.handle_new_user(),
  public.enforce_rate_limit(),
  public.assert_admin()
from public, anon, authenticated;

revoke execute on function
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
from public, anon;
