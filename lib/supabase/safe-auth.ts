type SupabaseLike = {
  auth: {
    getSession: () => Promise<{ data?: { session?: unknown | null } }>;
    getUser: () => Promise<{ data?: { user?: unknown | null } }>;
  };
};

/**
 * Returns null instead of throwing when auth network calls fail.
 * This prevents noisy "TypeError: Failed to fetch" crashes in client effects.
 */
export async function safeGetSession<TSession = unknown>(
  supabase: SupabaseLike
): Promise<TSession | null> {
  try {
    const res = await supabase.auth.getSession();
    return (res.data?.session as TSession | null | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns null instead of throwing when auth network calls fail.
 */
export async function safeGetUser<TUser = unknown>(
  supabase: SupabaseLike
): Promise<TUser | null> {
  try {
    const res = await supabase.auth.getUser();
    return (res.data?.user as TUser | null | undefined) ?? null;
  } catch {
    return null;
  }
}

