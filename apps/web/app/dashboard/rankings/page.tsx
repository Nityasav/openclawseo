import { createClient } from "@/lib/supabase/server";
import { fetchGscFull, type GscFullData } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { DashboardHeader } from "@/components/dashboard/header";
import { RankingsView } from "./rankings-view";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import Link from "next/link";

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

<<<<<<< HEAD
  let rankings: LiveRankingRow[] = [];
  let pages: PageRow[] = [];
  let dailyData: DateRow[] = [];
=======
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
>>>>>>> refs/remotes/origin/main
  let error: string | null = null;

  try {
    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

<<<<<<< HEAD
    const now = new Date();
    // GSC data has ~3 day lag
    const currentEnd = new Date(now);
    currentEnd.setDate(currentEnd.getDate() - 3);
    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - 28); // 28 days for more data
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 28);

    // Fetch query, page, and date data in parallel
    const [currentQueryRows, prevQueryRows, currentPageRows, prevPageRows, dateRows] = await Promise.all([
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(currentStart), formatDate(currentEnd), { dimensions: ["query"], rowLimit: 1000 }),
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(prevStart), formatDate(prevEnd), { dimensions: ["query"], rowLimit: 1000 }),
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(currentStart), formatDate(currentEnd), { dimensions: ["page"], rowLimit: 1000 }),
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(prevStart), formatDate(prevEnd), { dimensions: ["page"], rowLimit: 1000 }),
      fetchGscData(accessToken, refreshToken, site.gsc_property_url, formatDate(currentStart), formatDate(currentEnd), { dimensions: ["date"], rowLimit: 1000 }),
    ]);

    // Build query rankings with deltas
    const prevQueryMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
    for (const row of prevQueryRows) {
      const query = row.keys?.[0] ?? "";
      prevQueryMap.set(query, { clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 });
    }
    for (const row of currentQueryRows) {
      const query = row.keys?.[0] ?? "";
      const prev = prevQueryMap.get(query);
      rankings.push({
        query,
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
        clicks_delta: (row.clicks ?? 0) - (prev?.clicks ?? 0),
        impressions_delta: (row.impressions ?? 0) - (prev?.impressions ?? 0),
        ctr_delta: (row.ctr ?? 0) - (prev?.ctr ?? 0),
        position_delta: (prev?.position ?? row.position ?? 0) - (row.position ?? 0),
      });
    }
    rankings.sort((a, b) => b.impressions - a.impressions);

    // Build page rankings with deltas
    const prevPageMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
    for (const row of prevPageRows) {
      const page = row.keys?.[0] ?? "";
      prevPageMap.set(page, { clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 });
    }
    for (const row of currentPageRows) {
      const page = row.keys?.[0] ?? "";
      const prev = prevPageMap.get(page);
      pages.push({
        page,
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
        clicks_delta: (row.clicks ?? 0) - (prev?.clicks ?? 0),
        impressions_delta: (row.impressions ?? 0) - (prev?.impressions ?? 0),
        ctr_delta: (row.ctr ?? 0) - (prev?.ctr ?? 0),
        position_delta: (prev?.position ?? row.position ?? 0) - (row.position ?? 0),
      });
    }
    pages.sort((a, b) => b.impressions - a.impressions);

    // Build daily time series
    for (const row of dateRows) {
      dailyData.push({
        date: row.keys?.[0] ?? "",
        clicks: row.clicks ?? 0,
        impressions: row.impressions ?? 0,
        ctr: row.ctr ?? 0,
        position: row.position ?? 0,
      });
    }
    dailyData.sort((a, b) => a.date.localeCompare(b.date));
=======
    [gscData, prevGscData] = await Promise.all([
      fetchGscFull(accessToken, refreshToken, site.gsc_property_url, formatDate(startDate), formatDate(endDate)),
      fetchGscFull(accessToken, refreshToken, site.gsc_property_url, formatDate(prevStartDate), formatDate(prevEndDate)),
    ]);
>>>>>>> refs/remotes/origin/main
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch GSC data";
  }

  return (
    <div>
<<<<<<< HEAD
      <DashboardHeader title="Rankings" description="Live Google Search Console data — last 28 days vs previous 28 days" />
=======
      <DashboardHeader
        title="Rankings"
        description={`${site.domain} — Google Search Console full breakdown`}
      />
>>>>>>> refs/remotes/origin/main
      <div className="p-6">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            <p className="font-medium">Error loading GSC data</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
<<<<<<< HEAD
        ) : (
          <RankingsView
            rankings={rankings}
            pages={pages}
            dailyData={dailyData}
            siteId={site.id}
            domain={site.domain}
          />
        )}
=======
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
>>>>>>> refs/remotes/origin/main
      </div>
    </div>
  );
}
