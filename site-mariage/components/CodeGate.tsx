"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Floral } from "./Floral";
import { site } from "@/content/site";

export function CodeGate({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Code invalide.");
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Floral className="mx-auto mb-4 h-14 w-48 text-blush-deep" />
        <p className="script text-5xl text-rose">
          {site.brideName} &amp; {site.groomName}
        </p>
        <p className="mt-2 font-serif text-lg tracking-widest text-muted uppercase">{site.dateLabel}</p>

        <form onSubmit={submit} className="card mt-10 text-left">
          <label htmlFor="code" className="block text-sm font-medium text-ink">
            Code de votre faire-part
          </label>
          <p className="mt-1 text-sm text-muted">Il est imprimé sur votre invitation.</p>
          <input
            id="code"
            className="field mt-3 text-center font-mono text-xl tracking-[0.3em] uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7M2QX"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={10}
            required
          />
          {error && <p className="mt-3 text-sm text-rose">{error}</p>}
          <button className="btn-primary mt-5 w-full" disabled={loading || code.length < 4}>
            {loading ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>
    </main>
  );
}
