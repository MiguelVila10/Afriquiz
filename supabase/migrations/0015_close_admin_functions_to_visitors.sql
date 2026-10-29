-- AfriQuiz — funções de gestão fechadas a visitantes sem conta (já recusavam quem não é administrador;
-- assim nem chegam a ser chamáveis). youtube_id_from só é usada por dentro de admin_add_video.
revoke execute on function
  public.admin_add_video(text, text, text, text),
  public.admin_update_video(uuid, text, text, text),
  public.admin_set_video_hidden(uuid, boolean),
  public.admin_list_users(text, int, int),
  public.admin_user_games(uuid, int),
  public.admin_reset_password(text, text),
  public.admin_update_article(uuid, text, text, text, text, text),
  public.youtube_id_from(text)
from public, anon;

revoke execute on function public.youtube_id_from(text) from authenticated;
