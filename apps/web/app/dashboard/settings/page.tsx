import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { SettingsView } from "./settings-view";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string; success?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user!.id)
    .single();

  let integrations: Array<{ provider: string; config_json: unknown; access_token: string | null }> = [];
  let sites: Array<{ id: string; domain: string; gsc_property_url: string | null; ga4_property_id: string | null }> = [];

  if (profile?.org_id) {
    const { data: intData } = await supabase
      .from("integrations")
      .select("provider, config_json, access_token")
      .eq("org_id", profile.org_id);
    integrations = intData ?? [];

    const { data: siteData } = await supabase
      .from("sites")
      .select("id, domain, gsc_property_url, ga4_property_id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false);
    sites = siteData ?? [];
  }

  const connectedProviders = Array.from(new Set(integrations.filter((i) => i.access_token || i.config_json).map((i) => i.provider)));

  return (
    <div>
      <DashboardHeader title="Settings" description="Manage integrations, sites, and team" />
      <div className="p-6">
        <SettingsView
          defaultTab={searchParams.tab ?? "integrations"}
          successMessage={searchParams.success}
          errorMessage={searchParams.error}
          connectedProviders={connectedProviders}
          sites={sites}
          orgId={profile?.org_id ?? ""}
          integrations={integrations}
        />
      </div>
    </div>
  );
}
