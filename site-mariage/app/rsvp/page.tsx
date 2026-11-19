import { redirect } from "next/navigation";
import { getGuestHouseholdId } from "@/lib/session";
import { getHousehold, getGuests } from "@/lib/households";
import { rsvpClosed, env } from "@/lib/env";
import { Nav } from "@/components/Nav";
import { RsvpForm } from "@/components/RsvpForm";

export const dynamic = "force-dynamic";

export default async function RsvpPage() {
  const householdId = await getGuestHouseholdId();
  const household = householdId ? await getHousehold(householdId) : null;
  if (!household) redirect("/");
  const guests = await getGuests(household.id);
  const closed = rsvpClosed();
  const deadline = new Date(env.rsvpDeadline);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-center text-4xl">Votre réponse</h1>
        <p className="mt-2 text-center text-muted">
          {household.name} · {household.max_guests} place{household.max_guests > 1 ? "s" : ""} réservée
          {household.max_guests > 1 ? "s" : ""}
        </p>
        {!Number.isNaN(deadline.getTime()) && (
          <p className="mt-1 text-center text-sm text-muted">
            {closed ? "Les réponses sont closes depuis le " : "Réponse souhaitée avant le "}
            {deadline.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        <RsvpForm
          household={{ id: household.id, name: household.name, max_guests: household.max_guests }}
          initialGuests={guests}
          readOnly={closed}
        />
      </main>
    </>
  );
}
