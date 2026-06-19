import { prisma } from "./prisma";
import { FORMATIONS, DEFAULT_FORMATION, nextNoon } from "./game";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type PlayerScout = {
  jogou: boolean;
  gols: number;
  assist: number;
  amarelo: boolean;
  vermelho: boolean;
  golContra: number;
  penPerd: number;
  penDef: number;
  defesas: number;
  motm: boolean;
};

export type TeamScout = {
  golsPro: number;
  golsSofridos: number;
  classificou: boolean;
};

export async function pointsMap(): Promise<Record<string, number>> {
  const rules = await prisma.scoringRule.findMany({
    where: { codigo: { not: null } },
  });
  const m: Record<string, number> = {};
  for (const r of rules) if (r.codigo) m[r.codigo] = r.pontos;
  return m;
}

export function scorePlayer(
  pts: Record<string, number>,
  posicao: string,
  s: PlayerScout,
  teamGolsSofridos: number
): number {
  if (!s.jogou) return 0;
  let p = pts.jogou ?? 0;
  p += s.gols * (pts["gol_" + posicao] ?? 0);
  p += s.assist * (pts.assist ?? 0);
  if (s.motm) p += pts.motm ?? 0;
  if (s.amarelo) p += pts.amarelo ?? 0;
  if (s.vermelho) p += pts.vermelho ?? 0;
  p += s.golContra * (pts.gol_contra ?? 0);
  p += s.penPerd * (pts.pen_perd ?? 0);
  if (posicao === "GOL") {
    p += s.defesas * (pts.def ?? 0);
    p += s.penDef * (pts.pen_def ?? 0);
    p += teamGolsSofridos * (pts.gs_gk ?? 0);
  }
  if (teamGolsSofridos === 0) {
    const cs = pts["cs_" + posicao];
    if (cs) p += cs;
  }
  return round1(p);
}

export function scoreCoach(
  pts: Record<string, number>,
  t: TeamScout
): number {
  let p = 0;
  if (t.golsPro > t.golsSofridos) p += pts.tec_vitoria ?? 0;
  else if (t.golsPro === t.golsSofridos) p += pts.tec_empate ?? 0;
  else p += pts.tec_derrota ?? 0;
  p += t.golsPro * (pts.tec_gol_pro ?? 0);
  p += t.golsSofridos * (pts.tec_gol_sofrido ?? 0);
  if (t.golsSofridos === 0) p += pts.tec_cs ?? 0;
  if (t.classificou) p += pts.tec_classificou ?? 0;
  return round1(p);
}

// Apura a rodada: calcula pontos de jogadores e técnicos, soma por usuário
// (somente times completos pontuam), converte em créditos e abre a próxima rodada.
export async function scoreRound(roundId: number) {
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round) throw new Error("Rodada não encontrada");
  if (round.isScored) return { already: true as const };

  const pts = await pointsMap();

  const teamStats = await prisma.teamRoundStat.findMany({ where: { roundId } });
  const teamBySel = new Map(teamStats.map((t) => [t.selecaoId, t]));

  const playerStats = await prisma.playerRoundStat.findMany({
    where: { roundId },
    include: { player: true },
  });
  for (const ps of playerStats) {
    const tGS = teamBySel.get(ps.player.selecaoId)?.golsSofridos ?? 0;
    const p = scorePlayer(pts, ps.player.posicao, ps, tGS);
    await prisma.playerRoundStat.update({
      where: { id: ps.id },
      data: { pontos: p },
    });
  }

  await prisma.coachRoundStat.deleteMany({ where: { roundId } });
  for (const t of teamStats) {
    const cp = scoreCoach(pts, t);
    const coaches = await prisma.coach.findMany({
      where: { selecaoId: t.selecaoId },
    });
    for (const c of coaches) {
      await prisma.coachRoundStat.create({
        data: { roundId, coachId: c.id, pontos: cp },
      });
    }
  }

  const playerPts = new Map<number, number>();
  for (const p of await prisma.playerRoundStat.findMany({ where: { roundId } }))
    playerPts.set(p.playerId, p.pontos);
  const coachPts = new Map<number, number>();
  for (const c of await prisma.coachRoundStat.findMany({ where: { roundId } }))
    coachPts.set(c.coachId, c.pontos);

  const users = await prisma.user.findMany({
    include: { players: { include: { player: true } }, coach: true },
  });
  for (const u of users) {
    const f = FORMATIONS[u.formation] ?? FORMATIONS[DEFAULT_FORMATION];
    const counts: Record<string, number> = {
      GOL: 0,
      ZAG: 0,
      LAT: 0,
      MEI: 0,
      ATA: 0,
    };
    for (const up of u.players) counts[up.player.posicao]++;
    const complete =
      counts.GOL === f.gol &&
      counts.ZAG === f.zag &&
      counts.LAT === f.lat &&
      counts.MEI === f.mei &&
      counts.ATA === f.ata &&
      !!u.coach;

    let total = 0;
    if (complete) {
      for (const up of u.players) total += playerPts.get(up.playerId) ?? 0;
      if (u.coach) total += coachPts.get(u.coach.coachId) ?? 0;
    }
    total = round1(total);

    await prisma.userRoundScore.upsert({
      where: { userId_roundId: { userId: u.id, roundId } },
      create: { userId: u.id, roundId, pontos: total },
      update: { pontos: total },
    });
    await prisma.user.update({
      where: { id: u.id },
      data: { credits: Math.max(0, round1(u.credits + total)) },
    });
  }

  await prisma.round.update({
    where: { id: roundId },
    data: { isScored: true, isOpen: false },
  });

  const next = await prisma.round.create({
    data: {
      numero: round.numero + 1,
      nome: `Rodada ${round.numero + 1}`,
      lockAt: nextNoon(),
    },
  });

  return { already: false as const, nextRound: next.numero };
}
