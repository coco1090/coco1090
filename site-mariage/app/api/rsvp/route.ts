import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { rsvpClosed } from "@/lib/env";

type PersonIn = { first_name?: string; last_name?: string; is_child?: boolean; has_allergies?: boolean; allergy_details?: string };

const clean = (s: unknown, max = 300) => String(s ?? "").trim().slice(0, max);

export async function POST(req: Request) {
  if (rsvpClosed()) return NextResponse.json({ error: "La date limite de réponse est passée." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const first = clean(b.first_name, 80);
  const last = clean(b.last_name, 80);
  if (!first || !last) return NextResponse.json({ error: "Nom et prénom obligatoires." }, { status: 400 });
  if (b.attending !== "yes" && b.attending !== "no") return NextResponse.json({ error: "Merci d’indiquer votre présence." }, { status: 400 });
  const attending = b.attending === "yes";

  const self = b.self ?? {};
  const companions: PersonIn[] = attending && Array.isArray(b.companions) ? b.companions.slice(0, 20) : [];

  const people = [
    { first_name: first, last_name: last, is_child: !!self.is_child, has_allergies: attending && !!self.has_allergies, allergy_details: clean(self.allergy_details, 1000) },
    ...companions.map((c) => ({
      first_name: clean(c.first_name, 80),
      last_name: clean(c.last_name, 80),
      is_child: !!c.is_child,
      has_allergies: !!c.has_allergies,
      allergy_details: clean(c.allergy_details, 1000),
    })),
  ];
  for (const p of people) {
    if (!p.first_name || !p.last_name) return NextResponse.json({ error: "Nom et prénom obligatoires pour chaque personne." }, { status: 400 });
    if (p.has_allergies && !p.allergy_details) return NextResponse.json({ error: `Merci de préciser les allergies de ${p.first_name}.` }, { status: 400 });
  }

  try {
    const supabase = db();
    const ins = await supabase
      .from("responses")
      .insert({
        first_name: first,
        last_name: last,
        email: clean(b.email, 200) || null,
        phone: clean(b.phone, 40) || null,
        address: clean(b.address, 500) || null,
        attending,
        message: clean(b.message, 2000) || null,
      })
      .select("id")
      .single();
    if (ins.error) throw ins.error;
    const rows = people.map((p, i) => ({
      response_id: ins.data.id,
      first_name: p.first_name,
      last_name: p.last_name,
      is_child: p.is_child,
      has_allergies: p.has_allergies,
      allergy_details: p.has_allergies ? p.allergy_details : null,
      position: i,
    }));
    const pi = await supabase.from("people").insert(rows);
    if (pi.error) throw pi.error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
