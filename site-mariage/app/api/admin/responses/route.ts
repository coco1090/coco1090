import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { isAdmin } from "@/lib/session";

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
  const { error } = await db().from("responses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
