import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-troque"
);
const COOKIE = "cf_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

export async function getUserId(): Promise<string | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.uid as string) ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const uid = await getUserId();
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export function isAdminUser(user: { isAdmin: boolean; email: string }): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return user.isAdmin || (!!adminEmail && user.email.toLowerCase() === adminEmail);
}

export async function getAdmin() {
  const u = await getCurrentUser();
  if (!u) return null;
  return isAdminUser(u) ? u : null;
}
