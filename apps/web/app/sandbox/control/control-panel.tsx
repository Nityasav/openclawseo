"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ExternalLink, GitFork, LayoutGrid, Link2, Plus, RefreshCw, Rocket, Trash2 } from "lucide-react";
import { formatTimeUntil } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScenarioLauncher } from "./scenario-launcher";
import { TemplateLibrary } from "./template-library";

interface Sandbox {
  id: string;
  template: string;
  status: string;
  role: string;
  access_token: string;
  expires_at: string;
  created_at: string;
  session_recording_url: string | null;
  scenario_name?: string | null;
  is_template?: boolean;
}

export function SandboxControlPanel({ sandboxes: initialSandboxes }: { sandboxes: Sandbox[] }) {
  const [sandboxes, setSandboxes] = useState(initialSandboxes);
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState<string>("site_audit");
  const [role, setRole] = useState<string>("prospect");
  const { toast } = useToast();

  async function createSandbox() {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, role }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Sandbox created!", description: `ID: ${data.data.id}` });
        window.location.reload();
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } finally {
      setCreating(false);
    }
  }

  async function expireSandbox(id: string) {
    const res = await fetch(`/api/v1/sandbox/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setSandboxes((s) => s.map((sb) => sb.id === id ? { ...sb, status: "expired" } : sb));
      toast({ title: "Sandbox expired" });
    }
  }

  async function resetSandbox(id: string) {
    const res = await fetch(`/api/v1/sandbox/${id}/reset`, { method: "POST" });
    const data = await res.json();
    if (data.success) toast({ title: "Sandbox reset" });
  }

  async function forkSandbox(id: string) {
    const res = await fetch(`/api/v1/sandbox/${id}/fork`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      toast({ title: "Sandbox forked!", description: `New ID: ${data.data.id}` });
      window.location.reload();
    }
  }

  function copyDemoLink(sb: Sandbox) {
    const url = `${window.location.origin}/sandbox/demo?token=${encodeURIComponent(sb.access_token)}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Share this link to open this sandbox." });
  }

  const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
    ready: "success",
    spinning_up: "warning",
    expired: "secondary",
  };

  const activeSandboxes = sandboxes.filter((s) => s.status !== "expired");

  return (
    <Tabs defaultValue="sandboxes" className="space-y-6">
      <TabsList className="border border-white/[0.08] bg-white/[0.02]">
        <TabsTrigger value="sandboxes" className="gap-1.5 text-white/70 data-[state=active]:text-white">
          <LayoutGrid className="h-3.5 w-3.5" />
          Sandboxes
          {activeSandboxes.length > 0 && (
            <span className="ml-0.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">
              {activeSandboxes.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="scenarios" className="gap-1.5 text-white/70 data-[state=active]:text-white">
          <Rocket className="h-3.5 w-3.5" />
          Scenarios
        </TabsTrigger>
        <TabsTrigger value="templates" className="gap-1.5 text-white/70 data-[state=active]:text-white">
          <BookOpen className="h-3.5 w-3.5" />
          Template Library
        </TabsTrigger>
      </TabsList>

      {/* ── Sandboxes tab ── */}
      <TabsContent value="sandboxes" className="space-y-6">
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-white">Launch New Sandbox</CardTitle>
            <p className="text-sm text-white/50 mt-1">
              Choose a template and role, then launch. Each sandbox gets synthetic data (no real GSC/GA4) and a shareable link for demos or QA.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-52 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site_audit">Site Audit</SelectItem>
                  <SelectItem value="competitor_analysis">Competitor Analysis</SelectItem>
                  <SelectItem value="content_strategy">Content Strategy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-40 border-white/10 bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createSandbox} disabled={creating}>
                <Plus className="mr-2 h-4 w-4" />
                {creating ? "Creating..." : "Launch Sandbox"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-white">
              Active Sandboxes ({activeSandboxes.length})
            </CardTitle>
            <p className="text-sm text-white/50 mt-1">
              Open a sandbox in a new tab, copy its shareable link, reset data, fork a copy, or expire it.
            </p>
          </CardHeader>
          <CardContent>
            {sandboxes.length === 0 ? (
              <p className="text-sm text-white/50">No sandboxes yet. Launch one above.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-white/50">
                      <th className="pb-3 pl-4 pr-4 pt-3">ID</th>
                      <th className="pb-3 pr-4">Template</th>
                      <th className="pb-3 pr-4 hidden md:table-cell">Scenario</th>
                      <th className="pb-3 pr-4">Role</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Expires</th>
                      <th className="pb-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {sandboxes.map((sb) => (
                      <tr key={sb.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="py-3 pl-4 pr-4 font-mono text-xs text-white/90">{sb.id.slice(0, 8)}…</td>
                        <td className="py-3 pr-4 capitalize text-white/90">{sb.template.replace(/_/g, " ")}</td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <span className="text-xs text-white/50">{sb.scenario_name ?? "—"}</span>
                          {sb.is_template && (
                            <span className="ml-1.5 rounded border border-amber-500/20 bg-amber-500/10 px-1 py-0.5 text-[9px] font-semibold text-amber-400">
                              TPL
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 capitalize text-white/90">{sb.role}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariant[sb.status] ?? "secondary"}>{sb.status}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-white/70">{formatTimeUntil(sb.expires_at)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon" asChild title="Open sandbox"
                              className="h-7 w-7 text-white/60 hover:text-white"
                            >
                              <a href={`/sandbox/demo?token=${encodeURIComponent(sb.access_token)}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost" size="icon" title="Copy shareable link"
                              className="h-7 w-7 text-white/60 hover:text-white"
                              onClick={() => copyDemoLink(sb)}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" title="Reset sandbox"
                              className="h-7 w-7 text-white/60 hover:text-white"
                              onClick={() => resetSandbox(sb.id)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" title="Fork sandbox"
                              className="h-7 w-7 text-white/60 hover:text-white"
                              onClick={() => forkSandbox(sb.id)}
                            >
                              <GitFork className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" title="Expire sandbox"
                              className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => expireSandbox(sb.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Scenarios tab ── */}
      <TabsContent value="scenarios">
        <ScenarioLauncher />
      </TabsContent>

      {/* ── Template Library tab ── */}
      <TabsContent value="templates">
        <TemplateLibrary />
      </TabsContent>
    </Tabs>
  );
}
