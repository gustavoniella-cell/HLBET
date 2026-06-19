import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const round = await prisma.round.findFirstOrThrow({ orderBy: { numero: "desc" } });
  const bra = await prisma.selecao.findUniqueOrThrow({ where: { nome: "Brasil" } });
  const mar = await prisma.selecao.findUniqueOrThrow({ where: { nome: "Marrocos" } });
  await prisma.match.deleteMany({ where: { roundId: round.id } });
  await prisma.match.create({
    data: { roundId: round.id, selecaoAId: bra.id, selecaoBId: mar.id },
  });

  const dayMatches = await prisma.match.findMany({
    where: { roundId: round.id },
    select: { selecaoAId: true, selecaoBId: true },
  });
  const playingIds = [
    ...new Set(dayMatches.flatMap((m) => [m.selecaoAId, m.selecaoBId])),
  ];
  const players = await prisma.player.findMany({
    where: { selecaoId: { in: playingIds } },
    include: { selecao: true },
    take: 300,
  });
  const sels = [...new Set(players.map((p) => p.selecao.nome))].sort();
  console.log("jogos do dia: Brasil x Marrocos");
  console.log(
    "jogadores retornados:",
    players.length,
    "| seleções no resultado:",
    sels
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
