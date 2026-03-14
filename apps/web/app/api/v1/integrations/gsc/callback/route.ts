import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/integrations/gsc";
import { encrypt } from "@/lib/encryption";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(error)}&tab=integrations`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard/settings?error=No+code&tab=integrations`);
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.org_id ?? await ensureUserProfile(user);
    if (!orgId) {
      return NextResponse.redirect(`${origin}/dashboard/settings?error=Failed+to+create+organization&tab=integrations`);
    }

    const tokens = await exchangeCodeForTokens(code);

    // Store encrypted tokens
    await supabase.from("integrations").upsert({
      org_id: orgId,
      provider: "gsc",
      access_token: tokens.access_token ? encrypt(tokens.access_token) : null,
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    }, { onConflict: "org_id,provider" });

    return NextResponse.redirect(`${origin}/dashboard/settings?success=gsc_connected&tab=integrations`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(message)}&tab=integrations`
    );
  }
}
