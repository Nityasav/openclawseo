import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Very permissive schemas to avoid blocking saves during editing
const DeleteBlogSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    // Fallback: if user has no org yet (sandbox / first-time setup),
    // attach blog posts directly to their user id as a pseudo-org.
    const orgId: string = profile?.org_id ?? user.id;

    const body = await request.json();
    const {
      id,
      site_id,
      title,
      html,
      primary_keyword,
      secondary_keyword,
      prompt,
      status,
    } = body as {
      id?: string;
      site_id?: string | null;
      title?: string;
      html?: string;
      primary_keyword?: string | null;
      secondary_keyword?: string | null;
      prompt?: string | null;
      status?: "draft" | "published";
    };

    if (!title || !html) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    const wordCount = html
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const slug = slugBase || `ai-blog-${Date.now()}`;

    const payload = {
      site_id: site_id ?? null,
      org_id: orgId,
      title,
      slug,
      status,
      primary_keyword: primary_keyword ?? null,
      secondary_keyword: secondary_keyword ?? null,
      prompt: prompt ?? null,
      content_html: html,
      word_count: wordCount,
      read_time_minutes: readTimeMinutes,
      published_at: status === "published" ? new Date().toISOString() : null,
    };

    let blogRow;

    if (id) {
      const { data, error } = await supabase
        .from("ai_blog_posts")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("org_id", profile.org_id)
        .select()
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: error?.message ?? "Failed to update blog" },
          { status: 500 }
        );
      }
      blogRow = data;
    } else {
      const { data, error } = await supabase
        .from("ai_blog_posts")
        .insert({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: error?.message ?? "Failed to create blog" },
          { status: 500 }
        );
      }
      blogRow = data;
    }

    // Return the raw row; client only relies on a subset of fields.
    return NextResponse.json({ success: true, blog: blogRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = DeleteBlogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    const { error } = await supabase.from("ai_blog_posts").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message ?? "Failed to delete blog" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

