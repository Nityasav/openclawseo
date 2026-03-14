import { createClient } from "@/lib/supabase/server";
import { fetchGscData } from "@/lib/integrations/gsc";
import { decrypt } from "@/lib/encryption";
import { DashboardHeader } from "@/components/dashboard/header";
import { RankingsView } from "./rankings-view";

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

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function RankingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <DashboardHeader title="Rankings" description="Monitor your SERP positions over time" />
        <div className="p-6 text-center text-gray-400">Please sign in to view rankings.</div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return (
      <div>
        <DashboardHeader title="Rankings" description="Monitor your SERP positions over time" />
        <div className="p-6 text-center text-gray-400">No organization found.</div>
      </div>
    );
  }

  const { data: integration } = await supabase
    .from("integrations")
    .select("access_token, refresh_token")
    .eq("org_id", profile.org_id)
    .eq("provider", "gsc")
    .single();

  const { data: sites } = await supabase
    .from("sites")
    .select("id, domain, gsc_property_url")
    .eq("org_id", profile.org_id)
    .eq("is_sandbox", false)
    .not("gsc_property_url", "is", null);

  const site = sites?.[0];

  if (!integration?.access_token || !site?.gsc_property_url) {
    return (
      <div>
        <DashboardHeader title="Rankings" description="Monitor your SERP positions over time" />
        <div className="p-6 text-center text-gray-400">
          <p className="text-lg font-medium">No GSC data available</p>
          <p className="mt-1 text-sm">Connect Google Search Console and select a property in Settings to see live ranking data.</p>
        </div>
      </div>
    );
  }

  let rankings: LiveRankingRow[] = [];
  let pages: PageRow[] = [];
  let dailyData: DateRow[] = [];
  let error: string | null = null;

  try {
    const accessToken = decrypt(integration.access_token);
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : "";

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
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to fetch GSC data";
  }

  return (
    <div>
      <DashboardHeader title="Rankings" description="Live Google Search Console data — last 28 days vs previous 28 days" />
      <div className="p-6">
        {error ? (
          <div className="text-center text-red-500">
            <p className="font-medium">Error loading GSC data</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : (
          <RankingsView
            rankings={rankings}
            pages={pages}
            dailyData={dailyData}
            siteId={site.id}
            domain={site.domain}
          />
        )}
      </div>
    </div>
  );
}
