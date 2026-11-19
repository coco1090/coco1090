import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { rsvpClosed } from "@/lib/env";
import { getAnsweredResponseId, setAnsweredCookie } from "@/lib/session";
import { cap, checkAddress, checkEmail, checkName, checkPhone, norm, normKey } from "@/lib/validate";

type PersonIn = { first_name?: string; last_name?: string; is_child?: boolean; has_allergies?: boolean; allergy_details?: string };

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (rsvpClosed()) return bad("La date limite de réponse est passée.", 403);
  if (await getAnsweredResponseId()) return bad("Une réponse a déjà été envoyée depuis cet appareil. Pour la modifier, contactez les mariés.", 409);

  const b = await req.json().catch(() => ({}));

  // --- Validation des champs ---
  const err =
    checkName(String(b.first_name ?? ""), "Prénom") ??
    checkName(String(b.last_name ?? ""), "Nom") ??
    checkEmail(String(b.email ?? "")) ??
    checkPhone(String(b.phone ?? "")) ??
    checkAddress(String(b.address ?? ""));
  if (err) return bad(err);
  if (b.attending !== "yes" && b.attending !== "no") return bad("Merci d’indiquer votre présence.");
  const attending = b.attending === "yes";

  const self = b.self ?? {};
  const companions: PersonIn[] = attending && Array.isArray(b.companions) ? b.companions.slice(0, 20) : [];

  const people = [
    {
      first_name: cap(String(b.first_name)),
      last_name: cap(String(b.last_name)),
      is_child: !!self.is_child,
      has_allergies: attending && !!self.has_allergies,
      allergy_details: norm(String(self.allergy_details ?? "")).slice(0, 1000),
    },
    ...companions.map((c) => ({
      first_name: cap(String(c.first_name ?? "")),
      last_name: cap(String(c.last_name ?? "")),
      is_child: !!c.is_child,
      has_allergies: !!c.has_allergies,
      allergy_details: norm(String(c.allergy_details ?? "")).slice(0, 1000),
    })),
  ];
  for (const p of people) {
    const e = checkName(p.first_name, "Prénom") ?? checkName(p.last_name, "Nom");
    if (e) return bad(`Accompagnant : ${e}`);
    if (p.has_allergies && p.allergy_details.length < 2) return bad(`Merci de préciser les allergies de ${p.first_name}.`);
  }

  // Doublons à l'intérieur du formulaire
  const keys = people.map((p) => `${normKey(p.first_name)}|${normKey(p.last_name)}`);
  const dupIn = keys.find((k, i) => keys.indexOf(k) !== i);
  if (dupIn) return bad("Une même personne apparaît deux fois dans le formulaire.");

  const email = String(b.email).trim().toLowerCase();

  try {
    const supabase = db();

    // --- Doublons en base ---
    const existing = await supabase.from("responses").select("id").ilike("email", email).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return bad("Une réponse a déjà été envoyée avec cet email. Pour la modifier, contactez les mariés.", 409);

    const dupPeople = await supabase.from("people").select("first_name,last_name").in("name_key", keys);
    if (dupPeople.error) throw dupPeople.error;
    if (dupPeople.data && dupPeople.data.length > 0) {
      const names = dupPeople.data.map((p) => `${p.first_name} ${p.last_name}`).join(", ");
      return bad(`${names} : une réponse a déjà été enregistrée pour cette personne. Pour la modifier, contactez les mariés.`, 409);
    }

    const ins = await supabase
      .from("responses")
      .insert({
        first_name: people[0].first_name,
        last_name: people[0].last_name,
        email,
        phone: norm(String(b.phone ?? "")) || null,
        address: norm(String(b.address)),
        attending,
        message: norm(String(b.message ?? "")).slice(0, 2000) || null,
      })
      .select("id")
      .single();
    if (ins.error) {
      if (ins.error.code === "23505") return bad("Une réponse a déjà été envoyée avec cet email.", 409);
      throw ins.error;
    }

    const rows = people.map((p, i) => ({
      response_id: ins.data.id,
      first_name: p.first_name,
      last_name: p.last_name,
      is_child: p.is_child,
      has_allergies: p.has_allergies,
      allergy_details: p.has_allergies ? p.allergy_details : null,
      name_key: keys[i],
      position: i,
    }));
    const pi = await supabase.from("people").insert(rows);
    if (pi.error) {
      await supabase.from("responses").delete().eq("id", ins.data.id);
      if (pi.error.code === "23505") return bad("Une de ces personnes a déjà été enregistrée. Pour modifier, contactez les mariés.", 409);
      throw pi.error;
    }

    await setAnsweredCookie(ins.data.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return bad(msg, 500);
  }
}
