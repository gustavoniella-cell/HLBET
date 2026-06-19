"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  getCurrentUser,
  createSession,
  destroySession,
} from "./auth";
import { getActiveRound, isLocked } from "./round";
import { FORMATIONS, reqFor, STARTING_CREDITS } from "./game";

function refreshGame() {
  revalidatePath("/time");
  revalidatePath("/mercado");
  revalidatePath("/ranking");
}

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 4) {
    redirect("/registrar?erro=dados");
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    redirect("/registrar?erro=email");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, credits: STARTING_CREDITS },
  });
  await createSession(user.id);
  redirect("/time");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?erro=1");
  }
  await createSession(user.id);
  redirect("/time");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function setFormation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const formation = String(formData.get("formation") ?? "");
  if (!(formation in FORMATIONS)) return;
  await prisma.user.update({
    where: { id: user.id },
    data: { formation },
  });
  refreshGame();
}

export async function buyPlayer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const round = await getActiveRound();
  if (isLocked(round)) return;

  const playerId = Number(formData.get("playerId"));
  if (!playerId) return;
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return;

  const already = await prisma.userPlayer.findUnique({
    where: { userId_playerId: { userId: user.id, playerId } },
  });
  if (already) return;

  const req = reqFor(user.formation, player.posicao);
  const have = await prisma.userPlayer.count({
    where: { userId: user.id, player: { posicao: player.posicao } },
  });
  if (have >= req) return;
  if (user.credits < player.preco) return;

  await prisma.$transaction([
    prisma.userPlayer.create({ data: { userId: user.id, playerId } }),
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: player.preco } },
    }),
  ]);
  refreshGame();
}

export async function sellPlayer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const round = await getActiveRound();
  if (isLocked(round)) return;

  const playerId = Number(formData.get("playerId"));
  if (!playerId) return;
  const up = await prisma.userPlayer.findUnique({
    where: { userId_playerId: { userId: user.id, playerId } },
    include: { player: true },
  });
  if (!up) return;

  await prisma.$transaction([
    prisma.userPlayer.delete({ where: { id: up.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: up.player.preco } },
    }),
  ]);
  refreshGame();
}

export async function buyCoach(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const round = await getActiveRound();
  if (isLocked(round)) return;

  const coachId = Number(formData.get("coachId"));
  if (!coachId) return;
  const coach = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!coach) return;

  const existing = await prisma.userCoach.findUnique({
    where: { userId: user.id },
  });
  if (existing) return;
  if (user.credits < coach.preco) return;

  await prisma.$transaction([
    prisma.userCoach.create({ data: { userId: user.id, coachId } }),
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: coach.preco } },
    }),
  ]);
  refreshGame();
}

export async function sellCoach() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const round = await getActiveRound();
  if (isLocked(round)) return;

  const uc = await prisma.userCoach.findUnique({
    where: { userId: user.id },
    include: { coach: true },
  });
  if (!uc) return;

  await prisma.$transaction([
    prisma.userCoach.delete({ where: { id: uc.id } }),
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: uc.coach.preco } },
    }),
  ]);
  refreshGame();
}
