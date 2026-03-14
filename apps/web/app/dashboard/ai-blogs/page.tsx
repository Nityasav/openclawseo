import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { Keyword, AiBlogPost } from "@/types/schemas";
import { AiBlogsEditor } from "./ui/ai-blogs-editor";
import { generateText } from "@/lib/gemini/generate";

function getDefaultPrompt(query: string) {
  return query;
}

const MAX_QUERY_WORDS = 10;

/** Extract one short search-query phrase from model output (no LLM fluff). */
function parseQueryFromModelOutput(raw: string, keyword: string): string {
  const oneLine = raw.split(/\n|\.|:/)[0].trim();
  const noQuotes = oneLine.replace(/^["'\s]+|["'\s]+$/g, "").replace(/^(\w+:\s*)+/i, "").trim();
  const words = noQuotes.split(/\s+/).filter(Boolean).slice(0, MAX_QUERY_WORDS);
  return words.join(" ").trim();
}

/** Backend: get one realistic Google search query for this keyword. Never return the bare keyword. */
async function suggestQueryFromKeyword(keyword: string): Promise<string> {
  const fallback = `best ${keyword}`;
  try {
    const prompt = `You must respond with exactly one Google search query (4-8 words) that a real user would type. The query must INCLUDE the topic but add more words (e.g. "best X", "how to X", "X guide 2024"). Do not respond with only the single topic word.

Topic: ${keyword}

Your single-line query (4-8 words):`;
    const raw = await generateText(prompt);
    const phrase = parseQueryFromModelOutput(raw, keyword);
    const clean = phrase.toLowerCase().trim();
    const kw = keyword.toLowerCase().trim();
    if (!phrase || clean === kw || phrase.split(/\s+/).filter(Boolean).length < 2) return fallback;
    return phrase;
  } catch {
    return fallback;
  }
}

export default async function AiBlogsPage({
  searchParams,
}: {
  searchParams?: { primary?: string; keywordId?: string };
}) {
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

      const [{ data: kwData }, { data: blogData }] = await Promise.all([
        supabase
          .from("keywords")
          .select("*")
          .eq("site_id", siteId)
          .order("opportunity_score", { ascending: false })
          .limit(100),
        supabase
          .from("ai_blog_posts")
          .select("*")
          .eq("org_id", profile.org_id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      keywords = (kwData as Keyword[] | null) ?? [];
      blogs = (blogData as AiBlogPost[] | null) ?? [];
    }
  }

  const urlPrimary = searchParams?.primary ? decodeURIComponent(searchParams.primary) : null;

  // When coming from Keywords "Fix this": resolve prompt query from rankings (GSC) data
  let initialPrimaryKeyword: string | null = null;
  let initialSuggestedPrompt = "";
  if (urlPrimary) {
    initialPrimaryKeyword = urlPrimary;
    // Always get prompt from backend (Gemini) so it's never just the keyword repeated
    initialSuggestedPrompt = await suggestQueryFromKeyword(urlPrimary);
  }

  const suggestedKeyword = initialPrimaryKeyword ?? keywords[0]?.keyword ?? "";
  const suggestedGeoPrompt =
    initialSuggestedPrompt || (suggestedKeyword ? getDefaultPrompt(suggestedKeyword) : "");

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
          fromKeywordFix={!!urlPrimary}
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

