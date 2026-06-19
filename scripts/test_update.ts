import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { updateGameData } from "../src/lib/importGame";

async function main() {
  // usuário de teste com um pequeno time (simula time já montado)
  const user = await prisma.user.upsert({
    where: { email: "teste-update@x.com" },
    create: {
      email: "teste-update@x.com",
      name: "Teste",
      passwordHash: await bcrypt.hash("1234", 10),
    },
    update: {},
  });
  const brasil = await prisma.selecao.findUniqueOrThrow({
    where: { nome: "Brasil" },
  });
  const ps = await prisma.player.findMany({
    where: { selecaoId: brasil.id },
    take: 3,
  });
  await prisma.userPlayer.deleteMany({ where: { userId: user.id } });
  for (const p of ps)
    await prisma.userPlayer.create({
      data: { userId: user.id, playerId: p.id },
    });

  const antesTime = await prisma.userPlayer.count({ where: { userId: user.id } });
  const totalAntes = await prisma.player.count();
  const messiAntes = await prisma.player.findFirst({
    where: { nome: "Lionel Messi" },
  });

  console.log("ANTES -> time do usuário:", antesTime, "| jogadores:", totalAntes,
    "| Messi preço:", messiAntes?.preco);

  const r = await updateGameData();
  console.log("updateGameData:", r);

  const depoisTime = await prisma.userPlayer.count({ where: { userId: user.id } });
  const totalDepois = await prisma.player.count();
  const messi = await prisma.player.findFirst({ where: { nome: "Lionel Messi" } });
  const wood = await prisma.player.findFirst({ where: { nome: "Chris Wood" } });
  const precos = await prisma.player.findMany({ select: { preco: true } });
  const min = Math.min(...precos.map((p) => p.preco));
  const max = Math.max(...precos.map((p) => p.preco));
  const a25 = await prisma.player.count({ where: { preco: 25 } });

  console.log("DEPOIS -> time do usuário:", depoisTime, "(deve continuar", antesTime + ")",
    "| jogadores:", totalDepois);
  console.log("Messi preço:", messi?.preco, "| Chris Wood preço:", wood?.preco);
  console.log("faixa de preços:", min, "a", max, "| jogadores a 25:", a25);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
