"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  GitFork,
  Loader2,
  ScrollText,
  Star,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PROFILE_COLORS, INDUSTRY_COLORS } from "@/lib/sandbox/scenario";
import type { ScenarioConfig, WalkthroughStep } from "@/lib/sandbox/scenario";
import { isScenarioConfig } from "@/lib/sandbox/scenario";
import { cn } from "@/lib/utils";

interface TemplateRow {
  id: string;
  scenario_name: string | null;
  scenario_config: unknown;
  template: string;
  role: string;
  walkthrough_steps: WalkthroughStep[];
  created_at: string;
  access_token: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TemplateLibrary() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [expiringId, setExpiringId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/v1/sandbox/templates");
        const data = await res.json();
        if (data.success) setTemplates(data.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  async function forkTemplate(id: string, accessToken: string) {
    setForkingId(id);
    try {
      const res = await fetch(`/api/v1/sandbox/${id}/fork`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const link = `${window.location.origin}/sandbox/demo?token=${encodeURIComponent(data.data.access_token ?? accessToken)}`;
        navigator.clipboard.writeText(link).catch(() => {});
        toast({ title: "Fresh sandbox launched!", description: `Link copied: ${link.slice(0, 60)}…` });
      } else {
        toast({ title: "Fork failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setForkingId(null);
    }
  }

  async function expireTemplate(id: string) {
    setExpiringId(id);
    try {
      const res = await fetch(`/api/v1/sandbox/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast({ title: "Template removed from library" });
      }
    } finally {
      setExpiringId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates…
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="py-12 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="text-sm font-medium text-white/50">No templates saved yet.</p>
          <p className="mt-1 text-xs text-white/30">
            Record a walkthrough in any demo sandbox, then click <strong className="text-white/50">"Save as Template"</strong> to add it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
          <BookOpen className="h-4 w-4 text-white/50" />
          Template Library
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">{templates.length}</span>
        </CardTitle>
        <p className="text-xs text-white/40 mt-1">
          Launch a fresh sandbox from any saved template. Walkthroughs are copied so they're immediately ready for demos.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/40">
                <th className="pb-2.5 pl-4 pr-4 pt-2.5">Name</th>
                <th className="pb-2.5 pr-4 hidden md:table-cell">Industry</th>
                <th className="pb-2.5 pr-4 hidden md:table-cell">Profile</th>
                <th className="pb-2.5 pr-4 hidden sm:table-cell">Steps</th>
                <th className="pb-2.5 pr-4 hidden lg:table-cell">Created</th>
                <th className="pb-2.5 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {templates.map((t) => {
                const config: ScenarioConfig | null = isScenarioConfig(t.scenario_config) ? t.scenario_config : null;
                const steps: WalkthroughStep[] = Array.isArray(t.walkthrough_steps) ? t.walkthrough_steps : [];
                const isExpanded = expandedId === t.id;

                return (
                  <>
                    <tr key={t.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="py-3 pl-4 pr-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : t.id)}
                            className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
                            disabled={steps.length === 0}
                          >
                            {steps.length > 0
                              ? isExpanded
                                ? <ChevronDown className="h-3.5 w-3.5" />
                                : <ChevronRight className="h-3.5 w-3.5" />
                              : <span className="h-3.5 w-3.5 inline-block" />
                            }
                          </button>
                          <span className="font-medium text-white/90 text-sm">
                            {t.scenario_name ?? `${t.template.replace(/_/g, " ")} template`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        {config ? (
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", INDUSTRY_COLORS[config.industry])}>
                            {config.industry.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        {config ? (
                          <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", PROFILE_COLORS[config.dataProfile])}>
                            {config.dataProfile.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-white/60">
                          <ScrollText className="h-3 w-3" />
                          <span className="text-xs">{steps.length}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-white/40 hidden lg:table-cell">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => forkTemplate(t.id, t.access_token)}
                            disabled={forkingId === t.id}
                            title="Launch a fresh copy of this sandbox"
                            className="h-7 text-xs text-white/60 hover:text-white"
                          >
                            {forkingId === t.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <><GitFork className="mr-1 h-3 w-3" />Launch</>
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => expireTemplate(t.id)}
                            disabled={expiringId === t.id}
                            title="Remove from library"
                            className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {expiringId === t.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Trash2 className="h-3 w-3" />
                            }
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline step accordion */}
                    {isExpanded && steps.length > 0 && (
                      <tr key={`${t.id}-steps`} className="bg-white/[0.01]">
                        <td colSpan={6} className="px-4 pb-4 pt-2">
                          <ol className="space-y-2">
                            {steps.map((step, i) => (
                              <li key={step.id} className="flex items-start gap-3">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-white/50">
                                  {i + 1}
                                </span>
                                <div>
                                  <p className="text-xs font-medium text-white/80">{step.title}</p>
                                  {step.description && (
                                    <p className="text-xs text-white/40 mt-0.5">{step.description}</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
