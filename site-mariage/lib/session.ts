import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { env } from "./env";

const ADMIN_COOKIE = "mariage_admin";
const ANSWERED_COOKIE = "mariage_reponse";
const WEEK = 60 * 60 * 24 * 7;

function sign(value: string): string {
  return createHmac("sha256", env.sessionSecret).update(value).digest("hex");
}

function pack(value: string): string {
  return `${value}.${sign(value)}`;
}

function unpack(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const value = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(value);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return value;
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// ---- Admin (mariés) ----
export async function setAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, pack("admin:" + Date.now()), { ...cookieOpts, maxAge: WEEK });
}

export async function isAdmin(): Promise<boolean> {
  const v = unpack((await cookies()).get(ADMIN_COOKIE)?.value);
  return !!v && v.startsWith("admin:");
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

// ---- Invité : mémorise la réponse envoyée depuis cet appareil ----
export async function setAnsweredCookie(responseId: string) {
  (await cookies()).set(ANSWERED_COOKIE, pack(responseId), { ...cookieOpts, maxAge: WEEK * 52 });
}

export async function getAnsweredResponseId(): Promise<string | null> {
  return unpack((await cookies()).get(ANSWERED_COOKIE)?.value);
}
