import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { ReportsList } from "./reports-list";

export default async function ReportsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user!.id)
    .single();

  let reports: Array<{
    id: string;
    site_id: string;
    title: string | null;
    summary: string | null;
    report_json: unknown;
    delivered_to_slack: boolean;
    created_at: string;
    liveGeoScore?: number;
  }> = [];

  if (profile?.org_id) {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id);

    if (sites?.length) {
      const siteIds = sites.map((s) => s.id);

      const [{ data: reportsData }, { data: geoData }] = await Promise.all([
        supabase
          .from("reports")
          .select("id, site_id, title, summary, report_json, delivered_to_slack, created_at")
          .in("site_id", siteIds)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("geo_records")
          .select("site_id, is_cited")
          .in("site_id", siteIds),
      ]);

      // Build per-site geo score using the same formula as the dashboard
      const geoScoreBySite: Record<string, number> = {};
      if (geoData?.length) {
        const bySite: Record<string, { cited: number; total: number }> = {};
        for (const row of geoData) {
          if (!bySite[row.site_id]) bySite[row.site_id] = { cited: 0, total: 0 };
          bySite[row.site_id].total++;
          if (row.is_cited) bySite[row.site_id].cited++;
        }
        for (const [siteId, { cited, total }] of Object.entries(bySite)) {
          geoScoreBySite[siteId] = Math.round((cited / total) * 100);
        }
      }

      reports = (reportsData ?? []).map((r) => ({
        ...r,
        liveGeoScore: geoScoreBySite[r.site_id],
      }));
    }
  }

  return (
    <div>
      <DashboardHeader title="Reports" description="Your autonomous SEO reports" />
      <div className="p-6">
        <ReportsList reports={reports} />
      </div>
    </div>
  );
}
