import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { GeoView } from "./geo-view";

export default async function GeoPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user!.id)
    .single();

  let geoRecords: Array<{
    id: string;
    query: string;
    llm_source: string | null;
    is_cited: boolean;
    citation_url: string | null;
    schema_injected: boolean;
    checked_at: string;
  }> = [];

  if (profile?.org_id) {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false);

    if (sites?.length) {
      const { data } = await supabase
        .from("geo_records")
        .select("*")
        .in("site_id", sites.map((s) => s.id))
        .order("checked_at", { ascending: false })
        .limit(200);
      geoRecords = data ?? [];
    }
  }

  const citedCount = geoRecords.filter((r) => r.is_cited).length;
  const geoScore = geoRecords.length > 0 ? Math.round((citedCount / geoRecords.length) * 100) : 0;

  return (
    <div>
      <DashboardHeader title="GEO / LLM Visibility" description="Track how often LLMs cite your content" />
      <div className="p-6">
        <GeoView geoRecords={geoRecords} geoScore={geoScore} />
      </div>
    </div>
  );
}
