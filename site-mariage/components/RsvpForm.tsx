"use client";

import { useState } from "react";
import type { Guest } from "@/lib/supabase";

export type GuestInput = {
  id?: string;
  last_name: string;
  first_name: string;
  address: string;
  attending: "yes" | "no" | "";
  is_child: boolean;
  has_allergies: boolean;
  allergy_details: string;
  is_companion: boolean;
};

function blank(is_companion: boolean): GuestInput {
  return { last_name: "", first_name: "", address: "", attending: "", is_child: false, has_allergies: false, allergy_details: "", is_companion };
}

function fromGuest(g: Guest): GuestInput {
  return {
    id: g.id,
    last_name: g.last_name,
    first_name: g.first_name,
    address: g.address ?? "",
    attending: g.attending === null ? "" : g.attending ? "yes" : "no",
    is_child: g.is_child,
    has_allergies: g.has_allergies,
    allergy_details: g.allergy_details ?? "",
    is_companion: g.is_companion,
  };
}

export function RsvpForm({
  household,
  initialGuests,
  readOnly,
}: {
  household: { id: string; name: string; max_guests: number };
  initialGuests: Guest[];
  readOnly: boolean;
}) {
  const [guests, setGuests] = useState<GuestInput[]>(
    initialGuests.length ? initialGuests.map(fromGuest) : [blank(false)]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<GuestInput[] | null>(null);

  const canAdd = guests.length < household.max_guests;

  function update(i: number, patch: Partial<GuestInput>) {
    setGuests((gs) => gs.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  }

  function remove(i: number) {
    setGuests((gs) => gs.filter((_, j) => j !== i));
  }

  function copyAddress(i: number) {
    const first = guests.find((g) => g.address.trim());
    if (first) update(i, { address: first.address });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    for (const g of guests) {
      if (!g.attending) {
        setError(`Merci d’indiquer la présence de ${g.first_name || "chaque personne"}.`);
        return;
      }
      if (g.has_allergies && !g.allergy_details.trim()) {
        setError(`Merci de préciser les allergies de ${g.first_name || "chaque personne"}.`);
        return;
      }
    }
    setSaving(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests }),
    });
    setSaving(false);
    if (res.ok) {
      setDone(guests);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Une erreur est survenue, réessayez.");
    }
  }

  if (done) {
    const present = done.filter((g) => g.attending === "yes");
    const absent = done.filter((g) => g.attending === "no");
    return (
      <div className="card mt-8">
        <h2 className="text-3xl text-rose">Merci, c’est bien noté !</h2>
        <p className="mt-2 text-muted">Voici le récapitulatif de votre réponse. Vous pouvez la modifier avec votre code jusqu’à la date limite.</p>
        <ul className="mt-4 space-y-2">
          {done.map((g, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-cream px-4 py-3">
              <div>
                <p className="font-medium">
                  {g.first_name} {g.last_name} {g.is_child && <span className="chip bg-sage/20 text-sage-deep">enfant</span>}
                </p>
                {g.has_allergies && <p className="text-sm text-muted">Allergies : {g.allergy_details}</p>}
              </div>
              <span className={`chip ${g.attending === "yes" ? "bg-sage/20 text-sage-deep" : "bg-blush text-rose"}`}>
                {g.attending === "yes" ? "Présent(e)" : "Absent(e)"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          {present.length} présent{present.length > 1 ? "s" : ""} · {absent.length} absent{absent.length > 1 ? "s" : ""}
        </p>
        <button className="btn-ghost mt-6" onClick={() => setDone(null)}>
          Modifier ma réponse
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      {readOnly && (
        <p className="rounded-xl bg-blush/50 px-4 py-3 text-sm text-rose">
          La date limite est passée : votre réponse est en lecture seule. Contactez directement les mariés pour tout changement.
        </p>
      )}
      <fieldset disabled={readOnly} className="space-y-6">
        {guests.map((g, i) => (
          <div key={i} className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">
                {g.is_companion ? "Accompagnant" : "Personne"} {i + 1}
              </h2>
              {guests.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="text-sm text-muted hover:text-rose">
                  Retirer
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Prénom</label>
                <input className="field mt-1" required value={g.first_name} onChange={(e) => update(i, { first_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Nom</label>
                <input className="field mt-1" required value={g.last_name} onChange={(e) => update(i, { last_name: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Adresse postale complète</label>
                {i > 0 && (
                  <button type="button" onClick={() => copyAddress(i)} className="text-xs text-rose hover:underline">
                    Même adresse
                  </button>
                )}
              </div>
              <textarea
                className="field mt-1"
                rows={2}
                required
                placeholder="Numéro, rue, code postal, ville"
                value={g.address}
                onChange={(e) => update(i, { address: e.target.value })}
              />
            </div>

            <div>
              <p className="text-sm font-medium">Présence</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["yes", "no"] as const).map((v) => (
                  <label
                    key={v}
                    className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm transition ${
                      g.attending === v ? "border-rose bg-blush/60 text-rose" : "border-blush-deep/40 bg-white/60 hover:bg-blush/30"
                    }`}
                  >
                    <input type="radio" className="sr-only" name={`att-${i}`} checked={g.attending === v} onChange={() => update(i, { attending: v })} />
                    {v === "yes" ? "Je serai présent(e)" : "Je ne serai pas présent(e)"}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-rose" checked={g.is_child} onChange={(e) => update(i, { is_child: e.target.checked })} />
              Enfant
            </label>

            <div>
              <p className="text-sm font-medium">Allergies ou intolérances</p>
              <div className="mt-2 flex gap-2">
                {[false, true].map((v) => (
                  <label
                    key={String(v)}
                    className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${
                      g.has_allergies === v ? "border-rose bg-blush/60 text-rose" : "border-blush-deep/40 bg-white/60"
                    }`}
                  >
                    <input type="radio" className="sr-only" name={`all-${i}`} checked={g.has_allergies === v} onChange={() => update(i, { has_allergies: v })} />
                    {v ? "Oui" : "Non, aucune"}
                  </label>
                ))}
              </div>
              {g.has_allergies && (
                <textarea
                  className="field mt-3"
                  rows={2}
                  placeholder="Précisez (ex : arachides, gluten, végétarien…)"
                  value={g.allergy_details}
                  onChange={(e) => update(i, { allergy_details: e.target.value })}
                />
              )}
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center gap-2">
          <button type="button" className="btn-ghost" disabled={!canAdd} onClick={() => setGuests((gs) => [...gs, blank(true)])}>
            + Ajouter une personne
          </button>
          <p className="text-xs text-muted">
            {guests.length} / {household.max_guests} place{household.max_guests > 1 ? "s" : ""}
          </p>
        </div>

        {error && <p className="text-center text-sm text-rose">{error}</p>}

        <button className="btn-primary w-full" disabled={saving}>
          {saving ? "Envoi…" : "Envoyer ma réponse"}
        </button>
      </fieldset>
    </form>
  );
}
