import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { OverviewCharts } from "./overview-charts";
import { RecentRunsTable } from "./recent-runs-table";
import { TriggerRunButton } from "./trigger-run-button";
import { BarChart3, Globe, Key, TrendingUp } from "lucide-react";

export default async function OverviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user!.id)
    .single();

  let sites: { id: string; domain: string }[] = [];
  let keywords: { current_position: number }[] = [];
  let geoRecords: { is_cited: boolean }[] = [];
  let recentRuns: Array<{
    id: string;
    run_type: string;
    status: string;
    created_at: string;
    completed_at: string | null;
  }> = [];

  if (profile?.org_id) {
    const { data: sitesData } = await supabase
      .from("sites")
      .select("id, domain")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false)
      .limit(5);
    sites = sitesData ?? [];

    if (sites.length > 0) {
      const siteIds = sites.map((s) => s.id);

      const { data: kwData } = await supabase
        .from("keywords")
        .select("current_position")
        .in("site_id", siteIds);
      keywords = kwData ?? [];

      const { data: geoData } = await supabase
        .from("geo_records")
        .select("is_cited")
        .in("site_id", siteIds);
      geoRecords = geoData ?? [];

      const { data: runsData } = await supabase
        .from("agent_runs")
        .select("id, run_type, status, created_at, completed_at")
        .in("site_id", siteIds)
        .order("created_at", { ascending: false })
        .limit(10);
      recentRuns = runsData ?? [];
    }
  }

  const totalKeywords = keywords.length;
  const avgPosition =
    keywords.length > 0
      ? Math.round(keywords.reduce((s, k) => s + (k.current_position ?? 0), 0) / keywords.length)
      : 0;
  const citedCount = geoRecords.filter((g) => g.is_cited).length;
  const geoScore =
    geoRecords.length > 0 ? Math.round((citedCount / geoRecords.length) * 100) : 0;
  const lastRun = recentRuns[0]?.created_at ?? null;

  const primarySiteId = sites[0]?.id ?? "";

  return (
    <div>
      <DashboardHeader
        title="Overview"
        description="Your SEO health at a glance"
        actions={<TriggerRunButton siteId={primarySiteId} />}
      />
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Keywords Tracked"
            value={totalKeywords}
            description="across all sites"
            icon={<Key className="h-4 w-4" />}
          />
          <KpiCard
            title="Avg. Position"
            value={avgPosition || "—"}
            description="in search results"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <KpiCard
            title="LLM Citation Score"
            value={`${geoScore}%`}
            description={`${citedCount} of ${geoRecords.length} queries cited`}
            icon={<Globe className="h-4 w-4" />}
          />
          <KpiCard
            title="Last Agent Run"
            value={lastRun ? new Date(lastRun).toLocaleDateString() : "Never"}
            description={recentRuns[0]?.status ?? "No runs yet"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        <div className="mt-6">
          <OverviewCharts keywords={keywords} />
        </div>

        <div className="mt-6">
          <RecentRunsTable runs={recentRuns} />
        </div>
      </div>
    </div>
  );
}
