import { NextResponse } from "next/server";
import { findHouseholdByCode } from "@/lib/households";
import { setGuestSession } from "@/lib/session";

// Lien perso : /r/K7M2QX ouvre directement le bon foyer.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const household = await findHouseholdByCode(code);
  const url = new URL(req.url);
  if (!household) {
    return NextResponse.redirect(new URL("/?erreur=code", url.origin));
  }
  await setGuestSession(household.id);
  return NextResponse.redirect(new URL("/", url.origin));
}
