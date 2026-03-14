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
    title: string | null;
    summary: string | null;
    report_json: unknown;
    delivered_to_slack: boolean;
    created_at: string;
  }> = [];

  if (profile?.org_id) {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id);

    if (sites?.length) {
      const { data } = await supabase
        .from("reports")
        .select("id, title, summary, report_json, delivered_to_slack, created_at")
        .in("site_id", sites.map((s) => s.id))
        .order("created_at", { ascending: false })
        .limit(50);
      reports = data ?? [];
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
