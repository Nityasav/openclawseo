"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "../../../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AlertCircle, Loader2, FileText, Trash2, UploadCloud, Save, Edit3, Code2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type BlogStatus = "draft" | "published";

type ScheduleFrequency = "daily" | "weekly" | "twice_weekly" | "monthly";

export interface AiBlog {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  primary_keyword: string | null;
  secondary_keyword: string | null;
  prompt: string | null;
  content_html: string | null;
  word_count: number | null;
  read_time_minutes: number | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

interface Stats {
  totalPosts: number;
  publishedCount: number;
  draftCount: number;
}

interface Props {
  siteId: string | null;
  initialBlogs: AiBlog[];
  suggestedKeyword: string;
  suggestedPrompt: string;
  stats: Stats;
}

export function AiBlogsEditor({
  siteId,
  initialBlogs,
  suggestedKeyword,
  suggestedPrompt,
  stats,
}: Props) {
  const [blogs, setBlogs] = useState<AiBlog[]>(initialBlogs);
  const [activeId, setActiveId] = useState<string | null>(initialBlogs[0]?.id ?? null);
  const [primaryKeyword, setPrimaryKeyword] = useState(suggestedKeyword);
  const [secondaryKeyword, setSecondaryKeyword] = useState("");
  const [prompt, setPrompt] = useState(suggestedPrompt);
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"editor" | "html">("editor");
  const [activeSection, setActiveSection] = useState<"create" | "schedule">("create");
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>("weekly");

  const wordCount = useMemo(() => {
    if (!html) return 0;
    const text = html.replace(/<[^>]+>/g, " ");
    return text
      .split(/\s+/)
      .map((w) => w.trim())
      .filter(Boolean).length;
  }, [html]);

  const readTimeMinutes = useMemo(() => {
    if (!wordCount) return 0;
    return Math.max(1, Math.round(wordCount / 200));
  }, [wordCount]);

  const HARDCODED_TITLES = [
    "Plan Week’s Posts",
    "Update Evergreen Hub Post",
    "New Answer Engine Explainer",
    "Refresh Old Post for 2026",
    "Geo Audit + Local SEO Playbook",
    "Write Guest Post for Partner",
    "Reader Question: Schema for AI",
    "Comment on Industry Forums",
    "Link Roundup: LLM SEO Reads",
    "Deep Dive: AI-Assisted Keyword Research",
    "Thought Leadership: Future of Search",
    "Case Study: Answer Engine Wins",
    "Beginner’s Guide: LLM Visibility",
    "Technical SEO for AI Crawlers",
    "Repurpose Webinar into Blog",
    "Interview with SEO Leader",
    "Checklist: Launching New Content Cluster",
    "Content Brief: Comparison Page",
    "Google vs Answer Engines Strategy",
    "On-Page Optimization Refresh",
    "Long-Form Guide: Entity SEO",
    "Product-Led SEO Use Cases",
    "Analytics Review & Content Gaps",
    "Newsletter Recap as Blog",
    "SaaS Feature Spotlight Article",
    "Roundup: Team’s Top Insights",
    "Internal Linking Sprint",
    "Write Industry Predictions Post",
    "Republish Top Performer with Updates",
    "Q&A: Common Client Questions",
    "Framework: Build Topic Authority",
    "Launch New Series: AI & Content",
    "SEO Experiments Journal",
    "Behind the Scenes: Our Stack",
    "Playbook: Handling Algorithm Shifts",
    "Benchmark Report Summary",
    "Guide: From Search to Chat",
    "Answer Engine Optimization Checklist",
    "Opinion: Metrics That Actually Matter",
    "Launch Recap & Next Month Plan",
  ];

  const plannedSchedule = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastOfMonth.getDate();

    const items: { date: Date; title: string }[] = [];

    // number of posts to place in the month based on frequency
    const postsPerMonth: Record<ScheduleFrequency, number> = {
      daily: daysInMonth,
      weekly: 8,
      twice_weekly: 16,
      monthly: 4,
    };
    const totalPlanned = postsPerMonth[scheduleFrequency];

    // spread posts roughly evenly across the month
    const step = daysInMonth / totalPlanned;
    for (let i = 0; i < totalPlanned; i++) {
      const day = Math.max(1, Math.min(daysInMonth, Math.round(1 + i * step)));
      const date = new Date(year, month, day);
      items.push({
        date,
        title: HARDCODED_TITLES[i % HARDCODED_TITLES.length],
      });
    }

    return {
      monthLabel: firstOfMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      items,
      firstOfMonth,
      daysInMonth,
      leadingEmpty: firstOfMonth.getDay(),
    };
  }, [scheduleFrequency]);

  function hydrateEditorFromBlog(blog: AiBlog) {
    setActiveId(blog.id);
    setPrimaryKeyword(blog.primary_keyword ?? "");
    setSecondaryKeyword(blog.secondary_keyword ?? "");
    setPrompt(blog.prompt ?? "");
    setTitle(blog.title);
    setHtml(blog.content_html ?? "");
    setError(null);
  }

  async function handleGenerate() {
    if (!primaryKeyword || !prompt) {
      setError("Primary keyword and prompt are required to generate a blog.");
      return;
    }
    setLoadingGenerate(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai-blogs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryKeyword,
          secondaryKeyword: secondaryKeyword || null,
          prompt,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to generate blog");
      }
      setTitle(data.title ?? "");
      setHtml(data.html ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function persistBlog(nextStatus?: BlogStatus) {
    if (!title || !html) {
      setError("Title and content are required to save.");
      return;
    }
    setLoadingSave(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai-blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeId,
          site_id: siteId,
          title,
          html,
          primary_keyword: primaryKeyword || null,
          secondary_keyword: secondaryKeyword || null,
          prompt: prompt || null,
          status: nextStatus ?? "draft",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save blog");
      }
      const saved: AiBlog = data.blog;
      setActiveId(saved.id);
      setBlogs((prev) => {
        const others = prev.filter((b) => b.id !== saved.id);
        return [saved, ...others];
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoadingSave(false);
    }
  }

  async function handleDelete(id: string) {
    setLoadingSave(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai-blogs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to delete blog");
      }
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setTitle("");
        setHtml("");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoadingSave(false);
    }
  }

  function handleCopyHtml() {
    if (!html) return;
    navigator.clipboard.writeText(html).catch(() => {
      setError("Failed to copy HTML to clipboard.");
    });
  }

  const totalPosts = stats.totalPosts ?? blogs.length;
  const publishedCount = stats.publishedCount ?? blogs.filter((b) => b.status === "published").length;
  const draftCount = stats.draftCount ?? totalPosts - publishedCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Drafts and published AI-optimized blogs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visible in your public blog experience
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for review and optimization
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-md border bg-muted p-0.5 text-xs">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium",
              activeSection === "create" && "bg-background shadow-sm"
            )}
            onClick={() => setActiveSection("create")}
          >
            <Edit3 className="h-4 w-4" />
            Create & edit
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium",
              activeSection === "schedule" && "bg-background shadow-sm"
            )}
            onClick={() => setActiveSection("schedule")}
          >
            <FileText className="h-4 w-4" />
            Scheduling
          </button>
        </div>
      </div>

      {activeSection === "create" ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Create new blog post</CardTitle>
                <CardDescription>
                  Configure your article inputs. We&apos;ll generate a long-form, answer-engine-ready blog.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Primary keyword <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. answer engine optimization"
                    value={primaryKeyword}
                    onChange={(e) => setPrimaryKeyword(e.target.value)}
                  />
                  {suggestedKeyword && !primaryKeyword && (
                    <p className="text-xs text-muted-foreground">
                      Suggested from your keyword table: <strong>{suggestedKeyword}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Secondary keyword</label>
                  <Input
                    placeholder="e.g. llm tracking for seo"
                    value={secondaryKeyword}
                    onChange={(e) => setSecondaryKeyword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Prompt to answer <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="e.g. How are answer engines changing SEO strategies for B2B SaaS?"
                    rows={4}
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setPrompt(e.target.value)
                    }
                  />
                  {suggestedPrompt && !prompt && (
                    <p className="text-xs text-muted-foreground">
                      Suggested from recent GEO / LLM queries.
                    </p>
                  )}
                </div>

                <Button
                  className="mt-2 w-full"
                  onClick={handleGenerate}
                  disabled={loadingGenerate}
                >
                  {loadingGenerate ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating blog…
                    </>
                  ) : (
                    "Generate blog"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full flex flex-col">
              <CardHeader className="space-y-2 border-b">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Editing: {title || "Untitled blog"}</CardTitle>
                    <CardDescription>
                      Optimize structure, then save as draft or publish.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyHtml}
                      disabled={!html}
                    >
                      <FileText className="mr-1.5 h-4 w-4" />
                      Copy HTML
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{readTimeMinutes} min read</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blog title</label>
                  <Input
                    placeholder="Answer Engines vs SEO: Ultimate Optimization Guide"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium">Blog content</label>
                    <div className="inline-flex rounded-md border bg-muted p-0.5 text-xs">
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-2 py-0.5",
                          viewMode === "editor" && "bg-background shadow-sm"
                        )}
                        onClick={() => setViewMode("editor")}
                      >
                        <Eye className="h-3 w-3" />
                        Editor
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 rounded px-2 py-0.5",
                          viewMode === "html" && "bg-background shadow-sm"
                        )}
                        onClick={() => setViewMode("html")}
                      >
                        <Code2 className="h-3 w-3" />
                        HTML
                      </button>
                    </div>
                  </div>

                  {viewMode === "editor" ? (
                    <RichTextEditor value={html} onChange={setHtml} />
                  ) : (
                    <Textarea
                      className="min-h-[260px] font-mono text-xs"
                      value={html}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setHtml(e.target.value)
                      }
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={() => persistBlog("draft")}
                    disabled={loadingSave}
                  >
                    {loadingSave ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              All blog posts
            </h2>
            {blogs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Generated blogs will appear here once you save your first draft.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => hydrateEditorFromBlog(blog)}
                    className={cn(
                      "flex h-full flex-col justify-between rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted",
                      activeId === blog.id && "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{blog.title}</span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {blog.primary_keyword ?? blog.prompt ?? "AI-optimized blog post"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {blog.word_count && <span>{blog.word_count} words</span>}
                        {blog.read_time_minutes && (
                          <>
                            <span>•</span>
                            <span>{blog.read_time_minutes} min read</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          blog.status === "published"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        )}
                      >
                        {blog.status === "published" ? "Published" : "Draft"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            hydrateEditorFromBlog(blog);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={async (e) => {
                            e.stopPropagation();
                            hydrateEditorFromBlog(blog);
                            await persistBlog("published");
                          }}
                          disabled={loadingSave}
                        >
                          <UploadCloud className="mr-1 h-3 w-3" />
                          Publish
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(blog.id);
                          }}
                          disabled={loadingSave}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex min-h-[70vh] flex-col">
          <div className="mb-4 flex items-center gap-2 border-b pb-3">
            <span className="text-sm text-muted-foreground">Post frequency:</span>
            <div className="flex gap-1">
              {(["daily", "weekly", "twice_weekly", "monthly"] as const).map((freq) => (
                <Button
                  key={freq}
                  type="button"
                  variant={scheduleFrequency === freq ? "default" : "ghost"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setScheduleFrequency(freq)}
                >
                  {freq === "twice_weekly" ? "2×/week" : freq === "monthly" ? "Monthly" : freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{plannedSchedule.monthLabel}</p>
            <div className="grid grid-cols-7 gap-px rounded-lg border bg-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-muted/80 px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {Array.from({ length: plannedSchedule.leadingEmpty }).map((_, idx) => (
                <div key={`empty-${idx}`} className="min-h-[100px] bg-muted/50" />
              ))}
              {Array.from({ length: plannedSchedule.daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const cellDate = new Date(
                  plannedSchedule.firstOfMonth.getFullYear(),
                  plannedSchedule.firstOfMonth.getMonth(),
                  dayNumber
                );
                const plannedForDay = plannedSchedule.items.filter(
                  (item) => item.date.getDate() === dayNumber
                );

                return (
                  <div
                    key={cellDate.toISOString()}
                    className={cn(
                      "flex min-h-[100px] flex-col bg-background p-2 text-xs",
                      plannedForDay.length > 0 && "bg-blue-50/40 dark:bg-blue-950/15"
                    )}
                  >
                    <span className="text-[11px] font-medium text-muted-foreground">{dayNumber}</span>
                    <div className="mt-1 space-y-1">
                      {plannedForDay.slice(0, 3).map((planned, index) => (
                        <div
                          key={planned.title + index}
                          className={cn(
                            "truncate rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white",
                            index % 3 === 0 && "bg-blue-500",
                            index % 3 === 1 && "bg-amber-500",
                            index % 3 === 2 && "bg-emerald-500"
                          )}
                        >
                          {planned.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

