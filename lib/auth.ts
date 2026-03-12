import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | undefined;
  name: string | undefined;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const name =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    undefined;
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: name || undefined,
  };
}
