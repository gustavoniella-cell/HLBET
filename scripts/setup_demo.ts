import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const NEED: [string, number][] = [
  ["GOL", 1],
  ["ZAG", 2],
  ["LAT", 2],
  ["MEI", 3],
  ["ATA", 3],
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "gustavo@teste.com").toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("usuário não encontrado: " + email);

  const brasil = await prisma.selecao.findUnique({ where: { nome: "Brasil" } });
  if (!brasil) throw new Error("Brasil não encontrado");

  await prisma.userPlayer.deleteMany({ where: { userId: user.id } });
  await prisma.userCoach.deleteMany({ where: { userId: user.id } });

  const chosen: { id: number; nome: string; posicao: string; preco: number }[] = [];
  for (const [pos, n] of NEED) {
    const ps = await prisma.player.findMany({
      where: { selecaoId: brasil.id, posicao: pos },
      orderBy: { nota: "desc" },
      take: n,
    });
    if (ps.length < n)
      throw new Error(`Brasil tem só ${ps.length} ${pos}, precisa de ${n}`);
    chosen.push(...ps);
  }

  const coach = await prisma.coach.findFirst({ where: { selecaoId: brasil.id } });
  if (!coach) throw new Error("técnico do Brasil não encontrado");

  for (const p of chosen) {
    await prisma.userPlayer.create({
      data: { userId: user.id, playerId: p.id },
    });
  }
  await prisma.userCoach.create({
    data: { userId: user.id, coachId: coach.id },
  });

  const cost = chosen.reduce((s, p) => s + p.preco, 0) + coach.preco;
  await prisma.user.update({
    where: { id: user.id },
    data: { formation: "4-3-3", credits: Math.round((120 - cost) * 10) / 10 },
  });

  const round = await prisma.round.findFirst({ orderBy: { numero: "desc" } });

  console.log("== TIME MONTADO (Brasil, 4-3-3) ==");
  for (const p of chosen)
    console.log(`${p.posicao}\t${p.id}\t${p.nome}\t${p.preco}`);
  console.log(`TEC\t${coach.id}\t${coach.nome}\t${coach.preco}`);
  console.log("custo total:", Math.round(cost * 10) / 10);
  console.log("BRASIL selecaoId:", brasil.id);
  console.log("ACTIVE roundId:", round?.id, "numero:", round?.numero);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
