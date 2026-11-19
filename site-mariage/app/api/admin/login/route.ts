import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { safeEqual, setAdminSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password ?? "");
  if (!password || !safeEqual(password, env.adminPassword)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
