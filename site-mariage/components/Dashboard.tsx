"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HouseholdWithGuests } from "@/lib/admin-data";

type Stats = {
  households: number;
  householdsAnswered: number;
  householdsPending: number;
  present: number;
  absent: number;
  seatsPlanned: number;
  companions: number;
  children: number;
  allergies: number;
};

type Row = {
  householdId: string;
  household: string;
  code: string;
  first: string;
  last: string;
  address: string;
  attending: boolean | null;
  child: boolean;
  companion: boolean;
  allergies: string | null;
};

export function Dashboard({ households, stats, error }: { households: HouseholdWithGuests[]; stats: Stats; error: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [presence, setPresence] = useState<"all" | "yes" | "no">("all");
  const [child, setChild] = useState<"all" | "yes" | "no">("all");
  const [tab, setTab] = useState<"reponses" | "relances" | "traiteur" | "foyers">("reponses");

  const rows: Row[] = useMemo(
    () =>
      households.flatMap((h) =>
        h.guests.map((g) => ({
          householdId: h.id,
          household: h.name,
          code: h.code,
          first: g.first_name,
          last: g.last_name,
          address: g.address ?? "",
          attending: g.attending,
          child: g.is_child,
          companion: g.is_companion,
          allergies: g.has_allergies ? g.allergy_details || "Oui (non précisé)" : null,
        }))
      ),
    [households]
  );

  const filtered = rows.filter((r) => {
    if (q && !`${r.household} ${r.first} ${r.last}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (presence === "yes" && r.attending !== true) return false;
    if (presence === "no" && r.attending !== false) return false;
    if (child === "yes" && !r.child) return false;
    if (child === "no" && r.child) return false;
    return true;
  });

  const pending = households.filter((h) => !h.responded_at);
  const allergies = rows.filter((r) => r.attending && r.allergies);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl">Dashboard des mariés</h1>
          <p className="text-sm text-muted">Suivi des réponses en temps réel</p>
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

      {/* Compteurs */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Présents" value={stats.present} tone="sage" sub={`${stats.companions} accompagnant(s)`} />
        <Stat label="Absents" value={stats.absent} tone="rose" />
        <Stat label="Foyers sans réponse" value={stats.householdsPending} sub={`sur ${stats.households} foyers`} />
        <Stat label="Enfants" value={stats.children} sub={`${stats.allergies} allergie(s) signalée(s)`} />
      </div>

      {/* Onglets */}
      <div className="mt-8 flex flex-wrap gap-2 border-b border-blush">
        {(
          [
            ["reponses", `Réponses (${rows.length})`],
            ["relances", `À relancer (${pending.length})`],
            ["traiteur", `Traiteur (${allergies.length})`],
            ["foyers", `Foyers (${households.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === k ? "border-rose text-rose" : "border-transparent text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "reponses" && (
        <section className="mt-4">
          <div className="flex flex-wrap gap-2">
            <input className="field !w-auto flex-1" placeholder="Rechercher un foyer ou un nom…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="field !w-auto" value={presence} onChange={(e) => setPresence(e.target.value as typeof presence)}>
              <option value="all">Présence : tous</option>
              <option value="yes">Présents</option>
              <option value="no">Absents</option>
            </select>
            <select className="field !w-auto" value={child} onChange={(e) => setChild(e.target.value as typeof child)}>
              <option value="all">Enfant : tous</option>
              <option value="yes">Enfants</option>
              <option value="no">Adultes</option>
            </select>
          </div>
          <Table
            head={["Foyer", "Prénom", "Nom", "Présence", "Enfant", "Allergies", "Adresse"]}
            rows={filtered.map((r) => [
              r.household,
              r.first + (r.companion ? " ·acc." : ""),
              r.last,
              <Presence key="p" v={r.attending} />,
              r.child ? "Oui" : "",
              r.allergies ?? "",
              r.address,
            ])}
            empty="Aucune réponse pour ces filtres."
          />
        </section>
      )}

      {tab === "relances" && (
        <section className="mt-4">
          <p className="text-sm text-muted">Foyers qui n’ont pas encore répondu. Envoyez-leur leur lien perso.</p>
          <Table
            head={["Foyer", "Code", "Lien perso", "Places"]}
            rows={pending.map((h) => [h.name, <code key="c">{h.code}</code>, <CopyLink key="l" code={h.code} />, h.max_guests])}
            empty="Tout le monde a répondu 🎉"
          />
        </section>
      )}

      {tab === "traiteur" && (
        <section className="mt-4">
          <p className="text-sm text-muted">Personnes présentes ayant signalé une allergie ou restriction.</p>
          <Table
            head={["Prénom", "Nom", "Foyer", "Enfant", "Allergies / restrictions"]}
            rows={allergies.map((r) => [r.first, r.last, r.household, r.child ? "Oui" : "", r.allergies])}
            empty="Aucune allergie signalée."
          />
        </section>
      )}

      {tab === "foyers" && <Households households={households} onChange={() => router.refresh()} />}
    </main>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: "sage" | "rose" }) {
  const color = tone === "sage" ? "text-sage-deep" : tone === "rose" ? "text-rose" : "text-ink";
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-serif text-4xl ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Presence({ v }: { v: boolean | null }) {
  if (v === null) return <span className="chip bg-cream text-muted">—</span>;
  return v ? <span className="chip bg-sage/20 text-sage-deep">Présent</span> : <span className="chip bg-blush text-rose">Absent</span>;
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="mt-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-blush bg-white/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-blush/40 text-xs uppercase tracking-wider text-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-blush/60">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/r/${code}` : `/r/${code}`;
  return (
    <button
      type="button"
      className="text-rose hover:underline"
      onClick={async () => {
        await navigator.clipboard.writeText(link).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copié !" : `/r/${code}`}
    </button>
  );
}

function Households({ households, onChange }: { households: HouseholdWithGuests[]; onChange: () => void }) {
  const [name, setName] = useState("");
  const [max, setMax] = useState(2);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, max_guests: max, code: code || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      setName("");
      setCode("");
      onChange();
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Erreur");
    }
  }

  async function remove(id: string, label: string) {
    if (!confirm(`Supprimer le foyer « ${label} » et toutes ses réponses ?`)) return;
    await fetch("/api/admin/households", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    onChange();
  }

  return (
    <section className="mt-4">
      <form onSubmit={add} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-muted">Nom du foyer</label>
          <input className="field mt-1" placeholder="Famille Dupont" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-24">
          <label className="text-xs text-muted">Places</label>
          <input className="field mt-1" type="number" min={1} max={20} value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </div>
        <div className="w-36">
          <label className="text-xs text-muted">Code (optionnel)</label>
          <input className="field mt-1 uppercase" placeholder="auto" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </div>
        <button className="btn-primary !py-3" disabled={busy}>
          Ajouter
        </button>
        {err && <p className="w-full text-sm text-rose">{err}</p>}
      </form>
      <Table
        head={["Foyer", "Code", "Lien perso", "Places", "Réponses", ""]}
        rows={households.map((h) => [
          h.name,
          <code key="c">{h.code}</code>,
          <CopyLink key="l" code={h.code} />,
          h.max_guests,
          h.responded_at ? `${h.guests.filter((g) => g.attending).length} présent(s) / ${h.guests.length}` : <span className="text-muted">—</span>,
          <button key="d" className="text-xs text-muted hover:text-rose" onClick={() => remove(h.id, h.name)}>
            Supprimer
          </button>,
        ])}
        empty="Aucun foyer. Ajoutez les invitations ci-dessus."
      />
    </section>
  );
}
