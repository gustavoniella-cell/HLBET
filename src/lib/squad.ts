import { prisma } from "./prisma";
import { FORMATIONS, DEFAULT_FORMATION, POSICOES, type Posicao } from "./game";

export async function getSquadView(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const ups = await prisma.userPlayer.findMany({
    where: { userId },
    include: { player: { include: { selecao: true } } },
    orderBy: { player: { nota: "desc" } },
  });
  const uc = await prisma.userCoach.findUnique({
    where: { userId },
    include: { coach: { include: { selecao: true } } },
  });

  const owned = ups.map((u) => u.player);
  const formationName =
    user.formation in FORMATIONS ? user.formation : DEFAULT_FORMATION;
  const f = FORMATIONS[formationName];

  const byPos: Record<Posicao, typeof owned> = {
    GOL: [],
    ZAG: [],
    LAT: [],
    MEI: [],
    ATA: [],
  };
  for (const p of owned) {
    if (p.posicao in byPos) byPos[p.posicao as Posicao].push(p);
  }

  const req: Record<Posicao, number> = {
    GOL: f.gol,
    ZAG: f.zag,
    LAT: f.lat,
    MEI: f.mei,
    ATA: f.ata,
  };

  const coach = uc?.coach ?? null;
  const validStarters = POSICOES.reduce(
    (s, pos) => s + Math.min(byPos[pos].length, req[pos]),
    0
  );
  const filled = validStarters + (coach ? 1 : 0);
  const complete =
    POSICOES.every((pos) => byPos[pos].length === req[pos]) && !!coach;

  const ownedValue =
    owned.reduce((s, p) => s + p.preco, 0) + (coach ? coach.preco : 0);
  const patrimonio = user.credits + ownedValue;

  return {
    user,
    formationName,
    f,
    owned,
    byPos,
    req,
    coach,
    filled,
    totalSlots: 12,
    complete,
    patrimonio,
    credits: user.credits,
  };
}

export type SquadView = NonNullable<Awaited<ReturnType<typeof getSquadView>>>;
