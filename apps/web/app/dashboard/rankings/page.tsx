import { createClient } from "@/lib/supabase/server";
import { fetchGscFull } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { DashboardHeader } from "@/components/dashboard/header";
import { RankingsView } from "./rankings-view";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import Link from "next/link";

export interface LiveRankingRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicks_delta: number;
  impressions_delta: number;
  ctr_delta: number;
  position_delta: number;
}

export interface PageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicks_delta: number;
  impressions_delta: number;
  ctr_delta: number;
  position_delta: number;
}

export interface DateRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface DeviceRow {
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface CountryRow {
  country: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface QueryPageRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function RankingsPage() {
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

  const site = sites?.[0];

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

  const now = new Date();
  // GSC has ~3 day lag
  const currentEnd = new Date(now);
  currentEnd.setDate(currentEnd.getDate() - 3);
  const currentStart = new Date(currentEnd);
  currentStart.setDate(currentStart.getDate() - 28);

  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 28);

  let rankings: LiveRankingRow[] = [];
  let pages: PageRow[] = [];
  let dailyData: DateRow[] = [];
  let devicesData: DeviceRow[] = [];
  let countriesData: CountryRow[] = [];
  let queryPagesData: QueryPageRow[] = [];
  let error: string | null = null;

  try {
    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

    const [currentData, prevData] = await Promise.all([
      fetchGscFull(accessToken, refreshToken, site.gsc_property_url, formatDate(currentStart), formatDate(currentEnd)),
      fetchGscFull(accessToken, refreshToken, site.gsc_property_url, formatDate(prevStart), formatDate(prevEnd)),
    ]);

    // Build prev maps
    const prevQueryMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
    for (const r of prevData.queries) {
      prevQueryMap.set(r.keys?.[0] ?? "", {
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }

    const prevPageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
    for (const r of prevData.pages) {
      prevPageMap.set(r.keys?.[0] ?? "", {
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }

    // Build rankings (queries)
    for (const r of currentData.queries) {
      const query = r.keys?.[0] ?? "";
      const prev = prevQueryMap.get(query);
      rankings.push({
        query,
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
        clicks_delta: (r.clicks ?? 0) - (prev?.clicks ?? 0),
        impressions_delta: (r.impressions ?? 0) - (prev?.impressions ?? 0),
        ctr_delta: (r.ctr ?? 0) - (prev?.ctr ?? 0),
        position_delta: (prev?.position ?? r.position ?? 0) - (r.position ?? 0),
      });
    }
    rankings.sort((a, b) => b.impressions - a.impressions);

    // Build pages
    for (const r of currentData.pages) {
      const page = r.keys?.[0] ?? "";
      const prev = prevPageMap.get(page);
      pages.push({
        page,
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
        clicks_delta: (r.clicks ?? 0) - (prev?.clicks ?? 0),
        impressions_delta: (r.impressions ?? 0) - (prev?.impressions ?? 0),
        ctr_delta: (r.ctr ?? 0) - (prev?.ctr ?? 0),
        position_delta: (prev?.position ?? r.position ?? 0) - (r.position ?? 0),
      });
    }
    pages.sort((a, b) => b.clicks - a.clicks);

    // Build daily trend
    for (const r of currentData.dateTrend) {
      dailyData.push({
        date: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }
    dailyData.sort((a, b) => a.date.localeCompare(b.date));

    // Build devices
    for (const r of currentData.devices) {
      devicesData.push({
        device: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }
    devicesData.sort((a, b) => b.clicks - a.clicks);

    // Build countries
    for (const r of currentData.countries) {
      countriesData.push({
        country: r.keys?.[0] ?? "",
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }
    countriesData.sort((a, b) => b.clicks - a.clicks);

    // Build query x page pairs
    for (const r of currentData.queryPages) {
      const query = r.keys?.[0] ?? "";
      const page = r.keys?.[1] ?? "";
      queryPagesData.push({
        query,
        page,
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        ctr: r.ctr ?? 0,
        position: r.position ?? 0,
      });
    }
    queryPagesData.sort((a, b) => b.impressions - a.impressions);

  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch GSC data";
  }

  return (
    <div>
      <DashboardHeader
        title="Rankings"
        description={`${site.domain} — GSC data: queries, pages, devices, countries (last 28 days)`}
      />
      <div className="p-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            <p className="font-medium">Error loading GSC data</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : (
          <RankingsView
            rankings={rankings}
            pages={pages}
            dailyData={dailyData}
            devices={devicesData}
            countries={countriesData}
            queryPages={queryPagesData}
            siteId={site.id}
            domain={site.domain}
          />
        )}
      </div>
    </div>
  );
}
