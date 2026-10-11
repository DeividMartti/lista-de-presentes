# Lista de presentes

Site estático de lista de presentes para GitHub Pages, com catálogo, painel administrativo e armazenamento central no Supabase. Todos os aparelhos usam o mesmo projeto; não é necessário configurar navegador por navegador.

## Publicar no GitHub Pages

1. No Supabase, execute `supabase-setup.sql` no SQL Editor.
2. Em **Authentication → Users**, confirme que o usuário de e-mail que administrará o painel existe.
3. No SQL Editor, associe esse usuário ao perfil de anfitrião. Substitua o e-mail no comando abaixo pelo e-mail cadastrado no Supabase Auth:

   ```sql
   INSERT INTO public.profiles (id, auth_user_id, username, name)
   SELECT 'admin', id, email, COALESCE(raw_user_meta_data->>'name', 'Administrador')
   FROM auth.users
   WHERE lower(email) = lower('SEU_EMAIL_DO_SUPABASE')
   ON CONFLICT (id) DO UPDATE SET
     auth_user_id = EXCLUDED.auth_user_id,
     username = EXCLUDED.username,
     name = EXCLUDED.name;
   ```

   Execute e confirme que uma linha foi inserida ou atualizada.
4. No GitHub, abra **Settings → Secrets and variables → Actions → New repository secret** e crie:
   - `VITE_SUPABASE_URL`: URL do projeto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: chave pública `anon` do projeto.
5. Em **Settings → Pages**, selecione **GitHub Actions** como origem da publicação.
6. Envie as alterações para a branch `main`. O workflow `.github/workflows/deploy-pages.yml` compila e publica o site.

O workflow precisa desses dois segredos para gerar a publicação. A chave `anon`/pública é usada no navegador e é protegida pelas políticas RLS do SQL. **Nunca** use `service_role` ou qualquer chave secreta no site, no `.env` com prefixo `VITE_` ou no GitHub Pages.

## Funcionamento e segurança

- Os convidados leem o catálogo e criam reservas no mesmo Supabase.
- Somente uma conta autenticada no Supabase Auth e vinculada à tabela `profiles` pode alterar presentes, configurações ou consultar reservas.
- A criação de reserva é feita por uma função SQL transacional: o presente não pode ser reservado duas vezes ao mesmo tempo.
- O site não confirma a reserva se o Supabase rejeitar a gravação; o erro é exibido para o visitante.
- O projeto não grava mais credenciais Supabase nem cópias de reservas/presentes no armazenamento local do navegador.

## Desenvolvimento local

1. Instale Node.js 22 ou superior.
2. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Execute `npm install` e `npm run dev`.

## Verificação

- `npm run lint`
- `npm run build`
