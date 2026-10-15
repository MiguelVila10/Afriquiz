# AfriQuiz 2.0

Plataforma web do AfriQuiz: quiz africacêntrico com contas de utilizador, ranking,
secção Aprender, Comunidade (ideias e sugestões) e contribuições moderadas.

## Tecnologia

- **Frontend:** React 18 + Vite (pasta `web/`)
- **Backend:** Supabase — base de dados PostgreSQL, autenticação e regras de segurança (pasta `supabase/`)
- **Alojamento:** qualquer serviço de sites estáticos (Netlify, Vercel)

## Segurança (resumo)

- A resposta certa **nunca** é enviada ao navegador antes de o jogador responder; a correção e o
  cronómetro são feitos no servidor (`start_quiz`, `next_question`, `answer_question`).
- RLS ativo em todas as tabelas; as perguntas, sessões e administradores não são acessíveis pela API.
- Tudo o que os utilizadores enviam (perguntas, conhecimentos) entra como **pendente** e só o
  administrador pode aprovar (`admin_*`, verificado no servidor com `is_admin()`).
- Ninguém se pode tornar administrador pelo site — só por SQL no painel do Supabase.
- Limites anti-spam: 5 ideias/hora e 20 comentários/10 min por pessoa.
- O texto dos utilizadores é sempre mostrado como texto (React escapa HTML) → sem XSS.
- Cabeçalhos de segurança (CSP, X-Frame-Options…) em `web/public/_headers` e `web/vercel.json`.
- O ficheiro `.env` só contém a chave **pública** do Supabase. Nunca coloque lá a `service_role`.

## Correr no computador (Node.js 18 ou superior)

```bash
cd web
npm install
npm run dev
```

Abre em http://localhost:3000 e liga-se ao Supabase real. A porta 3000 coincide com o
"Site URL" por omissão do Supabase, por isso os emails de confirmação funcionam logo.

## Publicar

```bash
cd web
npm run build      # gera a pasta dist/
```

**GitHub Pages (automático):** cada alteração enviada para o ramo `main` é publicada pelo
workflow `.github/workflows/deploy.yml` em `https://<utilizador>.github.io/afriquiz/`.

Alternativas: arrastar a pasta `dist/` para o Cloudflare Pages ou para o Netlify Drop.

Depois de publicar, no painel do Supabase → Authentication → URL Configuration:
- **Site URL:** o endereço do site (ex.: `https://afriquiz.netlify.app`)
- **Redirect URLs:** o mesmo endereço + `/**`

## Base de dados

As migrações estão em `supabase/migrations/` pela ordem em que foram aplicadas.
`0005_revoke_private_functions.sql` deve ser corrido no SQL Editor do Supabase (fecha funções
privadas a visitantes anónimos).

### Tornar-se administrador

Depois de criar a sua conta no site, no SQL Editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'O-SEU-EMAIL';
```
