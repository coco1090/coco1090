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

export type ResponseRow = {
  id: string;
  last_name: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  attending: boolean;
  message: string | null;
  created_at: string;
};

export type Person = {
  id: string;
  response_id: string;
  first_name: string;
  last_name: string;
  is_child: boolean;
  has_allergies: boolean;
  allergy_details: string | null;
  position: number;
};
