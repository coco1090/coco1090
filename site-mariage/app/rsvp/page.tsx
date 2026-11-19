import { rsvpClosed, env } from "@/lib/env";
import { Nav } from "@/components/Nav";
import { RsvpForm } from "@/components/RsvpForm";

export const dynamic = "force-dynamic";

export default function RsvpPage() {
  const closed = rsvpClosed();
  const deadline = new Date(env.rsvpDeadline);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-center text-4xl">Votre réponse</h1>
        <p className="mt-2 text-center text-muted">
          Une seule réponse pour vous et les personnes qui vous accompagnent.
        </p>
        {!Number.isNaN(deadline.getTime()) && (
          <p className="mt-1 text-center text-sm text-muted">
            {closed ? "Les réponses sont closes depuis le " : "Réponse souhaitée avant le "}
            {deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <RsvpForm readOnly={closed} />
      </main>
    </>
  );
}
