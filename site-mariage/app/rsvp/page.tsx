import { rsvpClosed, env } from "@/lib/env";
import { getAnsweredResponseId } from "@/lib/session";
import { db, Person, ResponseRow } from "@/lib/supabase";
import { Nav } from "@/components/Nav";
import { RsvpForm, Recap } from "@/components/RsvpForm";

export const dynamic = "force-dynamic";

async function loadAnswered(id: string) {
  try {
    const supabase = db();
    const r = await supabase.from("responses").select("*").eq("id", id).maybeSingle();
    if (!r.data) return null;
    const p = await supabase.from("people").select("*").eq("response_id", id).order("position");
    return { response: r.data as ResponseRow, people: (p.data ?? []) as Person[] };
  } catch {
    return null;
  }
}

export default async function RsvpPage() {
  const closed = rsvpClosed();
  const deadline = new Date(env.rsvpDeadline);
  const answeredId = await getAnsweredResponseId();
  const answered = answeredId ? await loadAnswered(answeredId) : null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-center text-4xl">Votre réponse</h1>
        {answered ? (
          <Recap
            attending={answered.response.attending}
            people={answered.people.map((p) => ({
              first_name: p.first_name,
              last_name: p.last_name,
              is_child: p.is_child,
              has_allergies: p.has_allergies,
              allergy_details: p.allergy_details ?? "",
            }))}
            alreadySent
          />
        ) : (
          <>
            <p className="mt-2 text-center text-muted">Une seule réponse pour vous et les personnes qui vous accompagnent.</p>
            {!Number.isNaN(deadline.getTime()) && (
              <p className="mt-1 text-center text-sm text-muted">
                {closed ? "Les réponses sont closes depuis le " : "Réponse souhaitée avant le "}
                {deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            <RsvpForm readOnly={closed} />
          </>
        )}
      </main>
    </>
  );
}
