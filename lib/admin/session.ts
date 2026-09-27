import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const ADMIN_COOKIE = "alunsina_admin";
export const SESSION_SECONDS = 12 * 60 * 60;
export const cookieOptions = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: SESSION_SECONDS };
const digest = (s: string) => createHash("sha256").update(s).digest();
export function passwordMatches(password: string): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD)));
}
export function createSession(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${randomBytes(24).toString("hex")}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
export function validSession(token?: string): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expires = Number(parts[0]);
  if (expires <= Date.now() || expires > Date.now() + SESSION_SECONDS * 1000) return false;
  return timingSafeEqual(Buffer.from(parts[2], "hex"), createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest());
}
export async function assertAdminSession(): Promise<void> {
  if (!validSession((await cookies()).get(ADMIN_COOKIE)?.value)) throw new Error("Unauthorized admin session");
}
const attempts = new Map<string, { count: number; until: number }>();
/** Counts all attempts (including successful ones); first five are allowed. */
export function takeLoginAttempt(ip: string): boolean {
  const now = Date.now();
  for (const [key, row] of attempts) if (row.until <= now) attempts.delete(key);
  const row = attempts.get(ip) ?? { count: 0, until: now + 15 * 60_000 };
  attempts.set(ip, row);
  if (row.count >= 5) return false;
  row.count++;
  return true;
}
