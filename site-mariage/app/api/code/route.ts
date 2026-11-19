import { NextResponse } from "next/server";
import { findHouseholdByCode } from "@/lib/households";
import { setGuestSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const household = await findHouseholdByCode(String(body.code ?? ""));
  if (!household) {
    return NextResponse.json({ error: "Code introuvable. Vérifiez le code imprimé sur votre faire-part." }, { status: 404 });
  }
  await setGuestSession(household.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { clearGuestSession } = await import("@/lib/session");
  await clearGuestSession();
  return NextResponse.json({ ok: true });
}
