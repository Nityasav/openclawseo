import { createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, parseGscState } from "@/lib/integrations/gsc";
import { encrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const rawState = searchParams.get("state") ?? "";

  const { source, userId } = parseGscState(rawState);
  const isOnboarding = source === "onboarding";

  const errorRedirect = isOnboarding
    ? `${origin}/onboarding?step=2&error=${encodeURIComponent(error ?? "oauth_error")}`
    : `${origin}/dashboard/settings?error=${encodeURIComponent(error ?? "No code")}&tab=integrations`;

  if (error) {
    return NextResponse.redirect(errorRedirect);
  }

  if (!code) {
    return NextResponse.redirect(
      isOnboarding
        ? `${origin}/onboarding?step=2&error=No+code`
        : `${origin}/dashboard/settings?error=No+code&tab=integrations`
    );
  }

  if (!userId) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  try {
    // Use service role client — avoids relying on the user's session cookie
    // surviving the cross-domain OAuth redirect from Google.
    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    const orgId = profile?.org_id;
    if (!orgId) {
      return NextResponse.redirect(`${origin}/dashboard/settings?error=Profile+not+found&tab=integrations`);
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

    const successRedirect = isOnboarding
      ? `${origin}/onboarding?step=2&connected=gsc`
      : `${origin}/dashboard/settings?success=gsc_connected&tab=integrations`;

    return NextResponse.redirect(successRedirect);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      isOnboarding
        ? `${origin}/onboarding?step=2&error=${encodeURIComponent(message)}`
        : `${origin}/dashboard/settings?error=${encodeURIComponent(message)}&tab=integrations`
    );
  }
}
