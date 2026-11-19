import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdmin } from "@/lib/session";
import { loadAll, stats } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", new URL(req.url).origin));
  const responses = await loadAll();
  const s = stats(responses);
  const yesNo = (b: boolean) => (b ? "Oui" : "Non");

  const personnes = responses.flatMap((r) =>
    r.people.map((p) => ({
      Prénom: p.first_name,
      Nom: p.last_name,
      Présence: r.attending ? "Présent(e)" : "Absent(e)",
      Enfant: yesNo(p.is_child),
      Allergies: yesNo(p.has_allergies),
      "Précisions allergies": p.allergy_details ?? "",
      "Répondu par": `${r.first_name} ${r.last_name}`,
      Email: r.email ?? "",
      Téléphone: r.phone ?? "",
      Adresse: r.address ?? "",
      "Répondu le": new Date(r.created_at).toLocaleString("fr-FR"),
    }))
  );

  const reponses = responses.map((r) => ({
    Prénom: r.first_name,
    Nom: r.last_name,
    Présence: r.attending ? "Présent(e)" : "Absent(e)",
    "Nb personnes": r.people.length,
    "dont enfants": r.people.filter((p) => p.is_child).length,
    Email: r.email ?? "",
    Téléphone: r.phone ?? "",
    Adresse: r.address ?? "",
    Message: r.message ?? "",
    "Répondu le": new Date(r.created_at).toLocaleString("fr-FR"),
  }));

  const traiteur = responses
    .filter((r) => r.attending)
    .flatMap((r) =>
      r.people
        .filter((p) => p.has_allergies)
        .map((p) => ({ Prénom: p.first_name, Nom: p.last_name, Enfant: yesNo(p.is_child), "Allergies / régime": p.allergy_details ?? "" }))
    );

  const resume = [
    { Indicateur: "Réponses reçues", Valeur: s.responses },
    { Indicateur: "Personnes présentes", Valeur: s.present },
    { Indicateur: "dont adultes", Valeur: s.adults },
    { Indicateur: "dont enfants", Valeur: s.children },
    { Indicateur: "Personnes absentes", Valeur: s.absent },
    { Indicateur: "Allergies / régimes", Valeur: s.allergies },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resume), "Résumé");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(personnes), "Personnes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reponses), "Réponses");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(traiteur), "Traiteur");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reponses-mariage-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
