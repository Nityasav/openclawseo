"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  BarChart3,
  BookOpen,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Key,
  Link2,
  Loader2,
  MapPin,
  ScrollText,
  ShieldAlert,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { formatNumber, getPositionBadgeColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SyntheticSiteV2 } from "@/lib/sandbox/generator";
import type { SandboxFeatureFlags } from "@/lib/sandbox/scenario";
import { useSandbox } from "@/lib/sandbox/context";
import { useWalkthrough } from "@/hooks/use-walkthrough";

interface DemoInterfaceProps {
  data: SyntheticSiteV2;
  expiresAt: string;
  sandboxId: string;
  featureFlags?: SandboxFeatureFlags;
}

// ─── Timer ─────────────────────────────────────────────────────────────────────

function ExpiryTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);
  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
      <Clock className="h-4 w-4 shrink-0" />
      {timeLeft}
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

type ExportFormat = "csv-keywords" | "csv-gsc" | "csv-ga4" | "json";
const EXPORT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "csv-keywords", label: "Keywords (CSV)" },
  { value: "csv-gsc", label: "Search Console (CSV)" },
  { value: "csv-ga4", label: "Analytics (CSV)" },
  { value: "json", label: "All Data (JSON)" },
];

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h] ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    ),
  ].join("\n");
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── SEO Health Score ──────────────────────────────────────────────────────────

function SeoHealthScoreCard({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-amber-400" :
    score >= 40 ? "text-orange-400" :
    "text-red-400";
  const ringColor =
    score >= 80 ? "stroke-emerald-500" :
    score >= 60 ? "stroke-amber-500" :
    score >= 40 ? "stroke-orange-500" :
    "stroke-red-500";
  const label =
    score >= 80 ? "Healthy" :
    score >= 60 ? "Needs Work" :
    score >= 40 ? "At Risk" :
    "Critical";

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
          <Star className="h-4 w-4 text-white/50" />
          SEO Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={cn("text-2xl font-bold", color)}>{score}</span>
            <span className="text-[10px] text-white/40">/100</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className={cn("text-lg font-semibold", color)}>{label}</p>
          <p className="text-sm text-white/50 max-w-xs">
            {score >= 80
              ? "Strong technical foundation with clean crawlability and solid backlink profile."
              : score >= 60
              ? "Minor issues detected. Fixing crawl errors and improving Core Web Vitals would boost rankings."
              : score >= 40
              ? "Multiple issues impacting organic visibility. Prioritize critical technical fixes."
              : "Significant technical debt is suppressing rankings. Immediate action required."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Technical Issues ──────────────────────────────────────────────────────────

function TechnicalIssuesCard({ issues }: { issues: import("@/lib/sandbox/generator").TechnicalIssue[] }) {
  const severityConfig = {
    critical: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
    warning:  { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    info:     { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  };
  const critical = issues.filter((i) => i.severity === "critical").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
            <ShieldAlert className="h-4 w-4 text-white/50" />
            Technical Issues
          </CardTitle>
          <div className="flex items-center gap-2">
            {critical > 0 && (
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                {critical} critical
              </span>
            )}
            {warnings > 0 && (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                {warnings} warnings
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {issues.map((issue, i) => {
            const cfg = severityConfig[issue.severity];
            return (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{issue.description}</span>
                    <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cfg.badge)}>
                      {issue.severity}
                    </span>
                    {issue.count > 1 && (
                      <span className="text-xs text-white/40">{issue.count} pages</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/40">{issue.url}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Backlinks ─────────────────────────────────────────────────────────────────

function BacklinksCard({ backlinks }: { backlinks: import("@/lib/sandbox/generator").BacklinkData[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? backlinks : backlinks.slice(0, 8);
  const avgDR = Math.round(backlinks.reduce((s, b) => s + b.domain_rating, 0) / Math.max(backlinks.length, 1));
  const dofollow = backlinks.filter((b) => b.link_type === "dofollow").length;

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
            <Link2 className="h-4 w-4 text-white/50" />
            Backlink Profile
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">{backlinks.length} links · Avg DR {avgDR} · {dofollow} dofollow</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/40">
                <th className="pb-2.5 pl-4 pr-4 pt-2.5">Domain</th>
                <th className="pb-2.5 pr-4">DR</th>
                <th className="pb-2.5 pr-4">Anchor</th>
                <th className="pb-2.5 pr-4">Type</th>
                <th className="pb-2.5 pr-4">First Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {visible.map((b, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="py-2 pl-4 pr-4 font-medium text-white/80 text-xs">{b.referring_domain}</td>
                  <td className="py-2 pr-4">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-bold",
                      b.domain_rating >= 70 ? "bg-emerald-500/10 text-emerald-400" :
                      b.domain_rating >= 40 ? "bg-blue-500/10 text-blue-400" :
                      "bg-white/5 text-white/50"
                    )}>
                      {b.domain_rating}
                    </span>
                  </td>
                  <td className="py-2 pr-4 max-w-[200px] truncate text-xs text-white/60">{b.anchor_text}</td>
                  <td className="py-2 pr-4">
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider",
                      b.link_type === "dofollow" ? "text-emerald-400" : "text-white/40"
                    )}>
                      {b.link_type}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-white/40">{b.first_seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {backlinks.length > 8 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 text-xs text-white/50 hover:text-white"
          >
            {showAll ? "Show less" : `Show all ${backlinks.length} backlinks`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Geo Citations ─────────────────────────────────────────────────────────────

function GeoCitationsCard({ citations }: { citations: import("@/lib/sandbox/generator").GeoCitation[] }) {
  const perfect = citations.filter((c) => c.nap_score === 100).length;
  const avgScore = Math.round(citations.reduce((s, c) => s + c.nap_score, 0) / Math.max(citations.length, 1));

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
            <MapPin className="h-4 w-4 text-white/50" />
            Local Citations / NAP Consistency
          </CardTitle>
          <span className="text-xs text-white/40">{perfect}/{citations.length} perfect · Avg {avgScore}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {citations.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
              <div className="relative h-8 w-8 shrink-0">
                <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14"
                    fill="none"
                    stroke={c.nap_score >= 90 ? "#10b981" : c.nap_score >= 70 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 14}
                    strokeDashoffset={2 * Math.PI * 14 * (1 - c.nap_score / 100)}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                  {c.nap_score}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white/80">{c.platform}</p>
                <div className="mt-0.5 flex gap-1.5">
                  {(["name", "address", "phone"] as const).map((field) => {
                    const match = field === "name" ? c.name_match : field === "address" ? c.address_match : c.phone_match;
                    return (
                      <span key={field} className={cn("text-[9px] font-semibold uppercase", match ? "text-emerald-400" : "text-red-400")}>
                        {field[0].toUpperCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/30">N = Name, A = Address, P = Phone match</p>
      </CardContent>
    </Card>
  );
}

// ─── Page Speed ────────────────────────────────────────────────────────────────

function PageSpeedCard({ metrics }: { metrics: import("@/lib/sandbox/generator").PageSpeedMetrics }) {
  function scoreColor(s: number) {
    return s >= 90 ? "text-emerald-400" : s >= 70 ? "text-amber-400" : s >= 50 ? "text-orange-400" : "text-red-400";
  }
  function scoreRing(s: number) {
    return s >= 90 ? "stroke-emerald-500" : s >= 70 ? "stroke-amber-500" : s >= 50 ? "stroke-orange-500" : "stroke-red-500";
  }
  function lcpLabel(ms: number) {
    return ms <= 2500 ? { text: "Good", cls: "text-emerald-400" } : ms <= 4000 ? { text: "Needs Improvement", cls: "text-amber-400" } : { text: "Poor", cls: "text-red-400" };
  }
  function clsLabel(cls: number) {
    return cls <= 0.1 ? { text: "Good", cls: "text-emerald-400" } : cls <= 0.25 ? { text: "Needs Improvement", cls: "text-amber-400" } : { text: "Poor", cls: "text-red-400" };
  }

  const lcp = lcpLabel(metrics.lcp_ms);
  const cls = clsLabel(metrics.cls_score);

  function ScoreGauge({ score, label }: { score: number; label: string }) {
    const r = 28;
    const c = 2 * Math.PI * r;
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="36" cy="36" r={r} fill="none" className={scoreRing(score)} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} />
          </svg>
          <span className={cn("absolute text-sm font-bold", scoreColor(score))}>{score}</span>
        </div>
        <span className="text-xs text-white/50">{label}</span>
      </div>
    );
  }

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
          <Zap className="h-4 w-4 text-white/50" />
          Core Web Vitals & Page Speed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-start gap-8">
          <div className="flex gap-6">
            <ScoreGauge score={metrics.mobile_score} label="Mobile" />
            <ScoreGauge score={metrics.desktop_score} label="Desktop" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "LCP", value: `${(metrics.lcp_ms / 1000).toFixed(1)}s`, status: lcp },
              { label: "CLS", value: metrics.cls_score.toFixed(3), status: cls },
              { label: "FID", value: `${metrics.fid_ms}ms`, status: metrics.fid_ms <= 100 ? { text: "Good", cls: "text-emerald-400" } : { text: "Poor", cls: "text-red-400" } },
              { label: "TTFB", value: `${metrics.ttfb_ms}ms`, status: metrics.ttfb_ms <= 800 ? { text: "Good", cls: "text-emerald-400" } : metrics.ttfb_ms <= 1800 ? { text: "Needs Work", cls: "text-amber-400" } : { text: "Poor", cls: "text-red-400" } },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs font-medium text-white/40">{m.label}</p>
                <p className="text-lg font-bold text-white">{m.value}</p>
                <p className={cn("text-xs font-medium", m.status.cls)}>{m.status.text}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Crawl Errors ──────────────────────────────────────────────────────────────

function CrawlErrorsCard({ errors }: { errors: import("@/lib/sandbox/generator").CrawlError[] }) {
  const byType = errors.reduce<Record<string, number>>((acc, e) => {
    acc[e.error_type] = (acc[e.error_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
            <ShieldAlert className="h-4 w-4 text-red-400/70" />
            Crawl Errors
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(byType).map(([type, count]) => (
              <span key={type} className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/40">
                <th className="pb-2.5 pl-4 pr-4 pt-2.5">Error Type</th>
                <th className="pb-2.5 pr-4">Affected URL</th>
                <th className="pb-2.5 pr-4">Discovered</th>
                <th className="pb-2.5 pr-4">Found On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {errors.slice(0, 12).map((e, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="py-2 pl-4 pr-4">
                    <span className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                      e.error_type === "404" ? "bg-red-500/10 text-red-400" :
                      e.error_type === "500" ? "bg-orange-500/10 text-orange-400" :
                      "bg-amber-500/10 text-amber-400"
                    )}>
                      {e.error_type}
                    </span>
                  </td>
                  <td className="py-2 pr-4 max-w-[220px] truncate font-mono text-xs text-white/60">{e.url}</td>
                  <td className="py-2 pr-4 text-xs text-white/40">{e.discovered_at}</td>
                  <td className="py-2 pr-4 max-w-[180px] truncate font-mono text-xs text-white/40">{e.source_page}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {errors.length > 12 && (
          <p className="mt-2 text-xs text-white/30">+ {errors.length - 12} more errors</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Schema Issues ─────────────────────────────────────────────────────────────

function SchemaIssuesCard({ issues }: { issues: import("@/lib/sandbox/generator").SchemaIssue[] }) {
  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
          <ScrollText className="h-4 w-4 text-white/50" />
          Schema Markup Issues
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">{issues.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {issues.map((issue, i) => (
            <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                  {issue.schema_type}
                </span>
                <span className="font-mono text-xs text-white/50 truncate max-w-[300px]">{issue.page}</span>
              </div>
              <p className="text-sm text-white/80">{issue.issue}</p>
              <p className="text-xs text-emerald-400/80">→ {issue.recommended_fix}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Walkthrough Step Panel ────────────────────────────────────────────────────

function WalkthroughPanel() {
  const { walkthroughSteps, sandboxId, scenarioName, isRecording } = useSandbox();
  const { removeStep, isRemoving } = useWalkthrough();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [templateName, setTemplateName] = useState(scenarioName ?? "");
  const [promoting, setPromoting] = useState(false);

  if (!isRecording && walkthroughSteps.length === 0) return null;

  async function handlePromote() {
    if (!templateName.trim() || !sandboxId) return;
    setPromoting(true);
    try {
      const res = await fetch(`/api/v1/sandbox/${sandboxId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_name: templateName.trim() }),
      });
      if (res.ok) setPromoteOpen(false);
    } finally {
      setPromoting(false);
    }
  }

  return (
    <>
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
              <BookOpen className="h-4 w-4 text-white/50" />
              Walkthrough Steps
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">
                {walkthroughSteps.length}
              </span>
            </CardTitle>
            {walkthroughSteps.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPromoteOpen(true)}
                className="border-white/10 bg-white/[0.04] text-xs text-white hover:bg-white/[0.08]"
              >
                <Star className="mr-1.5 h-3 w-3" />
                Save as Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {walkthroughSteps.length === 0 ? (
            <p className="text-sm text-white/40">
              Press <strong className="text-white/60">Capture Step</strong> in the recording controls to add steps.
            </p>
          ) : (
            <ol className="space-y-2">
              {walkthroughSteps.map((step, i) => (
                <li key={step.id} className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-bold text-white/60">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white/90 text-sm">{step.title}</p>
                    {step.description && (
                      <p className="mt-0.5 text-xs text-white/50">{step.description}</p>
                    )}
                    <p className="mt-1 font-mono text-[10px] text-white/30">
                      scroll:{step.scroll_y}px{step.url_hash ? ` · ${step.url_hash}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(step.id)}
                    disabled={isRemoving === step.id}
                    className="h-7 w-7 shrink-0 text-white/30 hover:text-red-400"
                  >
                    {isRemoving === step.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </Button>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="border-white/[0.08] bg-[#141414] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Star className="h-4 w-4 text-amber-400" />
              Save as Reusable Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-white/50">
              This walkthrough ({walkthroughSteps.length} step{walkthroughSteps.length !== 1 ? "s" : ""}) and its scenario config will be saved to the Template Library so you can launch fresh copies instantly.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Template Name *</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. SaaS Prospect Demo v2"
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/30"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteOpen(false)} className="text-white/60 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={!templateName.trim() || promoting}
              className="bg-white text-black hover:bg-white/90"
            >
              {promoting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function DemoInterface({ data, expiresAt, sandboxId, featureFlags }: DemoInterfaceProps) {
  const [activating, setActivating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleExport(format: ExportFormat) {
    setExportOpen(false);
    const slug = data.domain.replace(/\./g, "_");
    if (format === "json") {
      downloadFile(JSON.stringify(data, null, 2), `${slug}_sandbox.json`, "application/json");
    } else if (format === "csv-keywords") {
      downloadFile(toCSV(data.keywords as unknown as Record<string, unknown>[]), `${slug}_keywords.csv`, "text/csv");
    } else if (format === "csv-gsc") {
      downloadFile(toCSV(data.gsc_data as unknown as Record<string, unknown>[]), `${slug}_search_console.csv`, "text/csv");
    } else if (format === "csv-ga4") {
      downloadFile(toCSV(data.ga4_data as unknown as Record<string, unknown>[]), `${slug}_analytics.csv`, "text/csv");
    }
  }

  const totalKeywords = data.keywords.length;
  const avgPosition = Math.round(data.keywords.reduce((s, k) => s + k.current_position, 0) / totalKeywords);
  const quickWins = data.keywords.filter((k) => k.current_position >= 11 && k.current_position <= 15);
  const criticalDrops = data.keywords.filter((k) => k.delta < -5);
  const totalSessions = data.ga4_data.reduce((s, d) => s + d.sessions, 0);
  const organicSessions = data.ga4_data.reduce((s, d) => s + d.organic_sessions, 0);
  const organicShare = totalSessions > 0 ? Math.round((organicSessions / totalSessions) * 100) : 0;

  async function handleActivate() {
    setActivating(true);
    const res = await fetch(`/api/v1/sandbox/${sandboxId}/migrate`, { method: "POST" });
    const result = await res.json();
    if (result.success && result.data?.redirect_to) window.location.href = result.data.redirect_to;
    setActivating(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Demo top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="warning" className="text-xs font-semibold">DEMO MODE</Badge>
          <span className="text-sm text-white/80">
            Showing synthetic data for <strong className="text-white">{data.domain}</strong>
          </span>
          {data.industry && (
            <span className="hidden rounded border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/50 sm:inline">
              {data.industry} · {data.data_profile}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ExpiryTimer expiresAt={expiresAt} />
          <div ref={exportRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen((o) => !o)}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg border border-white/10 bg-[#141414] py-1 shadow-xl">
                {EXPORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleExport(opt.value)}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleActivate} disabled={activating} size="sm">
            {activating ? "Activating..." : "Activate Live Account"}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-white" strokeWidth={1.5} />
          <h1 className="text-xl font-bold text-white">Crawl</h1>
          <span className="text-white/50">/ Overview</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alerts */}
        {criticalDrops.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <TrendingDown className="mt-0.5 h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-300">{criticalDrops.length} keywords dropped significantly</p>
              <p className="text-sm text-red-400/90 mt-1">
                {criticalDrops.slice(0, 3).map((k) => `"${k.keyword}" (↓${Math.abs(k.delta)} pos)`).join(", ")}
              </p>
            </div>
          </div>
        )}
        {quickWins.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-300">{quickWins.length} quick win opportunities (pos 11-15)</p>
              <p className="text-sm text-emerald-400/90 mt-1">
                {quickWins.slice(0, 3).map((k) => `"${k.keyword}"`).join(", ")} — push to top 10 with minor fixes
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Keywords Tracked" value={formatNumber(totalKeywords)} icon={<Key className="h-4 w-4" />} />
          <KpiCard title="Avg. Position" value={avgPosition} description="across all keywords" icon={<BarChart3 className="h-4 w-4" />} />
          <KpiCard title="Monthly Sessions" value={formatNumber(totalSessions)} description={`${organicShare}% organic`} icon={<Globe className="h-4 w-4" />} />
          <KpiCard title="Quick Wins" value={quickWins.length} description="keywords at positions 11-15" trend={quickWins.length > 0 ? 100 : 0} trendLabel="opportunities" icon={<TrendingUp className="h-4 w-4" />} />
        </div>

        {/* Feature-flagged v2 sections */}
        {featureFlags?.show_seo_health_score && (
          <SeoHealthScoreCard score={data.seo_health_score} />
        )}

        {featureFlags?.show_technical_issues && data.technical_issues.length > 0 && (
          <TechnicalIssuesCard issues={data.technical_issues} />
        )}

        {featureFlags?.show_page_speed && (
          <PageSpeedCard metrics={data.page_speed} />
        )}

        {featureFlags?.show_backlinks && data.backlinks.length > 0 && (
          <BacklinksCard backlinks={data.backlinks} />
        )}

        {featureFlags?.show_crawl_errors && data.crawl_errors.length > 0 && (
          <CrawlErrorsCard errors={data.crawl_errors} />
        )}

        {featureFlags?.show_schema_issues && data.schema_issues.length > 0 && (
          <SchemaIssuesCard issues={data.schema_issues} />
        )}

        {featureFlags?.show_geo_citations && data.geo_citations.length > 0 && (
          <GeoCitationsCard citations={data.geo_citations} />
        )}

        {/* Top Keywords */}
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-white">Top Keywords by Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/50">
                    <th className="pb-3 pl-4 pr-4 pt-3">Keyword</th>
                    <th className="pb-3 pr-4">Position</th>
                    <th className="pb-3 pr-4">Change</th>
                    <th className="pb-3 pr-4">Volume</th>
                    <th className="pb-3 pr-4">Opportunity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {data.keywords.slice(0, 15).map((kw) => (
                    <tr key={kw.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pl-4 pr-4 font-medium text-white/90">{kw.keyword}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", getPositionBadgeColor(kw.current_position))}>
                          #{kw.current_position}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={cn("text-xs font-medium", kw.delta > 0 ? "text-emerald-400" : kw.delta < 0 ? "text-red-400" : "text-white/40")}>
                          {kw.delta > 0 ? `↑${kw.delta}` : kw.delta < 0 ? `↓${Math.abs(kw.delta)}` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-white/70">{formatNumber(kw.search_volume)}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${kw.opportunity_score}%` }} />
                          </div>
                          <span className="text-xs text-white/70">{Math.round(kw.opportunity_score)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Walkthrough step panel */}
        <WalkthroughPanel />

        {/* Activate CTA */}
        <Card className="border-0 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white">
          <CardContent className="py-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-white">Ready to see your real data?</h2>
            <p className="mb-6 text-blue-100">
              Connect your Google Search Console and see the same insights for your actual site.
            </p>
            <Button
              size="lg"
              onClick={handleActivate}
              disabled={activating}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Activate Live Account — Free
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
