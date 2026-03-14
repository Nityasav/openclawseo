import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini/generate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const primaryKeyword: string | undefined = body.primaryKeyword;
    const secondaryKeyword: string | null | undefined = body.secondaryKeyword;
    const prompt: string | undefined = body.prompt;

    if (!primaryKeyword || !prompt) {
      return NextResponse.json(
        { success: false, error: "primaryKeyword and prompt are required" },
        { status: 400 }
      );
    }

    const longTail = secondaryKeyword ? `${primaryKeyword}, ${secondaryKeyword}` : primaryKeyword;

    const systemPrompt = `
You are an expert SEO & Answer Engine Optimization content writer.
Write a long-form blog article optimized for both traditional search and LLM answer engines.

Mimic the structure and tone of a polished, data-backed SaaS SEO blog post like the Dr. Tobias example in the design:

- Use a single, compelling <h1> title.
- Immediately follow with a bold "Keywords:" line listing the primary and related keywords.
- Include:
  - An opening summary section with 1–2 short paragraphs.
  - A "Key Takeaways" section with 3–6 bullet points.
  - 3–6 main <h2> sections, each with concise paragraphs and occasional bullet lists.
  - Optional <h3> subsections to break up longer sections.
  - A clear "Conclusion" section.
  - An "FAQ" section with 3–5 question/answer pairs.
  - A final "Sources" section with 3–6 credible-looking sources (name + URL) in an unordered list.

- Weave in statistics and concrete examples (you may invent reasonable numbers, but they should look realistic).
- Make the content skimmable: short paragraphs, descriptive headings, and bullet lists.

Primary keyword: "${primaryKeyword}"
Secondary / related keywords: "${longTail}"
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

