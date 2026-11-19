"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ResponseWithPeople } from "@/lib/admin-data";

type Stats = { responses: number; present: number; absent: number; children: number; adults: number; allergies: number };

export function Dashboard({ responses, stats, error }: { responses: ResponseWithPeople[]; stats: Stats; error: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [view, setView] = useState<"all" | "present" | "absent" | "children" | "allergies">("all");
  const [open, setOpen] = useState<string | null>(null);
  const presence = view === "present" ? "yes" : view === "absent" ? "no" : "all";
  const setPresence = (v: "all" | "yes" | "no") => setView(v === "yes" ? "present" : v === "no" ? "absent" : "all");
  const pick = (v: typeof view) => {
    setView(view === v ? "all" : v);
    setTimeout(() => document.getElementById("liste")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const filtered = responses.filter((r) => {
    if (presence === "yes" && !r.attending) return false;
    if (presence === "no" && r.attending) return false;
    if (q) {
      const hay = [r.first_name, r.last_name, r.email, r.phone, ...r.people.flatMap((p) => [p.first_name, p.last_name])].join(" ").toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  async function remove(r: ResponseWithPeople) {
    if (!confirm(`Supprimer la réponse de ${r.first_name} ${r.last_name} ?`)) return;
    await fetch("/api/admin/responses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id }) });
    router.refresh();
  }

  const presentPeople = responses.filter((r) => r.attending).flatMap((r) => r.people.map((p) => ({ ...p, from: `${r.first_name} ${r.last_name}` })));
  const allergyList = presentPeople.filter((p) => p.has_allergies);
  const childrenList = presentPeople.filter((p) => p.is_child);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl">Dashboard des mariés</h1>
          <p className="text-sm text-muted">{stats.responses} réponse{stats.responses > 1 ? "s" : ""} reçue{stats.responses > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/export" className="btn-primary !py-2 text-sm">
            Export Excel
          </a>
          <form action="/api/admin/logout" method="post">
            <button className="btn-ghost !py-2 text-sm">Déconnexion</button>
          </form>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-blush/60 px-4 py-3 text-sm text-rose">{error}</p>}

      <p className="mt-6 text-xs text-muted">Touchez une carte pour voir le détail.</p>
      <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Présents" value={stats.present} tone="sage" sub={`${stats.adults} adulte(s), ${stats.children} enfant(s)`} active={view === "present"} onClick={() => pick("present")} />
        <Stat label="Absents" value={stats.absent} tone="rose" active={view === "absent"} onClick={() => pick("absent")} />
        <Stat label="Enfants" value={stats.children} sub="présents" active={view === "children"} onClick={() => pick("children")} />
        <Stat label="Allergies" value={stats.allergies} sub="personnes présentes" active={view === "allergies"} onClick={() => pick("allergies")} />
      </div>

      <div id="liste" className="scroll-mt-4" />

      {view === "allergies" && (
        <section className="card mt-6">
          <h2 className="text-2xl">Allergies et régimes (pour le traiteur)</h2>
          {allergyList.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Aucune allergie signalée.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {allergyList.map((p) => (
                <li key={p.id} className="rounded-xl bg-cream px-3 py-2">
                  <span className="font-medium">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.is_child && <span className="chip ml-2 bg-sage/20 text-sage-deep">enfant</span>}
                  <span className="text-rose"> · {p.allergy_details}</span>
                  <span className="block text-xs text-muted">réponse de {p.from}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {view === "children" && (
        <section className="card mt-6">
          <h2 className="text-2xl">Enfants présents</h2>
          {childrenList.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Aucun enfant pour l’instant.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {childrenList.map((p) => (
                <li key={p.id} className="rounded-xl bg-cream px-3 py-2">
                  <span className="font-medium">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.has_allergies && <span className="text-rose"> · {p.allergy_details}</span>}
                  <span className="block text-xs text-muted">avec {p.from}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(view === "present" || view === "absent") && (
        <section className="card mt-6">
          <h2 className="text-2xl">{view === "present" ? "Personnes présentes" : "Personnes absentes"}</h2>
          {(() => {
            const list = responses.filter((r) => r.attending === (view === "present")).flatMap((r) => r.people);
            return list.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Personne pour l’instant.</p>
            ) : (
              <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                {list.map((p) => (
                  <li key={p.id} className="rounded-xl bg-cream px-3 py-2">
                    {p.first_name} {p.last_name}
                    {p.is_child && <span className="chip ml-2 bg-sage/20 text-sage-deep">enfant</span>}
                    {p.has_allergies && <span className="text-rose"> · {p.allergy_details}</span>}
                  </li>
                ))}
              </ul>
            );
          })()}
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl">
          {view === "present" ? "Réponses « présent »" : view === "absent" ? "Réponses « absent »" : "Toutes les réponses"}
          {view !== "all" && (
            <button type="button" onClick={() => setView("all")} className="ml-3 text-sm font-sans text-rose hover:underline">
              Tout afficher
            </button>
          )}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="field !w-auto flex-1" placeholder="Rechercher un nom…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field !w-auto" value={presence} onChange={(e) => setPresence(e.target.value as typeof presence)}>
            <option value="all">Tous</option>
            <option value="yes">Présents</option>
            <option value="no">Absents</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">Aucune réponse pour l’instant.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {filtered.map((r) => (
              <li key={r.id} className="card !p-4">
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  <div>
                    <p className="font-medium">
                      {r.first_name} {r.last_name}
                      <span className="ml-2 text-sm text-muted">
                        {r.people.length} personne{r.people.length > 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-muted">{new Date(r.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <span className={`chip ${r.attending ? "bg-sage/20 text-sage-deep" : "bg-blush text-rose"}`}>{r.attending ? "Présent" : "Absent"}</span>
                </button>

                {open === r.id && (
                  <div className="mt-4 space-y-3 border-t border-blush/60 pt-4 text-sm">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Info label="Email" value={r.email} />
                      <Info label="Téléphone" value={r.phone} />
                      <Info label="Adresse" value={r.address} wide />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted">Personnes</p>
                      <ul className="mt-1 space-y-1">
                        {r.people.map((p) => (
                          <li key={p.id}>
                            {p.first_name} {p.last_name}
                            {p.is_child && <span className="chip ml-2 bg-sage/20 text-sage-deep">enfant</span>}
                            {p.has_allergies && <span className="ml-2 text-rose">· {p.allergy_details}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {r.message && <Info label="Message" value={r.message} wide />}
                    <button type="button" onClick={() => remove(r)} className="text-xs text-muted hover:text-rose">
                      Supprimer cette réponse
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "sage" | "rose";
  active: boolean;
  onClick: () => void;
}) {
  const color = tone === "sage" ? "text-sage-deep" : tone === "rose" ? "text-rose" : "text-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card text-left transition hover:border-rose/60 hover:shadow-md ${active ? "!border-rose ring-2 ring-rose/20" : ""}`}
    >
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-serif text-4xl ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
      <p className="mt-2 text-xs text-rose">{active ? "Masquer" : "Voir la liste →"}</p>
    </button>
  );
}

function Info({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="whitespace-pre-line">{value || <span className="text-muted">—</span>}</p>
    </div>
  );
}
