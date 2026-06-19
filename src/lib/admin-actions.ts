"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getAdmin } from "./auth";
import { scoreRound } from "./scoring";
import { importGameData } from "./importGame";

export async function runImport() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  await importGameData({ force: false });
  revalidatePath("/admin");
  redirect("/admin?importado=1");
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
