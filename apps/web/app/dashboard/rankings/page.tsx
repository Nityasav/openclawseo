import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { RankingsView } from "./rankings-view";

export default async function RankingsPage() {
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
  }> = [];

  if (profile?.org_id) {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false);

    if (sites?.length) {
      const { data } = await supabase
        .from("keywords")
        .select("id, keyword, current_position, previous_position, search_volume")
        .in("site_id", sites.map((s) => s.id))
        .order("current_position", { ascending: true })
        .limit(200);
      keywords = data ?? [];
    }
  }

  const significantDrops = keywords.filter((kw) => {
    const delta = (kw.previous_position ?? 0) - (kw.current_position ?? 0);
    return delta < -5;
  });

  return (
    <div>
      <DashboardHeader title="Rankings" description="Monitor your SERP positions over time" />
      <div className="p-6">
        <RankingsView keywords={keywords} significantDrops={significantDrops} />
      </div>
    </div>
  );
}
