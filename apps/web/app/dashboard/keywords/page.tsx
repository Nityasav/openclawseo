import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { KeywordsTable } from "./keywords-table";

export default async function KeywordsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user!.id)
    .single();

  let keywords: Array<{
    id: string;
    keyword: string;
    current_position: number | null;
    previous_position: number | null;
    search_volume: number | null;
    difficulty: number | null;
    opportunity_score: number | null;
    last_checked_at: string | null;
  }> = [];

  if (profile?.org_id) {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false);

    if (sites && sites.length > 0) {
      const { data: kwData } = await supabase
        .from("keywords")
        .select("*")
        .in("site_id", sites.map((s) => s.id))
        .order("opportunity_score", { ascending: false })
        .limit(500);
      keywords = kwData ?? [];
    }
  }

  return (
    <div>
      <DashboardHeader
        title="Keywords"
        description="Track and optimize your keyword rankings"
      />
      <div className="p-6">
        <KeywordsTable keywords={keywords} />
      </div>
    </div>
  );
}
