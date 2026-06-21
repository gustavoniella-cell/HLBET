"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getAdmin } from "./auth";
import { scoreRound } from "./scoring";
import { importGameData, updateGameData } from "./importGame";
import { jogosDaData } from "./calendario";
import { aplicarEventos } from "./eventos";
import { STARTING_CREDITS } from "./game";

// Lança automaticamente todos os eventos de uma data na rodada atual.
export async function lancarEventos(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const roundId = Number(formData.get("roundId"));
  const date = String(formData.get("date") ?? "");
  if (!roundId || !date) return;
  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round || round.isScored) return;
  await aplicarEventos(roundId, date);
  revalidatePath("/admin");
  revalidatePath("/time");
  revalidatePath("/ranking");
  redirect("/admin?eventos=1");
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

// Reaplica o orçamento inicial a TODOS os usuários: créditos = orçamento - valor
// do time já montado. Útil ao mudar o STARTING_CREDITS depois do lançamento.
export async function resetBudgets() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const users = await prisma.user.findMany({
    include: {
      players: { include: { player: true } },
      coach: { include: { coach: true } },
    },
  });
  for (const u of users) {
    const owned =
      u.players.reduce((s, up) => s + up.player.preco, 0) +
      (u.coach ? u.coach.coach.preco : 0);
    await prisma.user.update({
      where: { id: u.id },
      data: { credits: Math.max(0, round1(STARTING_CREDITS - owned)) },
    });
  }
  revalidatePath("/admin");
  revalidatePath("/time");
  redirect("/admin?orcamento=1");
}

export async function runImport() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  await importGameData({ force: false });
  revalidatePath("/admin");
  redirect("/admin?importado=1");
}

export async function runUpdate() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  await updateGameData();
  revalidatePath("/admin");
  revalidatePath("/mercado");
  revalidatePath("/time");
  redirect("/admin?atualizado=1");
}

function num(fd: FormData, key: string): number {
  const v = Number(fd.get(key));
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}
function chk(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}

export async function saveTeamScouts(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");

  const roundId = Number(formData.get("roundId"));
  const selecaoId = Number(formData.get("selecaoId"));
  if (!roundId || !selecaoId) return;

  const round = await prisma.round.findUnique({ where: { id: roundId } });
  if (!round || round.isScored) return;

  await prisma.teamRoundStat.upsert({
    where: { roundId_selecaoId: { roundId, selecaoId } },
    create: {
      roundId,
      selecaoId,
      golsPro: num(formData, "golsPro"),
      golsSofridos: num(formData, "golsSofridos"),
      classificou: chk(formData, "classificou"),
    },
    update: {
      golsPro: num(formData, "golsPro"),
      golsSofridos: num(formData, "golsSofridos"),
      classificou: chk(formData, "classificou"),
    },
  });

  const players = await prisma.player.findMany({ where: { selecaoId } });
  for (const p of players) {
    const data = {
      jogou: chk(formData, `j_${p.id}`),
      gols: num(formData, `g_${p.id}`),
      assist: num(formData, `a_${p.id}`),
      amarelo: chk(formData, `ca_${p.id}`),
      vermelho: chk(formData, `cv_${p.id}`),
      golContra: num(formData, `gc_${p.id}`),
      penPerd: num(formData, `pp_${p.id}`),
      penDef: num(formData, `pd_${p.id}`),
      defesas: num(formData, `def_${p.id}`),
      motm: chk(formData, `m_${p.id}`),
    };
    const hasAny =
      data.jogou ||
      data.gols ||
      data.assist ||
      data.amarelo ||
      data.vermelho ||
      data.golContra ||
      data.penPerd ||
      data.penDef ||
      data.defesas ||
      data.motm;
    if (hasAny) {
      await prisma.playerRoundStat.upsert({
        where: { roundId_playerId: { roundId, playerId: p.id } },
        create: { roundId, playerId: p.id, ...data },
        update: data,
      });
    } else {
      await prisma.playerRoundStat.deleteMany({
        where: { roundId, playerId: p.id },
      });
    }
  }

  revalidatePath(`/admin/rodada/${roundId}`);
  redirect(`/admin/rodada/${roundId}?sel=${selecaoId}&ok=1`);
}

export async function addMatch(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const roundId = Number(formData.get("roundId"));
  const a = Number(formData.get("selA"));
  const b = Number(formData.get("selB"));
  const horario = String(formData.get("horario") ?? "").trim() || null;
  if (!roundId || !a || !b || a === b) return;
  await prisma.match.create({
    data: { roundId, selecaoAId: a, selecaoBId: b, horario },
  });
  revalidatePath("/admin");
  revalidatePath("/time");
  redirect("/admin");
}

export async function removeMatch(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const id = Number(formData.get("matchId"));
  if (!id) return;
  await prisma.match.deleteMany({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/time");
  redirect("/admin");
}

// Carrega os jogos de uma data do calendário oficial para a rodada atual.
export async function loadDayMatches(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const roundId = Number(formData.get("roundId"));
  const date = String(formData.get("date") ?? "");
  if (!roundId || !date) return;
  const jogos = jogosDaData(date);
  if (!jogos.length) return;

  const selecoes = await prisma.selecao.findMany({
    select: { id: true, nome: true },
  });
  const idByNome = new Map(selecoes.map((s) => [s.nome, s.id]));

  await prisma.match.deleteMany({ where: { roundId } });
  for (const j of jogos) {
    const a = idByNome.get(j.teamA);
    const b = idByNome.get(j.teamB);
    if (a && b) {
      await prisma.match.create({
        data: { roundId, selecaoAId: a, selecaoBId: b, horario: j.hora },
      });
    }
  }
  revalidatePath("/admin");
  revalidatePath("/time");
  redirect("/admin?jogos=1");
}

export async function apurarRound(formData: FormData) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const roundId = Number(formData.get("roundId"));
  if (!roundId) return;
  await scoreRound(roundId);
  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/time");
  redirect("/admin?apurado=1");
}
