import { prisma } from "./prisma";
import { nextNoon } from "./game";

export async function getActiveRound() {
  let round = await prisma.round.findFirst({ orderBy: { numero: "desc" } });
  if (!round) {
    round = await prisma.round.create({
      data: { numero: 1, nome: "Rodada 1", lockAt: nextNoon() },
    });
  }
  return round;
}

export function isLocked(
  round: { lockAt: Date },
  now: Date = new Date()
): boolean {
  return now.getTime() >= new Date(round.lockAt).getTime();
}
