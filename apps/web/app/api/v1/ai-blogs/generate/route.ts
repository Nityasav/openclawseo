import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini/generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const primaryKeyword: string | undefined = body.primaryKeyword;
    const prompt: string | undefined = body.prompt;

    if (!primaryKeyword || !prompt) {
      return NextResponse.json(
        { success: false, error: "primaryKeyword and prompt are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are an expert SEO & Answer Engine Optimization content writer.
Write a long-form blog article optimized for both traditional search and LLM answer engines.

Mimic the structure and tone of a polished, data-backed SEO blog post with real citations (e.g. Dr. Tobias expert guides):

- Use a single, compelling <h1> title.
- Immediately follow with a bold "Keywords:" line listing the primary keyword only.
- Include:
  - An opening summary section with 1–2 short paragraphs.
  - A "Key Takeaways" section with 3–6 bullet points.
  - 3–6 main <h2> sections, each with concise paragraphs and occasional bullet lists.
  - Optional <h3> subsections to break up longer sections.
  - A clear "Conclusion" section.
  - An "FAQ" section with 3–5 question/answer pairs.
  - A final "Sources" section with 3–6 credible sources as an unordered list: each item must be a real, clickable link with style="color:#2563eb;text-decoration:underline", e.g. <a href="https://..." style="color:#2563eb;text-decoration:underline">Source name</a>.

- Link inline to sources: wherever you cite a statistic, study, or claim, wrap that phrase or sentence in an anchor tag linking to a relevant, credible URL. Use real URLs (research, industry, or authoritative sites). Style every <a> tag so links are blue and underlined: use style="color:#2563eb;text-decoration:underline" on each anchor. Example: <a href="https://example.org/study" style="color:#2563eb;text-decoration:underline">probiotics reduce bloating by up to 50%</a>. Keep link text as normal (do not bold). Every key fact or number should have an inline link where possible.
- Weave in statistics and concrete examples; link each to a plausible real or well-known source URL.
- Make the content skimmable: short paragraphs, descriptive headings, and bullet lists.

Primary keyword: "${primaryKeyword}"
Prompt to answer: "${prompt}"

Return clean HTML only (no outer <html> or <body> tags).
    `.trim();

    const html = await generateText(systemPrompt);

    // Derive a simple title guess from the first line if possible
    const firstHeadingMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title =
      (firstHeadingMatch && firstHeadingMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim()) ||
      primaryKeyword;

    return NextResponse.json({ success: true, html, title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

