"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Send, CheckCircle, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, Zap, Target, Brain, Code2, ArrowRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  site_id: string;
  title: string | null;
  summary: string | null;
  report_json: unknown;
  delivered_to_slack: boolean;
  created_at: string;
  liveGeoScore?: number;
}

type ReportData = {
  seo_report?: {
    executive_summary?: string;
    overall_health_score?: number;
    top_wins?: Array<{ title: string; description?: string; impact?: string }>;
    critical_issues?: Array<{ title: string; description?: string; urgency?: string }>;
    action_items?: Array<{ action: string; expected_impact?: string; effort?: string; timeline?: string }>;
    keyword_highlights?: { total_tracked?: number; avg_position?: number; position_improved?: number; position_declined?: number };
    next_steps?: string[];
  };
  geo_report?: {
    llm_visibility_score?: number;
    score_breakdown?: { gemini_visibility?: number };
    cited_queries?: number;
    total_queries_checked?: number;
    citation_rate?: number;
    recommendations?: Array<{ priority: string; action: string; expected_lift?: string }>;
    summary?: string;
  };
  keyword_gaps?: Array<{
    keyword: string;
    current_position: number;
    opportunity_score: number;
    search_volume_estimate?: number;
    difficulty_estimate?: number;
    recommended_action?: string;
  }>;
  schema_recommendations?: Array<{ schema_type: string; priority: string; rationale: string; affected_queries?: string[] }>;
  summary?: string;
  tokens_used?: number;
};

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-4 ${color}`}>
        <span className="text-lg font-bold">{score}</span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-red-500/10 text-red-400 border-red-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[priority] ?? map.low}`}>
      {priority}
    </span>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
      <span className="text-white/40">{icon}</span>
      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/60">{title}</h4>
    </div>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const data = report.report_json as ReportData | null;
  const seo = data?.seo_report;
  const geo = data?.geo_report;
  const healthScore = seo?.overall_health_score;
  // Prefer geo_records-based score (same source as dashboard); fall back to agent-generated score
  const geoScore = report.liveGeoScore ?? (geo?.llm_visibility_score || undefined);

  async function sendToDiscord() {
    setSending(true);
    try {
      const res = await fetch("/api/v1/integrations/discord/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: report.id }),
      });
      const result = await res.json();
      if (result.success) toast({ title: "Sent to Discord!" });
      else toast({ title: "Failed", description: result.error, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-white/[0.06]">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-white/30 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/80 truncate">{report.title ?? "SEO Report"}</p>
            <p className="text-xs text-white/30 mt-0.5">{formatDate(report.created_at)}</p>
            {data?.tokens_used && (
              <p className="text-[10px] text-white/20 mt-0.5">{data.tokens_used.toLocaleString()} tokens used</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {report.delivered_to_slack && (
            <Badge variant="success" className="flex items-center gap-1 text-[10px]">
              <CheckCircle className="h-3 w-3" /> Delivered
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={sendToDiscord} disabled={sending} className="text-[11px]">
            <Send className="mr-1.5 h-3 w-3" />
            {sending ? "Sending..." : "Send to Discord"}
          </Button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Summary + scores — always visible */}
      <div className="px-5 py-4">
        <p className="text-sm text-white/50 leading-relaxed">
          {seo?.executive_summary ?? data?.summary ?? report.summary ?? "No summary available."}
        </p>

        {(healthScore !== undefined || geoScore !== undefined) && (
          <div className="flex gap-6 mt-4">
            {healthScore !== undefined && (
              <ScoreRing
                score={healthScore}
                label="SEO Health"
                color={healthScore >= 75 ? "border-green-500/60" : healthScore >= 50 ? "border-yellow-500/60" : "border-red-500/60"}
              />
            )}
            {geoScore !== undefined && (
              <ScoreRing score={geoScore} label="LLM Visibility" color="border-blue-500/60" />
            )}
            {seo?.keyword_highlights && (
              <div className="flex flex-col justify-center gap-1 text-xs text-white/40 ml-4">
                <span>{seo.keyword_highlights.total_tracked ?? 0} keywords tracked</span>
                <span className="text-green-400">+{seo.keyword_highlights.position_improved ?? 0} improved</span>
                <span className="text-red-400">−{seo.keyword_highlights.position_declined ?? 0} declined</span>
                <span>avg. pos. {seo.keyword_highlights.avg_position ?? "—"}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded full report */}
      {expanded && data && (
        <div className="px-5 pb-6 space-y-6 border-t border-white/[0.06] pt-5">

          {/* Critical Issues */}
          {seo?.critical_issues && seo.critical_issues.length > 0 && (
            <div className="space-y-3">
              <SectionHeader icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Critical Issues" />
              <div className="space-y-2">
                {seo.critical_issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-red-500/5 border border-red-500/10 px-3 py-2.5">
                    <div className="mt-0.5 shrink-0">
                      <PriorityBadge priority={issue.urgency ?? "high"} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{issue.title}</p>
                      {issue.description && <p className="text-xs text-white/40 mt-0.5">{issue.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Wins */}
          {seo?.top_wins && seo.top_wins.length > 0 && (
            <div className="space-y-3">
              <SectionHeader icon={<TrendingUp className="h-3.5 w-3.5" />} title="Top Wins" />
              <div className="space-y-2">
                {seo.top_wins.map((win, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-green-500/5 border border-green-500/10 px-3 py-2.5">
                    <div className="mt-0.5 shrink-0">
                      <PriorityBadge priority={win.impact ?? "low"} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{win.title}</p>
                      {win.description && <p className="text-xs text-white/40 mt-0.5">{win.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword Opportunities */}
          {data.keyword_gaps && data.keyword_gaps.length > 0 && (
            <div className="space-y-3">
              <SectionHeader icon={<Target className="h-3.5 w-3.5" />} title="Keyword Opportunities" />
              <div className="overflow-x-auto rounded-md border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Keyword</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Position</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Score</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Vol. Est.</th>
                      <th className="px-3 py-2 text-[10px] uppercase tracking-widest text-white/25">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {data.keyword_gaps.map((kw, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 font-medium text-white/70">{kw.keyword}</td>
                        <td className="px-3 py-2.5 text-yellow-400">{kw.current_position}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-16 rounded-full bg-white/10">
                              <div
                                className="h-1.5 rounded-full bg-blue-500"
                                style={{ width: `${kw.opportunity_score}%` }}
                              />
                            </div>
                            <span className="text-white/40">{kw.opportunity_score}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-white/40">
                          {kw.search_volume_estimate?.toLocaleString() ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-white/40 max-w-[200px] truncate">
                          {kw.recommended_action ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Items */}
          {seo?.action_items && seo.action_items.length > 0 && (
            <div className="space-y-3">
              <SectionHeader icon={<Zap className="h-3.5 w-3.5" />} title="Action Items" />
              <div className="space-y-2">
                {seo.action_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md border border-white/[0.06] px-3 py-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70">{item.action}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {item.expected_impact && (
                          <span className="text-[10px] text-green-400">{item.expected_impact}</span>
                        )}
                        {item.effort && (
                          <span className="text-[10px] text-white/30">Effort: {item.effort}</span>
                        )}
                        {item.timeline && (
                          <span className="text-[10px] text-white/30">{item.timeline}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GEO / LLM Visibility */}
          {geo && (
            <div className="space-y-3">
              <SectionHeader icon={<Brain className="h-3.5 w-3.5" />} title="LLM Visibility (GEO)" />
              <div className="grid grid-cols-1 gap-3 max-w-[160px]">
                <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-center">
                  <p className="text-lg font-bold text-white/80">{geoScore ?? geo.score_breakdown?.gemini_visibility ?? "—"}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Gemini</p>
                </div>
              </div>
              {geo.cited_queries !== undefined && (
                <p className="text-xs text-white/40">
                  {geo.cited_queries} of {geo.total_queries_checked} queries cited · {geo.citation_rate?.toFixed(1)}% citation rate
                </p>
              )}
              {geo.recommendations && geo.recommendations.length > 0 && (
                <div className="space-y-2 mt-2">
                  {geo.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <PriorityBadge priority={rec.priority} />
                      <div>
                        <span className="text-white/60">{rec.action}</span>
                        {rec.expected_lift && (
                          <span className="ml-2 text-[10px] text-green-400">{rec.expected_lift}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schema Recommendations */}
          {data.schema_recommendations && data.schema_recommendations.length > 0 && (
            <div className="space-y-3">
              <SectionHeader icon={<Code2 className="h-3.5 w-3.5" />} title="Schema Recommendations" />
              <div className="space-y-2">
                {data.schema_recommendations.map((rec, i) => (
                  <div key={i} className="rounded-md border border-white/[0.06] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{rec.schema_type}</code>
                      <PriorityBadge priority={rec.priority} />
                    </div>
                    <p className="text-xs text-white/40 mt-1.5">{rec.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {seo?.next_steps && seo.next_steps.length > 0 && (
            <div className="space-y-3">
              <SectionHeader icon={<ArrowRight className="h-3.5 w-3.5" />} title="Next Steps" />
              <ol className="space-y-1.5">
                {seo.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                    <span className="text-white/20 shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReportsList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-16 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-white/20" />
        <p className="text-sm font-medium text-white/30">No reports yet</p>
        <p className="mt-1 text-xs text-white/20">Run an agent audit to generate your first report.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
