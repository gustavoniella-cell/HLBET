import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const round = await prisma.round.findFirstOrThrow({ orderBy: { numero: "desc" } });
  const a = await prisma.selecao.findUniqueOrThrow({ where: { nome: "Brasil" } });
  const b = await prisma.selecao.findUniqueOrThrow({ where: { nome: "Marrocos" } });
  await prisma.match.deleteMany({ where: { roundId: round.id } });
  await prisma.match.create({
    data: { roundId: round.id, selecaoAId: a.id, selecaoBId: b.id, horario: "16h" },
  });
  await prisma.match.create({
    data: { roundId: round.id, selecaoAId: a.id, selecaoBId: b.id, horario: "19h" },
  });
  const matches = await prisma.match.findMany({
    where: { roundId: round.id },
    include: { selecaoA: true, selecaoB: true },
    orderBy: { id: "asc" },
  });
  console.log("rodada:", round.nome);
  console.log(
    "jogos:",
    matches.map((m) => `${m.selecaoA.nome} x ${m.selecaoB.nome} (${m.horario})`)
  );
  await prisma.match.deleteMany({ where: { id: matches[0].id } });
  console.log("após remover 1:", await prisma.match.count({ where: { roundId: round.id } }));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
