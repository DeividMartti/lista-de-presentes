# Lista de Presentes — Versão 2 Simplificada

Uma aplicação web moderna, elegante, responsiva e minimalista para gerenciar listas de presentes para quem está montando sua casa nova. Construída com **HTML5**, **CSS3** e **JavaScript Puro**, persistida com **Supabase** e 100% pronta para publicação no **GitHub Pages**.

---

## 📁 Estrutura de Arquivos

```text
versao-2/
├── index.html              # Página pública compartilhada com amigos e convidados
├── login/
│   └── index.html          # Página de login e Painel Administrativo integrado
├── css/
│   └── estilo.css          # Folha de estilos centralizada para ambas as páginas
├── js/
│   └── script.js           # Lógica JavaScript unificada (público e admin)
├── supabase-setup.sql      # Script SQL completo de tabelas, RLS e concorrência
└── imagens/
    ├── capa.jpg            # Imagem de destaque do novo lar
    └── presentes/          # Fotos reais dos presentes
        ├── panela-pressao.jpg
        ├── jogo-panelas.jpg
        ├── frigideira.jpg
        ├── pratos.jpg
        ├── copos.jpg
        ├── talheres.jpg
        └── liquidificador.jpg
```

---

## ✨ Recursos Implementados

### Área Pública (`versao-2/index.html`)
- **Apresentação Acolhedora:** Seção hero com fotografia, mensagem carinhosa e indicadores de presentes em tempo real.
- **Catálogo Inteligente:** Filtros por categoria (Cozinha, Quarto, Banheiro, etc.), busca instantânea e filtros por estado (Disponíveis / Já Escolhidos).
- **Reserva Segura sem Pagamentos:** Os convidados informam apenas o nome e WhatsApp com DDD. Sem complicação.
- **Proteção Contra Duplicidade:** Concorrência tratada com transação e índice de unicidade parcial no banco. Duas pessoas não conseguem reservar o mesmo presente.
- **Sem Recarregar a Página:** Atualização instantânea dos cartões e contadores após a reserva.
- **Privacidade Total:** Os dados pessoais (nome e WhatsApp) dos convidados nunca são expostos na página pública.

### Área Administrativa (`versao-2/login/index.html`)
- **Painel Integrado:** Login e painel na mesma página, sem dezenas de arquivos espalhados.
- **Acesso Inicial:** Usuário `admin` | Senha `admin` (com solicitação para alteração de senha).
- **Visão Geral / Dashboard:** Métricas de presentes cadastrados, disponíveis, reservados, percentual concluído e participantes únicos.
- **Gerenciamento de Presentes:** Cadastro, edição e exclusão de itens.
- **Galeria Local & URLs:** Opção de selecionar uma imagem que já existe no projeto ou colar um link externo, com prévia visual imediata.
- **Gestão de Reservas:** Visualização completa de quem escolheu cada presente, data, horário e mensagem de carinho.
- **Contato com 1 Clique:** Botão para abrir conversa no WhatsApp (`https://wa.me/55...`) com o convidado.
- **Cancelamento Lógico:** Ao cancelar uma reserva, o presente é automaticamente liberado para novas escolhas, preservando o histórico.
- **Personalização Dinâmica:** Altere títulos, textos, nomes dos anfitriões e capa diretamente pelo painel.

---

## 🚀 Como Publicar no GitHub Pages

1. Envie a pasta `versao-2` para o seu repositório no GitHub.
2. No seu repositório do GitHub, vá em **Settings** > **Pages**.
3. Em **Source**, selecione a branch principal (`main` ou `master`) e a pasta raiz (`/ (root)`).
4. Clique em **Save**.
5. O seu site estará disponível em:
   - **Página Pública:** `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/versao-2/`
   - **Painel Admin:** `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/versao-2/login/`

---

## 🗄️ Configuração do Supabase (Opcional para Nuvem)

O aplicativo funciona **imediatamente no modo de demonstração local** direto no navegador. Para conectar ao seu banco na nuvem:

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No menu lateral, acesse **SQL Editor**.
3. Copie todo o conteúdo do arquivo `supabase-setup.sql` e clique em **Run**.
4. Acesse **Project Settings** > **API** e copie a **Project URL** e a **anon public key**.
5. No painel administrativo do seu site (`/versao-2/login/`), acesse a aba **Supabase & SQL** e cole as chaves.
6. Pronto! Seus dados agora estão sincronizados em tempo real na nuvem.
