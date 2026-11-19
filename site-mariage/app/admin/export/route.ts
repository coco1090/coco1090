import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdmin } from "@/lib/session";
import { loadAll, stats } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  const households = await loadAll();
  const s = stats(households);
  const yesNo = (b: boolean | null) => (b === null ? "" : b ? "Oui" : "Non");

  const reponses = households.flatMap((h) =>
    h.guests.map((g) => ({
      Foyer: h.name,
      Code: h.code,
      Prénom: g.first_name,
      Nom: g.last_name,
      Adresse: g.address ?? "",
      Présence: g.attending === null ? "Pas répondu" : g.attending ? "Présent(e)" : "Absent(e)",
      Enfant: yesNo(g.is_child),
      Accompagnant: yesNo(g.is_companion),
      Allergies: yesNo(g.has_allergies),
      "Précisions allergies": g.allergy_details ?? "",
      "Répondu le": g.updated_at ? new Date(g.updated_at).toLocaleString("fr-FR") : "",
    }))
  );

  const foyers = households.map((h) => ({
    Foyer: h.name,
    Code: h.code,
    "Lien perso": `/r/${h.code}`,
    "Places prévues": h.max_guests,
    "A répondu": h.responded_at ? "Oui" : "Non",
    Présents: h.guests.filter((g) => g.attending).length,
    Absents: h.guests.filter((g) => g.attending === false).length,
  }));

  const traiteur = s.allergies.map((g) => {
    const h = households.find((x) => x.id === g.household_id);
    return { Prénom: g.first_name, Nom: g.last_name, Foyer: h?.name ?? "", Enfant: yesNo(g.is_child), Allergies: g.allergy_details ?? "" };
  });

  const resume = [
    { Indicateur: "Foyers invités", Valeur: s.households },
    { Indicateur: "Foyers ayant répondu", Valeur: s.householdsAnswered },
    { Indicateur: "Foyers à relancer", Valeur: s.householdsPending },
    { Indicateur: "Personnes présentes", Valeur: s.present },
    { Indicateur: "dont accompagnants", Valeur: s.companions },
    { Indicateur: "dont enfants", Valeur: s.children },
    { Indicateur: "Personnes absentes", Valeur: s.absent },
    { Indicateur: "Allergies / restrictions", Valeur: s.allergies.length },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resume), "Résumé");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reponses), "Réponses");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(foyers), "Foyers");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(traiteur), "Traiteur");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reponses-mariage-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
