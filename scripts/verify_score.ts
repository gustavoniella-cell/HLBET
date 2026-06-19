import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { scoreRound } from "../src/lib/scoring";

const NEED: [string, number][] = [
  ["GOL", 1],
  ["ZAG", 2],
  ["LAT", 2],
  ["MEI", 3],
  ["ATA", 3],
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "gustavo@teste.com").toLowerCase();
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Gustavo FC",
      passwordHash: await bcrypt.hash("1234", 10),
      isAdmin: true,
    },
    update: {},
  });
  const brasil = await prisma.selecao.findUniqueOrThrow({
    where: { nome: "Brasil" },
  });
  const round = await prisma.round.findFirstOrThrow({
    orderBy: { numero: "desc" },
  });

  await prisma.userPlayer.deleteMany({ where: { userId: user.id } });
  await prisma.userCoach.deleteMany({ where: { userId: user.id } });

  const chosen: { id: number; nome: string; posicao: string }[] = [];
  for (const [pos, n] of NEED) {
    const ps = await prisma.player.findMany({
      where: { selecaoId: brasil.id, posicao: pos },
      orderBy: { nota: "desc" },
      take: n,
    });
    chosen.push(...ps);
  }
  const coach = await prisma.coach.findFirstOrThrow({
    where: { selecaoId: brasil.id },
  });
  for (const p of chosen)
    await prisma.userPlayer.create({
      data: { userId: user.id, playerId: p.id },
    });
  await prisma.userCoach.create({ data: { userId: user.id, coachId: coach.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: { formation: "4-3-3", credits: 120 },
  });

  const gk = chosen.find((p) => p.posicao === "GOL")!;
  const ata = chosen.find((p) => p.posicao === "ATA")!;
  const zag = chosen.find((p) => p.posicao === "ZAG")!;

  await prisma.teamRoundStat.upsert({
    where: { roundId_selecaoId: { roundId: round.id, selecaoId: brasil.id } },
    create: {
      roundId: round.id,
      selecaoId: brasil.id,
      golsPro: 3,
      golsSofridos: 0,
    },
    update: { golsPro: 3, golsSofridos: 0 },
  });
  await prisma.playerRoundStat.deleteMany({ where: { roundId: round.id } });
  await prisma.playerRoundStat.create({
    data: { roundId: round.id, playerId: gk.id, jogou: true, defesas: 4 },
  });
  await prisma.playerRoundStat.create({
    data: { roundId: round.id, playerId: ata.id, jogou: true, gols: 1, motm: true },
  });
  await prisma.playerRoundStat.create({
    data: { roundId: round.id, playerId: zag.id, jogou: true },
  });

  const res = await scoreRound(round.id);
  const score = await prisma.userRoundScore.findFirst({
    where: { userId: user.id, roundId: round.id },
  });
  const u2 = await prisma.user.findUnique({ where: { id: user.id } });

  console.log("scoreRound:", res);
  console.log(`GK=${gk.nome}  ATA=${ata.nome}  ZAG=${zag.nome}`);
  console.log(
    `USER pontos da rodada: ${score?.pontos} | créditos agora: ${u2?.credits}` +
      ` | esperado: 42 pts / 126.3 créditos (120 + 15% de 42 = 6.3)`
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
