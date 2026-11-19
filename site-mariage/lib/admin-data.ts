import { db, Household, Guest } from "./supabase";

export type HouseholdWithGuests = Household & { guests: Guest[] };

export async function loadAll(): Promise<HouseholdWithGuests[]> {
  const supabase = db();
  const [h, g] = await Promise.all([
    supabase.from("households").select("*").order("name"),
    supabase.from("guests").select("*").order("is_companion").order("created_at"),
  ]);
  if (h.error) throw h.error;
  if (g.error) throw g.error;
  const byHousehold = new Map<string, Guest[]>();
  for (const guest of (g.data ?? []) as Guest[]) {
    const arr = byHousehold.get(guest.household_id) ?? [];
    arr.push(guest);
    byHousehold.set(guest.household_id, arr);
  }
  return ((h.data ?? []) as Household[]).map((hh) => ({ ...hh, guests: byHousehold.get(hh.id) ?? [] }));
}

export function stats(households: HouseholdWithGuests[]) {
  const guests = households.flatMap((h) => h.guests);
  const present = guests.filter((g) => g.attending === true);
  return {
    households: households.length,
    householdsAnswered: households.filter((h) => h.responded_at).length,
    householdsPending: households.filter((h) => !h.responded_at).length,
    present: present.length,
    absent: guests.filter((g) => g.attending === false).length,
    seatsPlanned: households.reduce((s, h) => s + h.max_guests, 0),
    companions: present.filter((g) => g.is_companion).length,
    children: present.filter((g) => g.is_child).length,
    allergies: present.filter((g) => g.has_allergies),
  };
}
