# HL BET — Fase 1

Jogo de fantasy da Copa do Mundo (estilo Cartola): cada pessoa começa com um
orçamento, monta o time dentro do esquema tático escolhido, e a montagem fecha
às 12h. Esta é a Fase 1: cadastro, montagem de time e mercado de compra/venda.
O motor de pontuação por rodada entra na Fase 2.

## Publicar na internet

Veja o guia passo a passo em **[DEPLOY.md](DEPLOY.md)** (GitHub + Supabase + Vercel,
tudo grátis).

## Como rodar (na sua máquina)

O banco agora é Postgres. Você precisa de uma conexão no `.env`:

```bash
cd /Users/gustavoniella/copa-fantasy/web
cp .env.example .env       # e preencha DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL
```

Para o `DATABASE_URL` você tem duas opções:

- **Usar o banco do Supabase** (mesmo do deploy): cole a string da Session pooler.
- **Rodar um Postgres local** (sem instalar nada): num terminal à parte, deixe
  `npm run pg:local` rodando e use
  `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres"`.

Depois:

```bash
npm install        # só na primeira vez
npm run db:deploy  # cria as tabelas e importa os dados da Copa
npm run dev        # sobe o site
```

Abra http://localhost:3000 (ou a porta que aparecer). Cadastre-se com o e-mail
do `ADMIN_EMAIL` para ter acesso ao painel de admin.

## Estrutura

- `prisma/schema.prisma` — modelo do banco (Postgres, via adapter `@prisma/adapter-pg`).
- `src/lib/importGame.ts` — importa os dados da Copa (de `src/data/copa_data.json`),
  regras de pontuação e formações. Usado pelo `npm run seed` e pelo botão
  "Importar dados" do admin.
- `src/lib/game.ts` — regras puras (formações, preços, trava das 12h, campo).
- `src/lib/actions.ts` — comprar/vender/escalar/login (Server Actions).
- `src/app/time` — montagem do time (campo). `src/app/mercado` — mercado.
  `src/app/ranking` — classificação.

## Recarregar os dados

Para reimportar a planilha (ex.: depois de ajustar notas/preços), atualize
`prisma/seed-data/copa_data.json` e rode:

```bash
npm run seed         # reimporta jogadores/seleções/técnicos
# ou, para zerar tudo e recriar o banco:
npm run db:reset
```

## Fase 2 — pontuação (pronta)

- Painel de admin em `/admin` (visível só para o admin — definido por `ADMIN_EMAIL` no `.env`).
- Lançamento de eventos por seleção (gols, assistências, cartões, defesas, técnico).
- Motor de pontuação (`src/lib/scoring.ts`) que lê os valores da tabela de regras
  (mudar um número em `ScoringRule` muda a apuração), soma por usuário (só times
  completos pontuam) e abre a próxima rodada.
- Conversão **justa** de pontos em créditos (não é 1 ponto = 1 crédito): crédito
  base + desempenho comprimido por raiz quadrada + bônus de recuperação para quem
  está abaixo da média. Parâmetros editáveis na categoria `Conversão` de
  `ScoringRule` (`conv_base`, `conv_fator`, `conv_recuperacao`, `conv_teto`).
- Ranking com pontos reais e tela `/rodada` com o detalhe da rodada do usuário.

### Como apurar uma rodada

1. Entre como admin (`gustavo@teste.com`) e abra `/admin`.
2. Em "Lançar eventos", escolha cada seleção que jogou, preencha o placar e os
   eventos dos jogadores, e clique em "Salvar".
3. Clique em "Apurar agora": calcula os pontos, credita os times e abre a próxima
   rodada.

## O que ainda falta (Fase 3)

- Importação automática dos resultados (hoje é lançamento manual no admin).
- Histórico de rodadas mais completo e "time da rodada".
- Deploy (Vercel + Postgres) para os amigos acessarem pela internet.
