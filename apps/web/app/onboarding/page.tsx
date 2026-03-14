"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import UniqueLoading from "@/components/ui/morph-loading";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KeywordResult {
  keyword: string;
  search_volume_estimate: number;
  difficulty_estimate: number;
  opportunity_score: number;
  reasoning: string;
  recommended_page: string;
}

interface LLMResult {
  keyword: string;
  is_cited: boolean;
  citation_likelihood: number;
  reasoning: string;
  improvement_tip: string;
}

interface RankingRow {
  query: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-500",
            i + 1 === current
              ? "w-8 bg-white"
              : i + 1 < current
              ? "w-4 bg-white/40"
              : "w-4 bg-white/15"
          )}
        />
      ))}
    </div>
  );
}

// ─── Step 1 — Domain ─────────────────────────────────────────────────────────

function Step1Domain({
  onNext,
}: {
  onNext: (domain: string, siteId: string) => void;
}) {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function normalizeDomain(input: string): string {
    let d = input.trim();
    if (!d.startsWith("http://") && !d.startsWith("https://")) {
      d = "https://" + d;
    }
    try {
      return new URL(d).hostname.replace(/^www\./, "");
    } catch {
      return d;
    }
  }

  async function handleNext() {
    const normalized = normalizeDomain(domain);
    if (!normalized) {
      setError("Please enter a valid domain.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/onboarding/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: normalized }),
      });
      const json = await res.json();
      if (!res.ok || !json.siteId) throw new Error(json.error ?? "Failed to save domain");
      onNext(normalized, json.siteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/30 mb-4">
          Step 1 of 5
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white">
          What&apos;s your website?
        </h1>
        <p className="mt-3 text-white/40 text-base">
          Enter your domain to get started.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <input
          type="text"
          placeholder="yourdomain.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
          className="w-full bg-transparent border border-white/10 rounded-xl px-5 py-4 text-lg text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-colors"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <button
        onClick={handleNext}
        disabled={loading || !domain.trim()}
        className="group flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : null}
        Continue
        {!loading && (
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Step 2 — Integrations ────────────────────────────────────────────────────

function Step2Integrations({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [gscConnected, setGscConnected] = useState(false);
  const [ga4Connected, setGa4Connected] = useState(false);
  const [polling, setPolling] = useState(false);

  const checkIntegrations = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/integrations");
      if (!res.ok) return;
      const json = await res.json();
      const providers: string[] = (json.integrations ?? []).map(
        (i: { provider: string }) => i.provider
      );
      setGscConnected(providers.includes("gsc"));
      setGa4Connected(providers.includes("ga4"));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    checkIntegrations();
  }, [checkIntegrations]);

  // Poll for integration status when we return from OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("step") === "2") {
      setPolling(true);
      const interval = setInterval(checkIntegrations, 2000);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setPolling(false);
      }, 30000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [checkIntegrations]);

  function connectGsc() {
    window.location.href = "/api/v1/integrations/gsc/connect?source=onboarding";
  }

  function connectGa4() {
    window.location.href = "/api/v1/integrations/ga4/connect?source=onboarding";
  }

  const eitherConnected = gscConnected || ga4Connected;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/30 mb-4">
          Step 2 of 5
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white">
          Connect your data
        </h1>
        <p className="mt-3 text-white/40 text-base">
          Link Google Search Console and Analytics for accurate insights.
        </p>
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-4">
        {/* GSC Card */}
        <div
          className={cn(
            "relative rounded-2xl border p-5 transition-all",
            gscConnected
              ? "border-white/25 bg-white/5"
              : "border-white/10 bg-white/[0.02]"
          )}
        >
          {gscConnected && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium">Search Console</p>
            <p className="text-white/35 text-xs mt-1">Rankings &amp; impressions</p>
          </div>
          {!gscConnected ? (
            <button
              onClick={connectGsc}
              className="w-full text-xs py-2 px-3 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-all"
            >
              Connect
            </button>
          ) : (
            <p className="text-xs text-emerald-400">Connected</p>
          )}
        </div>

        {/* GA4 Card */}
        <div
          className={cn(
            "relative rounded-2xl border p-5 transition-all",
            ga4Connected
              ? "border-white/25 bg-white/5"
              : "border-white/10 bg-white/[0.02]"
          )}
        >
          {ga4Connected && (
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <div className="mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium">Analytics 4</p>
            <p className="text-white/35 text-xs mt-1">Traffic &amp; behavior</p>
          </div>
          {!ga4Connected ? (
            <button
              onClick={connectGa4}
              className="w-full text-xs py-2 px-3 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/25 transition-all"
            >
              Connect
            </button>
          ) : (
            <p className="text-xs text-emerald-400">Connected</p>
          )}
        </div>
      </div>

      {polling && !eitherConnected && (
        <p className="text-white/30 text-xs flex items-center gap-2">
          <span className="inline-block w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          Waiting for connection…
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onNext}
          disabled={!eitherConnected}
          className="group flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-white/25 hover:text-white/50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Keywords ────────────────────────────────────────────────────────

function Step3Keywords({
  siteId,
  domain,
  onNext,
}: {
  siteId: string;
  domain: string;
  onNext: (selected: string[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function generate() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/onboarding/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, domain }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Generation failed");
        setKeywords(json.keywords ?? []);
        setSelected(new Set((json.keywords ?? []).map((k: KeywordResult) => k.keyword)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate keywords");
      } finally {
        setLoading(false);
      }
    }
    generate();
  }, [siteId, domain]);

  function toggle(keyword: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  }

  async function handleNext() {
    setSaving(true);
    try {
      await fetch("/api/v1/onboarding/keywords/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, keywords: keywords.filter((k) => selected.has(k.keyword)) }),
      });
    } catch {
      // non-blocking
    }
    onNext(Array.from(selected));
    setSaving(false);
  }

  function getDifficultyLabel(score: number) {
    if (score <= 30) return { label: "Easy", color: "text-emerald-400" };
    if (score <= 60) return { label: "Medium", color: "text-yellow-400" };
    return { label: "Hard", color: "text-red-400" };
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/30 mb-4">
          Step 3 of 5
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white">
          Keywords to track
        </h1>
        <p className="mt-3 text-white/40 text-base">
          AI-discovered opportunities for <span className="text-white/70">{domain}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex w-full min-h-[280px] flex-col items-center justify-center gap-4 py-12">
          <UniqueLoading variant="morph" size="lg" lightDots className="flex-shrink-0" />
          <p className="text-white/30 text-sm animate-pulse">Scanning your domain…</p>
        </div>
      ) : error ? (
        <div className="w-full max-w-xl rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="w-full max-w-2xl space-y-1.5 max-h-80 overflow-y-auto pr-1">
            <div className="grid grid-cols-[1fr_80px_80px_80px_20px] text-[10px] font-medium uppercase tracking-widest text-white/20 px-4 pb-2">
              <span>Keyword</span>
              <span className="text-right">Volume</span>
              <span className="text-right">Difficulty</span>
              <span className="text-right">Score</span>
              <span />
            </div>
            {keywords.map((kw) => {
              const diff = getDifficultyLabel(kw.difficulty_estimate);
              const isSelected = selected.has(kw.keyword);
              return (
                <button
                  key={kw.keyword}
                  onClick={() => toggle(kw.keyword)}
                  className={cn(
                    "w-full grid grid-cols-[1fr_80px_80px_80px_20px] items-center px-4 py-3 rounded-xl text-left transition-all",
                    isSelected
                      ? "bg-white/8 border border-white/10"
                      : "bg-transparent border border-transparent opacity-40 hover:opacity-70"
                  )}
                >
                  <span className="text-sm text-white truncate">{kw.keyword}</span>
                  <span className="text-xs text-white/50 text-right">
                    {kw.search_volume_estimate >= 1000
                      ? `${(kw.search_volume_estimate / 1000).toFixed(0)}K`
                      : kw.search_volume_estimate}
                  </span>
                  <span className={cn("text-xs text-right", diff.color)}>{diff.label}</span>
                  <span className="text-xs text-white/60 text-right">{kw.opportunity_score}</span>
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center ml-auto transition-all",
                      isSelected ? "bg-white border-white" : "border-white/20"
                    )}
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-white/25 text-xs">
            {selected.size} of {keywords.length} selected
          </p>

          <button
            onClick={handleNext}
            disabled={saving || selected.size === 0}
            className="group flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : null}
            Track {selected.size} keyword{selected.size !== 1 ? "s" : ""}
            {!saving && (
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Step 4 — LLM Visibility ─────────────────────────────────────────────────

function Step4LLMVisibility({
  siteId,
  domain,
  keywords,
  onNext,
}: {
  siteId: string;
  domain: string;
  keywords: string[];
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<LLMResult[]>([]);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function runCheck() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/onboarding/llm-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteId, domain, keywords: keywords.slice(0, 15) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Check failed");
        const r: LLMResult[] = json.results ?? [];
        setResults(r);
        const cited = r.filter((x) => x.is_cited).length;
        setScore(r.length > 0 ? Math.round((cited / r.length) * 100) : 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check failed");
      } finally {
        setLoading(false);
      }
    }
    runCheck();

    // Allow proceeding after 15s even if still loading
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("Taking longer than expected — you can proceed.");
      }
    }, 30000);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, domain]);

  const circumference = 2 * Math.PI * 36;
  const strokeDash = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-xl">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/30 mb-4">
          Step 4 of 5
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white">
          AI visibility
        </h1>
        <p className="mt-3 text-white/40 text-base">
          How often does AI cite <span className="text-white/70">{domain}</span>?
        </p>
      </div>

      {loading ? (
        <div className="flex w-full min-h-[280px] flex-col items-center justify-center gap-4 py-12">
          <UniqueLoading variant="morph" size="lg" lightDots className="flex-shrink-0" />
          <p className="text-white/30 text-sm animate-pulse">Checking AI citation coverage…</p>
        </div>
      ) : (
        <>
          {/* Score ring */}
          <div className="flex items-center gap-8">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="36" fill="none"
                  stroke={score >= 50 ? "#10b981" : score >= 25 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDash}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-light text-white">{score}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-white/60 text-sm">
                <span className="text-white font-medium">{results.filter((r) => r.is_cited).length}</span> of {results.length} keywords
              </p>
              <p className="text-white/35 text-xs">cited by AI systems</p>
            </div>
          </div>

          {/* Top results */}
          {results.length > 0 && (
            <div className="w-full space-y-1.5 max-h-52 overflow-y-auto">
              {results.slice(0, 8).map((r) => (
                <div
                  key={r.keyword}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/6"
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      r.is_cited ? "bg-emerald-400" : "bg-white/15"
                    )}
                  />
                  <span className="text-sm text-white/70 flex-1 truncate">{r.keyword}</span>
                  <span className="text-xs text-white/30">{r.citation_likelihood}%</span>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-white/40 text-xs text-center">{error}</p>}
        </>
      )}

      <button
        onClick={onNext}
        disabled={loading}
        className="group flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ─── Step 5 — Rankings ────────────────────────────────────────────────────────

function Step5Rankings({
  siteId,
  domain,
  onFinish,
}: {
  siteId: string;
  domain: string;
  onFinish: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [hasGsc, setHasGsc] = useState(false);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/onboarding/rankings?siteId=${siteId}`);
        const json = await res.json();
        if (!res.ok) throw new Error();
        setHasGsc(json.hasGsc ?? false);
        setRankings(json.rankings ?? []);
      } catch {
        setHasGsc(false);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, [siteId]);

  function positionColor(pos: number) {
    if (pos <= 3) return "text-emerald-400";
    if (pos <= 10) return "text-blue-400";
    if (pos <= 20) return "text-yellow-400";
    return "text-white/40";
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      <div className="text-center">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-white/30 mb-4">
          Step 5 of 5
        </p>
        <h1 className="text-4xl font-light tracking-tight text-white">
          Your rankings
        </h1>
        <p className="mt-3 text-white/40 text-base">
          Current search positions for <span className="text-white/70">{domain}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex w-full min-h-[280px] flex-col items-center justify-center gap-4 py-12">
          <UniqueLoading variant="morph" size="lg" lightDots className="flex-shrink-0" />
          <p className="text-white/30 text-sm animate-pulse">Fetching rankings…</p>
        </div>
      ) : !hasGsc || rankings.length === 0 ? (
        <div className="w-full rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-white/50 text-sm">Connect Google Search Console to see live rankings.</p>
          <p className="text-white/25 text-xs">You can do this later in Settings.</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-[1fr_60px_60px_80px] text-[10px] font-medium uppercase tracking-widest text-white/20 px-4 pb-2">
            <span>Query</span>
            <span className="text-right">Pos.</span>
            <span className="text-right">Clicks</span>
            <span className="text-right">Impressions</span>
          </div>
          <div className="space-y-1">
            {rankings.slice(0, 10).map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_60px_60px_80px] items-center px-4 py-3 rounded-xl bg-white/[0.03] border border-white/6"
              >
                <span className="text-sm text-white/80 truncate">{row.query}</span>
                <span className={cn("text-sm font-medium text-right", positionColor(row.position))}>
                  {row.position.toFixed(1)}
                </span>
                <span className="text-xs text-white/50 text-right">{row.clicks}</span>
                <span className="text-xs text-white/40 text-right">{row.impressions.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onFinish}
        className="group flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-medium text-sm transition-all hover:bg-white/90"
      >
        Go to Dashboard
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(() => {
    const s = parseInt(searchParams.get("step") ?? "1", 10);
    return isNaN(s) || s < 1 || s > 5 ? 1 : s;
  });
  const [domain, setDomain] = useState("");
  const [siteId, setSiteId] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Read siteId/domain from sessionStorage on mount (persists across OAuth redirect)
  useEffect(() => {
    const stored = sessionStorage.getItem("onboarding");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.domain) setDomain(parsed.domain);
        if (parsed.siteId) setSiteId(parsed.siteId);
      } catch {
        // ignore
      }
    }
  }, []);

  function persistState(d: string, sid: string) {
    sessionStorage.setItem("onboarding", JSON.stringify({ domain: d, siteId: sid }));
  }

  function goToStep(n: number) {
    setStep(n);
    router.replace(`/onboarding?step=${n}`, { scroll: false });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Step indicator */}
      <div className="mb-16">
        <StepIndicator current={step} total={5} />
      </div>

      {/* Step content with fade transition */}
      <div
        key={step}
        className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        {step === 1 && (
          <Step1Domain
            onNext={(d, sid) => {
              setDomain(d);
              setSiteId(sid);
              persistState(d, sid);
              goToStep(2);
            }}
          />
        )}
        {step === 2 && (
          <Step2Integrations
            onNext={() => goToStep(3)}
            onSkip={() => goToStep(3)}
          />
        )}
        {step === 3 && siteId && (
          <Step3Keywords
            siteId={siteId}
            domain={domain}
            onNext={(kws) => {
              setSelectedKeywords(kws);
              goToStep(4);
            }}
          />
        )}
        {step === 4 && siteId && (
          <Step4LLMVisibility
            siteId={siteId}
            domain={domain}
            keywords={selectedKeywords}
            onNext={() => goToStep(5)}
          />
        )}
        {step === 5 && siteId && (
          <Step5Rankings
            siteId={siteId}
            domain={domain}
            onFinish={() => {
              // Full navigation so dashboard layout re-runs and sees the site created in step 1
              window.location.href = "/dashboard/overview";
            }}
          />
        )}
        {/* Fallback if siteId missing (e.g. hard refresh mid-flow) */}
        {step > 2 && !siteId && (
          <div className="text-center space-y-4">
            <p className="text-white/40 text-sm">Session lost — please start over.</p>
            <button
              onClick={() => goToStep(1)}
              className="px-6 py-3 bg-white/10 rounded-xl text-white/70 text-sm hover:bg-white/15 transition"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
