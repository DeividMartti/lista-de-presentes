<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Lista de presentes

Aplicação de lista de presentes com painel administrativo e integração opcional com Supabase.

## Executar localmente

1. Instale o Node.js.
2. Instale as dependências: `npm install`
3. Copie `.env.example` para `.env` e preencha as variáveis. Não envie o arquivo `.env` ao GitHub.
4. Inicie o servidor: `npm run dev`

O login administrativo só é habilitado quando `ADMIN_USERNAME` e `ADMIN_PASSWORD` estão configurados. Use uma senha exclusiva com pelo menos 12 caracteres. O servidor armazena somente o hash da senha.

## Configuração do Supabase

1. Execute `supabase-setup.sql` no SQL Editor do projeto Supabase.
2. Configure `SUPABASE_URL` e `SUPABASE_ANON_KEY` para a leitura pública do catálogo e das configurações.
3. Configure `SUPABASE_SERVICE_ROLE_KEY` como segredo **somente no servidor** para as gravações administrativas. Nunca a coloque no código do navegador nem em arquivos versionados.

O SQL remove as permissões antigas e a coluna `profiles.password`, que armazenava senhas em texto simples. O acesso anônimo pode ler catálogo/configurações e inserir reservas; não pode listar reservas nem modificar presentes, usuários ou configurações.

Se as credenciais padrão `admin/admin` já foram usadas ou publicadas, troque-as e execute a migração SQL no Supabase. A atualização não substitui a execução dessa migração no banco remoto.

## Verificação

- `npm run lint`
- `npm run build`
