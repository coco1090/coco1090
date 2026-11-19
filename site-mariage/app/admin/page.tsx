import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { loadAll, stats } from "@/lib/admin-data";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  let households: Awaited<ReturnType<typeof loadAll>> = [];
  let error = "";
  try {
    households = await loadAll();
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur de chargement";
  }
  const s = stats(households);
  return <Dashboard households={households} stats={{ ...s, allergies: s.allergies.length }} error={error} />;
}
