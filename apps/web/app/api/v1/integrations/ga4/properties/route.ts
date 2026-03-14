import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createGA4OAuth2Client } from "@/lib/integrations/ga4";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 403 });
    }

    const { data: integration } = await supabase
      .from("integrations")
      .select("access_token, refresh_token")
      .eq("org_id", profile.org_id)
      .eq("provider", "ga4")
      .single();

    if (!integration?.access_token) {
      return NextResponse.json({ success: false, error: "GA4 not connected" }, { status: 404 });
    }

    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

    // Use Analytics Admin API to list GA4 accounts and properties
    const oauth2Client = createGA4OAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth: oauth2Client });

    // List all accounts
    const accountsRes = await analyticsAdmin.accounts.list();
    const accounts = accountsRes.data.accounts ?? [];

    // For each account, list properties
    const results: Array<{ accountId: string; accountName: string; propertyId: string; propertyName: string; websiteUrl?: string }> = [];

    await Promise.all(
      accounts.map(async (account) => {
        try {
          const propsRes = await analyticsAdmin.properties.list({
            filter: `parent:${account.name}`,
          });
          const props = propsRes.data.properties ?? [];
          for (const prop of props) {
            results.push({
              accountId: account.name ?? "",
              accountName: account.displayName ?? "",
              propertyId: prop.name?.replace("properties/", "") ?? "",
              propertyName: prop.displayName ?? "",
              websiteUrl: prop.websiteUri ?? undefined,
            });
          }
        } catch {
          // Skip accounts we can't access
        }
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch GA4 properties";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
