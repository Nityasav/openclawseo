"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  SCENARIO_PRESETS,
  PROFILE_COLORS,
  INDUSTRY_COLORS,
  DEFAULT_FLAGS_BY_PROFILE,
  type SandboxIndustry,
  type SandboxDataProfile,
  type SandboxFeatureFlags,
} from "@/lib/sandbox/scenario";

const FLAG_LABELS: Record<keyof SandboxFeatureFlags, string> = {
  show_seo_health_score: "SEO Health Score",
  show_technical_issues: "Technical Issues",
  show_backlinks: "Backlink Profile",
  show_geo_citations: "Local Citations",
  show_page_speed: "Core Web Vitals",
  show_crawl_errors: "Crawl Errors",
  show_schema_issues: "Schema Issues",
  show_competitor_gap: "Competitor Gap",
  show_content_clusters: "Content Clusters",
};

const INDUSTRIES: { value: SandboxIndustry; label: string }[] = [
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "local_business", label: "Local Business" },
  { value: "media", label: "Media / News" },
  { value: "agency", label: "Agency" },
];

const PROFILES: { value: SandboxDataProfile; label: string; description: string }[] = [
  { value: "healthy", label: "Healthy", description: "Strong organic, clean technical profile" },
  { value: "struggling", label: "Struggling", description: "Crawl errors, weak rankings, penalties" },
  { value: "recovering", label: "Recovering", description: "Post-update recovery, improving metrics" },
  { value: "new_site", label: "New Site", description: "Fresh domain, low authority, building up" },
  { value: "peak_performance", label: "Peak Performance", description: "Dominating SERPs, best-in-class" },
];

const TEMPLATES: { value: "site_audit" | "competitor_analysis" | "content_strategy"; label: string }[] = [
  { value: "site_audit", label: "Site Audit" },
  { value: "competitor_analysis", label: "Competitor Analysis" },
  { value: "content_strategy", label: "Content Strategy" },
];

function ScenarioPresetCard({
  preset,
  onLaunch,
  launching,
}: {
  preset: (typeof SCENARIO_PRESETS)[number];
  onLaunch: () => void;
  launching: boolean;
}) {
  return (
    <Card className="group relative border-white/[0.08] bg-white/[0.02] transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${INDUSTRY_COLORS[preset.config.industry]}`}>
            {preset.industry_label}
          </span>
          <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PROFILE_COLORS[preset.config.dataProfile]}`}>
            {preset.profile_label}
          </span>
          <span className="inline-flex rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50 capitalize">
            {preset.template.replace(/_/g, " ")}
          </span>
        </div>

        <h3 className="mb-1.5 text-sm font-semibold text-white">{preset.label}</h3>
        <p className="mb-4 text-xs leading-relaxed text-white/50">{preset.description}</p>

        <div className="mb-4 flex flex-wrap gap-1">
          {(Object.entries(preset.config.featureFlags) as [keyof SandboxFeatureFlags, boolean][])
            .filter(([, v]) => v)
            .map(([k]) => (
              <span key={k} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/40">
                {FLAG_LABELS[k].replace("show_", "")}
              </span>
            ))}
        </div>

        <Button
          size="sm"
          onClick={onLaunch}
          disabled={launching}
          className="w-full bg-white/[0.06] text-white hover:bg-white/[0.12]"
        >
          {launching ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Launching…</>
          ) : (
            <><Rocket className="mr-1.5 h-3.5 w-3.5" />Launch</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ScenarioLauncher() {
  const { toast } = useToast();
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  // Custom scenario state
  const [customIndustry, setCustomIndustry] = useState<SandboxIndustry>("saas");
  const [customProfile, setCustomProfile] = useState<SandboxDataProfile>("healthy");
  const [customTemplate, setCustomTemplate] = useState<"site_audit" | "competitor_analysis" | "content_strategy">("site_audit");
  const [customFlags, setCustomFlags] = useState<SandboxFeatureFlags>(DEFAULT_FLAGS_BY_PROFILE.healthy);
  const [launchingCustom, setLaunchingCustom] = useState(false);

  async function launchPreset(preset: (typeof SCENARIO_PRESETS)[number]) {
    setLaunchingId(preset.id);
    try {
      const res = await fetch("/api/v1/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: preset.template,
          role: preset.role,
          scenario_name: preset.label,
          scenario_config: preset.config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const link = `${window.location.origin}/sandbox/demo?token=${encodeURIComponent(data.data.access_token)}`;
        navigator.clipboard.writeText(link).catch(() => {});
        toast({ title: "Sandbox launched!", description: `Link copied: ${link.slice(0, 60)}…` });
      } else {
        toast({ title: "Launch failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setLaunchingId(null);
    }
  }

  async function launchCustom() {
    setLaunchingCustom(true);
    try {
      const res = await fetch("/api/v1/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: customTemplate,
          role: "prospect",
          scenario_name: `Custom — ${customIndustry} / ${customProfile}`,
          scenario_config: {
            industry: customIndustry,
            dataProfile: customProfile,
            featureFlags: customFlags,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        const link = `${window.location.origin}/sandbox/demo?token=${encodeURIComponent(data.data.access_token)}`;
        navigator.clipboard.writeText(link).catch(() => {});
        toast({ title: "Custom sandbox launched!", description: `Link copied: ${link.slice(0, 60)}…` });
      } else {
        toast({ title: "Launch failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setLaunchingCustom(false);
    }
  }

  function toggleFlag(key: keyof SandboxFeatureFlags) {
    setCustomFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Sync flags to profile defaults when profile changes (user can still override)
  function handleProfileChange(p: SandboxDataProfile) {
    setCustomProfile(p);
    setCustomFlags(DEFAULT_FLAGS_BY_PROFILE[p]);
  }

  return (
    <div className="space-y-8">
      {/* Presets */}
      <div>
        <h2 className="mb-1 text-sm font-semibold text-white">Preset Scenarios</h2>
        <p className="mb-4 text-xs text-white/40">
          Curated environments covering the most common demo situations. Each comes with pre-tuned synthetic data and feature flags.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIO_PRESETS.map((preset) => (
            <ScenarioPresetCard
              key={preset.id}
              preset={preset}
              launching={launchingId === preset.id}
              onLaunch={() => launchPreset(preset)}
            />
          ))}
        </div>
      </div>

      {/* Custom */}
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium">
            <Settings2 className="h-4 w-4 text-white/50" />
            Custom Scenario
          </CardTitle>
          <p className="text-xs text-white/40 mt-1">
            Pick any combination of industry, data profile, and feature flags to generate a bespoke demo.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Industry + Profile + Template */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Industry</label>
              <Select value={customIndustry} onValueChange={(v) => setCustomIndustry(v as SandboxIndustry)}>
                <SelectTrigger className="w-44 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Data Profile</label>
              <Select value={customProfile} onValueChange={(v) => handleProfileChange(v as SandboxDataProfile)}>
                <SelectTrigger className="w-48 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex flex-col">
                        <span>{p.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-white/30">
                {PROFILES.find((p) => p.value === customProfile)?.description}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">Template</label>
              <Select value={customTemplate} onValueChange={(v) => setCustomTemplate(v as typeof customTemplate)}>
                <SelectTrigger className="w-48 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Feature flags */}
          <div>
            <p className="mb-2 text-xs font-medium text-white/50">Feature Flags</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(FLAG_LABELS) as (keyof SandboxFeatureFlags)[]).map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={customFlags[key]}
                    onChange={() => toggleFlag(key)}
                    className="h-3.5 w-3.5 rounded border-white/20 accent-white"
                  />
                  <span className="text-xs text-white/70">{FLAG_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={launchCustom} disabled={launchingCustom}>
            {launchingCustom ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Launching…</>
            ) : (
              <><Rocket className="mr-1.5 h-3.5 w-3.5" />Launch Custom Scenario</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
