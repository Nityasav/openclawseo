import { createClient } from "@/lib/supabase/server";
import { fetchGscFull, type GscFullData } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { DashboardHeader } from "@/components/dashboard/header";
import { RankingsView } from "./rankings-view";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import Link from "next/link";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams?: { range?: string; site?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <DashboardHeader title="Rankings" description="Google Search Console — full performance breakdown" />
        <div className="p-6 text-center text-gray-400">Please sign in.</div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.org_id ?? await ensureUserProfile(user);

  if (!orgId) {
    return (
      <div>
        <DashboardHeader title="Rankings" description="Google Search Console — full performance breakdown" />
        <div className="p-6 text-center text-gray-400">No organization found.</div>
      </div>
    );
  }

  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token, refresh_token")
    .eq("org_id", orgId)
    .eq("provider", "gsc")
    .single();

  const { data: sites } = await supabase
    .from("sites")
    .select("id, domain, gsc_property_url")
    .eq("org_id", orgId)
    .eq("is_sandbox", false)
    .not("gsc_property_url", "is", null);

  const site = searchParams?.site
    ? sites?.find((s) => s.id === searchParams.site) ?? sites?.[0]
    : sites?.[0];

  if (!integration?.access_token || !site?.gsc_property_url) {
    return (
      <div>
        <DashboardHeader title="Rankings" description="Google Search Console — full performance breakdown" />
        <div className="p-6 text-center">
          <p className="text-lg font-medium text-gray-700">No GSC data available</p>
          <p className="mt-1 text-sm text-gray-400">
            Connect Google Search Console and select a property in{" "}
            <Link href="/dashboard/settings?tab=integrations" className="text-blue-600 hover:underline">
              Settings
            </Link>{" "}
            to see live ranking data.
          </p>
        </div>
      </div>
    );
  }

  const rangeDays = parseInt(searchParams?.range ?? "28", 10);
  const now = new Date();
  // GSC has ~3 day lag
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() - 3);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - rangeDays);

  // Previous period for delta calculation
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - rangeDays);

  let gscData: GscFullData | null = null;
  let prevGscData: GscFullData | null = null;
  let error: string | null = null;

  try {
    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

    [gscData, prevGscData] = await Promise.all([
      fetchGscFull(accessToken, refreshToken, site.gsc_property_url, formatDate(startDate), formatDate(endDate)),
      fetchGscFull(accessToken, refreshToken, site.gsc_property_url, formatDate(prevStartDate), formatDate(prevEndDate)),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch GSC data";
  }

  return (
    <div>
      <DashboardHeader
        title="Rankings"
        description={`${site.domain} — Google Search Console full breakdown`}
      />
      <div className="p-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            <p className="font-medium">Error loading GSC data</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : gscData ? (
          <RankingsView
            gscData={gscData}
            prevGscData={prevGscData}
            siteId={site.id}
            domain={site.domain}
            siteUrl={site.gsc_property_url!}
            allSites={sites ?? []}
            rangeDays={rangeDays}
          />
        ) : null}
      </div>
    </div>
  );
}
