import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Ensures a user always has an org + profile record.
 * Safe to call on every request — uses upsert so it's idempotent.
 * This is a fallback for when the DB trigger didn't fire (e.g. existing users,
 * or accounts created before the schema migration was run).
 */
export async function ensureUserProfile(user: User): Promise<string | null> {
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (existing?.org_id) return existing.org_id;

  // Create org
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "My";

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: `${displayName}'s Organization` })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("ensureUserProfile: failed to create org", orgError);
    return null;
  }

  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      org_id: org.id,
      role: "admin",
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    }, { onConflict: "id" });

  if (profileError) {
    console.error("ensureUserProfile: failed to create profile", profileError);
    return null;
  }

  return org.id;
}
