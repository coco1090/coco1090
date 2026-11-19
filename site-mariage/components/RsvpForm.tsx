"use client";

import { useState } from "react";
import { checkAddress, checkEmail, checkName, checkPhone } from "@/lib/validate";

type PersonInput = {
  first_name: string;
  last_name: string;
  is_child: boolean;
  has_allergies: boolean;
  allergy_details: string;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  attending: "yes" | "no" | "";
  message: string;
  self: { is_child: boolean; has_allergies: boolean; allergy_details: string };
  companions: PersonInput[];
};

const blankPerson = (): PersonInput => ({ first_name: "", last_name: "", is_child: false, has_allergies: false, allergy_details: "" });

const initial: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  attending: "",
  message: "",
  self: { is_child: false, has_allergies: false, allergy_details: "" },
  companions: [],
};

function Choice<T extends string | boolean>({
  value,
  options,
  onChange,
  name,
}: {
  value: T | "";
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {options.map((o) => (
        <label
          key={String(o.v)}
          className={`cursor-pointer rounded-xl border px-4 py-3 text-center text-sm transition ${
            value === o.v ? "border-rose bg-blush/60 text-rose" : "border-blush-deep/40 bg-white/60 hover:bg-blush/30"
          }`}
        >
          <input type="radio" className="sr-only" name={name} checked={value === o.v} onChange={() => onChange(o.v)} />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function AllergyBlock({
  value,
  onChange,
  name,
}: {
  value: { has_allergies: boolean; allergy_details: string };
  onChange: (v: { has_allergies: boolean; allergy_details: string }) => void;
  name: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium">Allergies, intolérances ou régime particulier</p>
      <Choice
        name={name}
        value={value.has_allergies}
        options={[
          { v: false, label: "Non, aucun" },
          { v: true, label: "Oui" },
        ]}
        onChange={(v) => onChange({ ...value, has_allergies: v })}
      />
      {value.has_allergies && (
        <textarea
          className="field mt-3"
          rows={2}
          required
          placeholder="Précisez (ex : arachides, gluten, végétarien, sans porc…)"
          value={value.allergy_details}
          onChange={(e) => onChange({ ...value, allergy_details: e.target.value })}
        />
      )}
    </div>
  );
}


export function Recap({
  attending,
  people,
  alreadySent,
}: {
  attending: boolean;
  people: { first_name: string; last_name: string; is_child: boolean; has_allergies: boolean; allergy_details: string }[];
  alreadySent?: boolean;
}) {
  return (
    <div className="card mt-8">
      <h2 className="text-3xl text-rose">{alreadySent ? "Vous avez déjà répondu" : "Merci, c’est bien noté !"}</h2>
      <p className="mt-2 text-muted">
        {attending
          ? "Nous avons hâte de vous retrouver le jour J."
          : "Nous sommes tristes de ne pas vous avoir avec nous, mais merci de nous avoir prévenus."}
      </p>
      <ul className="mt-4 space-y-2">
        {people.map((p, i) => (
          <li key={i} className="rounded-xl bg-cream px-4 py-3">
            <p className="font-medium">
              {p.first_name} {p.last_name} {p.is_child && <span className="chip bg-sage/20 text-sage-deep">enfant</span>}
            </p>
            {p.has_allergies && <p className="text-sm text-muted">Allergies : {p.allergy_details}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        {attending ? `${people.length} personne${people.length > 1 ? "s" : ""} présente${people.length > 1 ? "s" : ""}.` : "Absent(e)s."}{" "}
        Pour modifier votre réponse, contactez directement les mariés.
      </p>
    </div>
  );
}

export function RsvpForm({ readOnly }: { readOnly: boolean }) {
  const [f, setF] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<FormState | null>(null);

  const set = (patch: Partial<FormState>) => setF((s) => ({ ...s, ...patch }));
  const setCompanion = (i: number, patch: Partial<PersonInput>) =>
    setF((s) => ({ ...s, companions: s.companions.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err =
      checkName(f.first_name, "Prénom") ??
      checkName(f.last_name, "Nom") ??
      checkEmail(f.email) ??
      checkPhone(f.phone) ??
      checkAddress(f.address) ??
      (!f.attending ? "Merci d’indiquer si vous serez présent(e)." : null) ??
      f.companions.map((c, i) => checkName(c.first_name, `Accompagnant ${i + 1}, prénom`) ?? checkName(c.last_name, `Accompagnant ${i + 1}, nom`)).find(Boolean) ??
      null;
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setSaving(false);
    if (res.ok) {
      setDone(f);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Une erreur est survenue, réessayez.");
    }
  }

  if (done) {
    return (
      <Recap
        attending={done.attending === "yes"}
        people={[{ first_name: done.first_name, last_name: done.last_name, ...done.self }, ...done.companions]}
      />
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      {readOnly && (
        <p className="rounded-xl bg-blush/50 px-4 py-3 text-sm text-rose">
          La date limite est passée : le formulaire est fermé. Contactez directement les mariés.
        </p>
      )}
      <fieldset disabled={readOnly} className="space-y-6">
        {/* Vous */}
        <div className="card space-y-4">
          <h2 className="text-2xl">Vous</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Prénom</label>
              <input className="field mt-1" required minLength={2} autoComplete="given-name" value={f.first_name} onChange={(e) => set({ first_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Nom</label>
              <input className="field mt-1" required minLength={2} autoComplete="family-name" value={f.last_name} onChange={(e) => set({ last_name: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input className="field mt-1" type="email" required placeholder="prenom@exemple.fr" value={f.email} onChange={(e) => set({ email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone</label>
              <input className="field mt-1" type="tel" placeholder="06 12 34 56 78" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Adresse postale complète</label>
            <textarea
              className="field mt-1"
              rows={2}
              required
              minLength={10}
              autoComplete="street-address"
              placeholder="Numéro, rue, code postal, ville"
              value={f.address}
              onChange={(e) => set({ address: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Serez-vous présent(e) le 29 mai 2027 ?</p>
            <Choice
              name="attending"
              value={f.attending}
              options={[
                { v: "yes" as const, label: "Oui, avec plaisir !" },
                { v: "no" as const, label: "Non, malheureusement" },
              ]}
              onChange={(v) => set({ attending: v })}
            />
          </div>
          {f.attending === "yes" && (
            <AllergyBlock name="self-all" value={f.self} onChange={(v) => set({ self: { ...f.self, ...v } })} />
          )}
        </div>

        {/* Accompagnants */}
        {f.attending === "yes" && (
          <>
            {f.companions.map((c, i) => (
              <div key={i} className="card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl">Accompagnant {i + 1}</h2>
                  <button
                    type="button"
                    onClick={() => setF((s) => ({ ...s, companions: s.companions.filter((_, j) => j !== i) }))}
                    className="text-sm text-muted hover:text-rose"
                  >
                    Retirer
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Prénom</label>
                    <input className="field mt-1" required value={c.first_name} onChange={(e) => setCompanion(i, { first_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nom</label>
                    <input className="field mt-1" required value={c.last_name} onChange={(e) => setCompanion(i, { last_name: e.target.value })} />
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-rose" checked={c.is_child} onChange={(e) => setCompanion(i, { is_child: e.target.checked })} />
                  C’est un enfant
                </label>
                <AllergyBlock name={`c-all-${i}`} value={c} onChange={(v) => setCompanion(i, v)} />
              </div>
            ))}
            <div className="text-center">
              <button type="button" className="btn-ghost" onClick={() => setF((s) => ({ ...s, companions: [...s.companions, blankPerson()] }))}>
                + Ajouter un accompagnant (conjoint, enfant…)
              </button>
            </div>
          </>
        )}

        {/* Message */}
        <div className="card">
          <label className="text-sm font-medium">Un petit mot pour les mariés (facultatif)</label>
          <textarea className="field mt-1" rows={3} value={f.message} onChange={(e) => set({ message: e.target.value })} />
        </div>

        {error && <p className="text-center text-sm text-rose">{error}</p>}

        <button className="btn-primary w-full" disabled={saving}>
          {saving ? "Envoi…" : "Envoyer ma réponse"}
        </button>
      </fieldset>
    </form>
  );
}
