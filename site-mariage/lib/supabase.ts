import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/** Client serveur uniquement (clé service_role). Ne jamais importer côté navigateur. */
export function db(): SupabaseClient {
  if (!client) {
    if (!env.supabaseUrl || !env.supabaseServiceKey) {
      throw new Error("Supabase non configuré : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY manquants.");
    }
    client = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type Household = {
  id: string;
  code: string;
  name: string;
  max_guests: number;
  created_at: string;
  responded_at: string | null;
};

export type Guest = {
  id: string;
  household_id: string;
  last_name: string;
  first_name: string;
  address: string | null;
  attending: boolean | null;
  is_child: boolean;
  has_allergies: boolean;
  allergy_details: string | null;
  is_companion: boolean;
  created_at: string;
  updated_at: string;
};
