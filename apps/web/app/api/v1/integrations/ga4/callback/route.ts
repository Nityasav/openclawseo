import { createClient } from "@/lib/supabase/server";
import { exchangeGA4CodeForTokens } from "@/lib/integrations/ga4";
import { encrypt } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(error ?? "No code")}&tab=integrations`
    );
  }

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(`${origin}/auth/login`);

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.redirect(`${origin}/dashboard/settings?error=No+org&tab=integrations`);
    }

    const tokens = await exchangeGA4CodeForTokens(code);

    await supabase.from("integrations").upsert({
      org_id: profile.org_id,
      provider: "ga4",
      access_token: tokens.access_token ? encrypt(tokens.access_token) : null,
      refresh_token: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
    }, { onConflict: "org_id,provider" });

    return NextResponse.redirect(`${origin}/dashboard/settings?success=ga4_connected&tab=integrations`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      `${origin}/dashboard/settings?error=${encodeURIComponent(message)}&tab=integrations`
    );
  }
}
