"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Plus, RefreshCw, Trash2, GitFork } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Sandbox {
  id: string;
  template: string;
  status: string;
  role: string;
  access_token: string;
  expires_at: string;
  created_at: string;
  session_recording_url: string | null;
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

  const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
    ready: "success",
    spinning_up: "warning",
    expired: "secondary",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Launch New Sandbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site_audit">Site Audit</SelectItem>
                <SelectItem value="competitor_analysis">Competitor Analysis</SelectItem>
                <SelectItem value="content_strategy">Content Strategy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-36">
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

      <Card>
        <CardHeader>
          <CardTitle>Active Sandboxes ({sandboxes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sandboxes.length === 0 ? (
            <p className="text-sm text-gray-400">No sandboxes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-gray-500">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">Template</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Expires</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sandboxes.map((sb) => (
                    <tr key={sb.id}>
                      <td className="py-3 pr-4 font-mono text-xs">{sb.id.slice(0, 8)}…</td>
                      <td className="py-3 pr-4 capitalize">{sb.template.replace("_", " ")}</td>
                      <td className="py-3 pr-4 capitalize">{sb.role}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusVariant[sb.status] ?? "secondary"}>
                          {sb.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {formatRelativeTime(sb.expires_at)}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Open demo"
                          >
                            <a href="/sandbox/demo" target="_blank">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset"
                            onClick={() => resetSandbox(sb.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Fork"
                            onClick={() => forkSandbox(sb.id)}
                          >
                            <GitFork className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Expire"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => expireSandbox(sb.id)}
                          >
                            <Trash2 className="h-3 w-3" />
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
    </div>
  );
}
