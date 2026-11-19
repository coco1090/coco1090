export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "alizee78410!",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
  rsvpDeadline: process.env.RSVP_DEADLINE ?? "2027-04-15T23:59:59+02:00",
};

export function rsvpClosed(): boolean {
  const d = new Date(env.rsvpDeadline);
  return !Number.isNaN(d.getTime()) && Date.now() > d.getTime();
}
