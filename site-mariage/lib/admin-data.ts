import { db, ResponseRow, Person } from "./supabase";

export type ResponseWithPeople = ResponseRow & { people: Person[] };

export async function loadAll(): Promise<ResponseWithPeople[]> {
  const supabase = db();
  const [r, p] = await Promise.all([
    supabase.from("responses").select("*").order("created_at", { ascending: false }),
    supabase.from("people").select("*").order("position"),
  ]);
  if (r.error) throw r.error;
  if (p.error) throw p.error;
  const byResponse = new Map<string, Person[]>();
  for (const person of (p.data ?? []) as Person[]) {
    const arr = byResponse.get(person.response_id) ?? [];
    arr.push(person);
    byResponse.set(person.response_id, arr);
  }
  return ((r.data ?? []) as ResponseRow[]).map((row) => ({ ...row, people: byResponse.get(row.id) ?? [] }));
}

export function stats(responses: ResponseWithPeople[]) {
  const presentPeople = responses.filter((r) => r.attending).flatMap((r) => r.people);
  const absentPeople = responses.filter((r) => !r.attending).flatMap((r) => r.people);
  return {
    responses: responses.length,
    present: presentPeople.length,
    absent: absentPeople.length,
    children: presentPeople.filter((p) => p.is_child).length,
    adults: presentPeople.filter((p) => !p.is_child).length,
    allergies: presentPeople.filter((p) => p.has_allergies).length,
  };
}
