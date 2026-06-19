# Como publicar o HL BET na internet

Você vai usar 3 serviços, todos **gratuitos**. A boa notícia: você cria a conta
do **GitHub** e entra nos outros dois clicando em "Entrar com GitHub".

| Serviço | Pra quê |
|---|---|
| GitHub | guarda o código |
| Supabase | o banco de dados (guarda usuários, times, pontos) |
| Vercel | roda o site |

O código já está pronto e "commitado" na pasta `~/copa-fantasy/web`. Os passos
abaixo são só de criar contas e clicar. Tempo estimado: ~20 minutos.

---

## Passo 1 — GitHub (guardar o código)

A forma mais fácil, sem terminal, é com o **GitHub Desktop**:

1. Crie uma conta em https://github.com (use seu e-mail).
2. Baixe e instale o **GitHub Desktop**: https://desktop.github.com
3. Abra o GitHub Desktop e entre com sua conta do GitHub.
4. Menu **File → Add local repository** e selecione a pasta:
   `/Users/gustavoniella/copa-fantasy/web`
5. Clique em **Publish repository**. Marque **"Keep this code private"** e publique.

Pronto: seu código está no GitHub, num repositório privado (ex.: `web` ou
renomeie para `hl-bet`).

---

## Passo 2 — Supabase (o banco de dados)

1. Acesse https://supabase.com e clique em **"Sign in with GitHub"**.
2. Clique em **New project**:
   - **Name**: `hl-bet`
   - **Database Password**: crie uma senha forte e **ANOTE** (vai precisar dela).
   - **Region**: escolha **South America (São Paulo)**.
   - Clique em **Create new project** e espere ~2 minutos.
3. Pegue a string de conexão certa (importante!):
   - No projeto, clique em **Connect** (botão no topo).
   - Procure a aba/opção **"Session pooler"**.
   - Copie a string que aparece. Ela tem este formato:
     `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
   - Troque `[YOUR-PASSWORD]` pela senha que você anotou no passo 2.

   > Use a **Session pooler** (porta **5432**), não a "Direct connection". A
   > Vercel não conversa com a conexão direta — a Session pooler é a que funciona.

Guarde essa string final (com a senha) — você vai colá-la na Vercel no próximo passo.

---

## Passo 3 — Vercel (publicar o site)

1. Acesse https://vercel.com e clique em **"Continue with GitHub"**.
2. Clique em **Add New… → Project** e **importe** o repositório `hl-bet`
   (autorize a Vercel a ver seus repositórios, se pedir).
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione estas três
   (nome → valor):

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | a string da Session pooler do Passo 2 (com a senha) |
   | `SESSION_SECRET` | `df91c6b73fc5aabdc74bd04c052a83a76d3f0c9f8b3e8564e8dea15c223c972281b89dd8` |
   | `ADMIN_EMAIL` | o e-mail que será o **admin** (ex.: o seu) |

4. Clique em **Deploy** e aguarde alguns minutos. A própria publicação já cria as
   tabelas do banco automaticamente.
5. Ao terminar, a Vercel te dá um endereço tipo `https://hl-bet.vercel.app`.

---

## Passo 4 — Ligar o jogo (uma vez só)

1. Abra o endereço da Vercel e clique em **Criar conta**. Cadastre-se com o
   **mesmo e-mail** que você pôs em `ADMIN_EMAIL` — assim você vira admin.
2. No menu, clique em **Admin** → botão **"Importar dados"**. Isso carrega as 48
   seleções, 1.246 jogadores e 48 técnicos da Copa.
3. Pronto! Mande o link pros amigos: cada um cria a conta e monta o time.

---

## Como apurar uma rodada (depois dos jogos)

1. Entre como admin → menu **Admin**.
2. Em "Lançar eventos", escolha cada seleção que jogou, preencha o placar e os
   eventos dos jogadores, e **Salvar**.
3. Quando lançar todas, clique em **"Apurar agora"** — pontua todo mundo, credita
   os times e abre a próxima rodada.

## Atualizar o site depois

Se a gente mudar algo no código, é só abrir o **GitHub Desktop**, clicar em
**Commit** e **Push**. A Vercel publica a nova versão sozinha em ~2 minutos.

## Se algo der errado

- **Erro de conexão com o banco**: confirme que usou a string da **Session pooler**
  (porta 5432) e que trocou `[YOUR-PASSWORD]` pela sua senha real.
- **Não aparece o menu Admin**: confirme que se cadastrou com o mesmo e-mail do
  `ADMIN_EMAIL` (sem espaços, tudo minúsculo).
- **Site no ar mas sem jogadores**: faça o Passo 4.2 (botão "Importar dados").
