import data from "../data/eventos.json";
import { prisma } from "./prisma";

function normNome(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export type PlayerEvent = {
  gols?: number;
  assist?: number;
  amarelo?: boolean;
  vermelho?: boolean;
  golContra?: number;
  penPerd?: number;
  penDef?: number;
  defesas?: number;
  motm?: boolean;
};

export type TeamEvents = {
  golsPro: number;
  golsSofridos: number;
  classificou?: boolean;
  jogadores: Record<string, PlayerEvent>;
};

// { "AAAA-MM-DD": { "Seleção": TeamEvents } }
export type Eventos = Record<string, Record<string, TeamEvents>>;

export const eventos = data as Eventos;

export function datasComEventos(): string[] {
  return Object.keys(eventos).sort();
}

export function eventosDaData(date: string): Record<string, TeamEvents> | null {
  return eventos[date] ?? null;
}

// Aplica os eventos de uma data à rodada: TeamRoundStat (placar) + PlayerRoundStat
// (jogou=true + eventos), casando o jogador pelo nome (com fallback por sobrenome).
export async function aplicarEventos(
  roundId: number,
  date: string
): Promise<{ teams: number; players: number; semSelecao: string[] }> {
  const ev = eventosDaData(date);
  if (!ev) return { teams: 0, players: 0, semSelecao: [] };

  const selecoes = await prisma.selecao.findMany({
    select: { id: true, nome: true },
  });
  const idByNome = new Map(selecoes.map((s) => [s.nome, s.id]));

  let teams = 0;
  let players = 0;
  const semSelecao: string[] = [];

  for (const [selNome, te] of Object.entries(ev)) {
    const sid = idByNome.get(selNome);
    if (!sid) {
      semSelecao.push(selNome);
      continue;
    }
    await prisma.teamRoundStat.upsert({
      where: { roundId_selecaoId: { roundId, selecaoId: sid } },
      create: {
        roundId,
        selecaoId: sid,
        golsPro: te.golsPro,
        golsSofridos: te.golsSofridos,
        classificou: !!te.classificou,
      },
      update: {
        golsPro: te.golsPro,
        golsSofridos: te.golsSofridos,
        classificou: !!te.classificou,
      },
    });
    teams++;

    const ps = await prisma.player.findMany({ where: { selecaoId: sid } });
    const byNome = new Map(ps.map((p) => [normNome(p.nome), p]));
    const bySobrenome = new Map<string, (typeof ps)[number]>();
    for (const p of ps) {
      const toks = normNome(p.nome).split(" ");
      if (toks.length) bySobrenome.set(toks[toks.length - 1], p);
    }

    for (const [pNome, pe] of Object.entries(te.jogadores)) {
      const n = normNome(pNome);
      const p =
        byNome.get(n) || bySobrenome.get(n.split(" ").pop() ?? "") || null;
      if (!p) continue;
      const d = {
        jogou: true,
        gols: pe.gols ?? 0,
        assist: pe.assist ?? 0,
        amarelo: !!pe.amarelo,
        vermelho: !!pe.vermelho,
        golContra: pe.golContra ?? 0,
        penPerd: pe.penPerd ?? 0,
        penDef: pe.penDef ?? 0,
        defesas: pe.defesas ?? 0,
        motm: !!pe.motm,
      };
      await prisma.playerRoundStat.upsert({
        where: { roundId_playerId: { roundId, playerId: p.id } },
        create: { roundId, playerId: p.id, ...d },
        update: d,
      });
      players++;
    }
  }

  return { teams, players, semSelecao };
}
