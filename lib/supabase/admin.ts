import { createClient } from "@supabase/supabase-js";
import { normalizePublicSupabaseUrl } from "./public-env";

/**
 * Server-only Supabase client with service role. Use only in API routes or server actions.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl?.trim() || !key?.trim()) {
    throw new Error(
      "Missing Supabase admin env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  const url = normalizePublicSupabaseUrl(rawUrl);
  return createClient(url, key.trim(), { auth: { persistSession: false } });
}
