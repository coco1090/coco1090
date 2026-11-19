import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { isAdmin } from "@/lib/session";
import { generateCode, normalizeCode } from "@/lib/codes";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 120);
  const max_guests = Math.min(20, Math.max(1, Number(body.max_guests) || 1));
  let code = body.code ? normalizeCode(String(body.code)) : "";
  if (!name) return NextResponse.json({ error: "Nom du foyer obligatoire." }, { status: 400 });
  if (code && code.length < 4) return NextResponse.json({ error: "Code trop court (4 caractères min)." }, { status: 400 });

  const supabase = db();
  for (let attempt = 0; attempt < 5; attempt++) {
    if (!code) code = generateCode();
    const { data, error } = await supabase.from("households").insert({ name, max_guests, code }).select().single();
    if (!error) return NextResponse.json({ household: data });
    if (error.code === "23505" && !body.code) {
      code = "";
      continue;
    }
    const msg = error.code === "23505" ? "Ce code existe déjà." : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ error: "Impossible de générer un code unique." }, { status: 500 });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const { error } = await db().from("households").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
