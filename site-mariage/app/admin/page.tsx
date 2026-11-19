import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { loadAll, stats } from "@/lib/admin-data";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  let responses: Awaited<ReturnType<typeof loadAll>> = [];
  let error = "";
  try {
    responses = await loadAll();
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur de chargement";
  }
  return <Dashboard responses={responses} stats={stats(responses)} error={error} />;
}
