# HL BET — Fase 1

Jogo de fantasy da Copa do Mundo (estilo Cartola): cada pessoa começa com um
orçamento, monta o time dentro do esquema tático escolhido, e a montagem fecha
às 12h. Esta é a Fase 1: cadastro, montagem de time e mercado de compra/venda.
O motor de pontuação por rodada entra na Fase 2.

## Como rodar (na sua máquina)

```bash
cd /Users/gustavoniella/copa-fantasy/web
npm install        # só na primeira vez
npm run dev        # sobe o site
```

Abra http://localhost:3000 (ou a porta que aparecer no terminal).

> Conta de teste já criada: **gustavo@teste.com** / senha **1234**.
> Ou clique em "Criar conta" para começar do zero.

## Estrutura

- `prisma/schema.prisma` — modelo do banco (SQLite, arquivo `prisma/dev.db`).
- `prisma/seed.ts` — importa os dados da Copa de `prisma/seed-data/copa_data.json`
  (gerado a partir da planilha) + regras de pontuação + formações.
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
  completos pontuam), converte pontos em créditos e abre a próxima rodada.
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
