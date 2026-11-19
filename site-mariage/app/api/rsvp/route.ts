import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getGuestHouseholdId } from "@/lib/session";
import { getHousehold } from "@/lib/households";
import { rsvpClosed } from "@/lib/env";

type Incoming = {
  last_name?: string;
  first_name?: string;
  address?: string;
  attending?: "yes" | "no" | "";
  is_child?: boolean;
  has_allergies?: boolean;
  allergy_details?: string;
  is_companion?: boolean;
};

const clean = (s: unknown, max = 300) => String(s ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  const householdId = await getGuestHouseholdId();
  const household = householdId ? await getHousehold(householdId) : null;
  if (!household) return NextResponse.json({ error: "Session expirée, saisissez à nouveau votre code." }, { status: 401 });
  if (rsvpClosed()) return NextResponse.json({ error: "La date limite de réponse est passée." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const list: Incoming[] = Array.isArray(body.guests) ? body.guests : [];
  if (list.length === 0) return NextResponse.json({ error: "Aucune personne renseignée." }, { status: 400 });
  if (list.length > household.max_guests) {
    return NextResponse.json({ error: `Votre invitation prévoit ${household.max_guests} place(s).` }, { status: 400 });
  }

  try {
  const rows = list.map((g) => {
    const first = clean(g.first_name, 80);
    const last = clean(g.last_name, 80);
    if (!first || !last) throw new Error("Nom et prénom obligatoires.");
    if (g.attending !== "yes" && g.attending !== "no") throw new Error(`Présence manquante pour ${first}.`);
    const has_allergies = !!g.has_allergies;
    return {
      household_id: household.id,
      first_name: first,
      last_name: last,
      address: clean(g.address, 500) || null,
      attending: g.attending === "yes",
      is_child: !!g.is_child,
      has_allergies,
      allergy_details: has_allergies ? clean(g.allergy_details, 1000) || null : null,
      is_companion: !!g.is_companion,
      updated_at: new Date().toISOString(),
    };
  });

    const supabase = db();
    // On remplace toutes les personnes du foyer (réponse = état complet du foyer)
    const del = await supabase.from("guests").delete().eq("household_id", household.id);
    if (del.error) throw del.error;
    const ins = await supabase.from("guests").insert(rows);
    if (ins.error) throw ins.error;
    const upd = await supabase.from("households").update({ responded_at: new Date().toISOString() }).eq("id", household.id);
    if (upd.error) throw upd.error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
