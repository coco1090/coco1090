import { db, Household, Guest } from "./supabase";
import { normalizeCode } from "./codes";

export async function findHouseholdByCode(raw: string): Promise<Household | null> {
  const code = normalizeCode(raw);
  if (code.length < 4) return null;
  const { data } = await db().from("households").select("*").eq("code", code).maybeSingle();
  return (data as Household) ?? null;
}

export async function getHousehold(id: string): Promise<Household | null> {
  const { data } = await db().from("households").select("*").eq("id", id).maybeSingle();
  return (data as Household) ?? null;
}

export async function getGuests(householdId: string): Promise<Guest[]> {
  const { data } = await db()
    .from("guests")
    .select("*")
    .eq("household_id", householdId)
    .order("is_companion")
    .order("created_at");
  return (data as Guest[]) ?? [];
}
