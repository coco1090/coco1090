"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Floral } from "@/components/Floral";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError("Mot de passe incorrect.");
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm text-center">
        <Floral className="mx-auto mb-2 h-12 w-40 text-blush-deep" />
        <h1 className="text-3xl">Espace des mariés</h1>
        <input
          type="password"
          className="field mt-6"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
        <button className="btn-primary mt-4 w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
