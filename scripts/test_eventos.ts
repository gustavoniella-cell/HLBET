import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { aplicarEventos } from "../src/lib/eventos";
import { scoreRound } from "../src/lib/scoring";

async function main() {
  const round = await prisma.round.findFirstOrThrow({
    orderBy: { numero: "desc" },
  });
  await prisma.playerRoundStat.deleteMany({ where: { roundId: round.id } });
  await prisma.teamRoundStat.deleteMany({ where: { roundId: round.id } });
  await prisma.coachRoundStat.deleteMany({ where: { roundId: round.id } });

  const r = await aplicarEventos(round.id, "2026-06-20");
  console.log("aplicarEventos:", r);

  await scoreRound(round.id);

  const names = [
    "Cody Gakpo",
    "Brian Brobbey",
    "Eloy Room",
    "Deniz Undav",
    "Hernán Galíndez",
    "Ayase Ueda",
    "Virgil van Dijk",
  ];
  console.log("--- pontuação de jogadores ---");
  for (const nm of names) {
    const p = await prisma.player.findFirst({ where: { nome: nm } });
    if (!p) {
      console.log(`${nm} -> NÃO ENCONTRADO no banco`);
      continue;
    }
    const st = await prisma.playerRoundStat.findFirst({
      where: { roundId: round.id, playerId: p.id },
    });
    console.log(`${nm} (${p.posicao}) -> ${st ? st.pontos : "sem stat"} pts`);
  }

  const coachStats = await prisma.coachRoundStat.findMany({
    where: { roundId: round.id },
    include: { coach: { include: { selecao: true } } },
  });
  console.log("--- técnicos ---");
  for (const c of coachStats)
    console.log(`${c.coach.selecao.nome}: ${c.pontos} pts`);

  const totalStats = await prisma.playerRoundStat.count({
    where: { roundId: round.id },
  });
  console.log(`\ntotal de lançamentos de jogador: ${totalStats}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
