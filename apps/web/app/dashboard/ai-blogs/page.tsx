import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Keyword, GeoRecord, AiBlogPost } from "@/types/schemas";
import { AiBlogsEditor } from "./ui/ai-blogs-editor";

export default async function AiBlogsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user!.id)
    .single();

  let siteId: string | null = null;
  let keywords: Keyword[] = [];
  let geoRecords: GeoRecord[] = [];
  let blogs: AiBlogPost[] = [];

  if (profile?.org_id) {
    const { data: sites } = await supabase
      .from("sites")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("is_sandbox", false)
      .limit(1);

    if (sites && sites.length > 0) {
      siteId = sites[0].id;

      const [{ data: kwData }, { data: geoData }, { data: blogData }] =
        await Promise.all([
          supabase
            .from("keywords")
            .select("*")
            .eq("site_id", siteId)
            .order("opportunity_score", { ascending: false })
            .limit(100),
          supabase
            .from("geo_records")
            .select("*")
            .eq("site_id", siteId)
            .order("checked_at", { ascending: false })
            .limit(100),
          supabase
            .from("ai_blog_posts")
            .select("*")
            .eq("org_id", profile.org_id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

      keywords = (kwData as Keyword[] | null) ?? [];
      geoRecords = (geoData as GeoRecord[] | null) ?? [];
      blogs = (blogData as AiBlogPost[] | null) ?? [];
    }
  }

  const suggestedKeyword = keywords[0]?.keyword ?? "";
  const suggestedGeoPrompt = geoRecords[0]?.query
    ? `Write a comprehensive, citation-friendly blog that answers the query "${geoRecords[0].query}" and related LLM questions about this topic.`
    : "";

  const totalPosts = blogs.length;
  const publishedCount = blogs.filter((b) => b.status === "published").length;
  const draftCount = totalPosts - publishedCount;

  return (
    <div>
      <DashboardHeader
        title="AI-optimized blogs"
        description="Generate, optimize, and manage AI-crafted blog posts for Answer Engines and SEO."
      />
      <div className="p-6">
        <AiBlogsEditor
          siteId={siteId}
          initialBlogs={blogs}
          suggestedKeyword={suggestedKeyword}
          suggestedPrompt={suggestedGeoPrompt}
          stats={{
            totalPosts,
            publishedCount,
            draftCount,
          }}
        />
      </div>
    </div>
  );
}

