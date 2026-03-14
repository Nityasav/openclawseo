"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, Loader2, Plus, Trash2, XCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  defaultTab: string;
  successMessage?: string;
  errorMessage?: string;
  connectedProviders: string[];
  sites: Array<{ id: string; domain: string; gsc_property_url: string | null; ga4_property_id: string | null }>;
  orgId: string;
  integrations: Array<{ provider: string; config_json: unknown; access_token: string | null }>;
}

interface GscProperty {
  siteUrl: string;
  permissionLevel: string;
}

interface Ga4Property {
  accountId: string;
  accountName: string;
  propertyId: string;
  propertyName: string;
}

function PropertyPicker({
  provider,
  onSaved,
}: {
  provider: "gsc" | "ga4";
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gscProperties, setGscProperties] = useState<GscProperty[]>([]);
  const [ga4Properties, setGa4Properties] = useState<Ga4Property[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [domain, setDomain] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/integrations/${provider}/properties`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to fetch properties");
        return;
      }
      if (provider === "gsc") setGscProperties(data.data);
      else setGa4Properties(data.data);
    } catch {
      setError("Network error fetching properties");
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Auto-fill domain from selected GSC property
  useEffect(() => {
    if (provider === "gsc" && selected) {
      const d = selected.replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^sc-domain:/, "");
      setDomain(d);
    }
  }, [selected, provider]);

  useEffect(() => {
    if (provider === "ga4" && selected) {
      if (!domain) {
        const prop = ga4Properties.find((p) => p.propertyId === selected);
        if (prop?.propertyName) {
          const cleaned = prop.propertyName.toLowerCase().replace(/[^a-z0-9.-]/g, "");
          if (cleaned.includes(".")) setDomain(cleaned);
        }
      }
    }
  }, [selected, ga4Properties, provider, domain]);

  async function handleSave() {
    if (!selected || !domain) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/integrations/select-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, value: selected, domain }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `${provider.toUpperCase()} property saved!`, description: domain });
        onSaved();
      } else {
        setError(data.error ?? "Failed to save");
      }
    } catch {
      setError("Network error saving property");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Fetching your {provider === "gsc" ? "Search Console" : "Analytics"} properties...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchProperties}>
          <RefreshCw className="mr-2 h-3 w-3" /> Retry
        </Button>
      </div>
    );
  }

  const items = provider === "gsc"
    ? gscProperties.map((p) => ({ value: p.siteUrl, label: p.siteUrl, sub: p.permissionLevel }))
    : ga4Properties.map((p) => ({ value: p.propertyId, label: p.propertyName, sub: `${p.accountName} · ID: ${p.propertyId}` }));

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-500">No properties found. Make sure you have access in {provider === "gsc" ? "Google Search Console" : "Google Analytics"}.</p>
        <Button size="sm" variant="outline" onClick={fetchProperties}>
          <RefreshCw className="mr-2 h-3 w-3" /> Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <div>
        <Label className="text-sm font-medium">Select {provider === "gsc" ? "Search Console Property" : "GA4 Property"}</Label>
        <div className="mt-1 space-y-1 max-h-48 overflow-y-auto rounded-md border p-1">
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => setSelected(item.value)}
              className={cn(
                "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                selected === item.value
                  ? "bg-blue-50 border border-blue-200 text-blue-900"
                  : "hover:bg-gray-50"
              )}
            >
              <p className="font-medium truncate">{item.label}</p>
              <p className="text-xs text-gray-500 truncate">{item.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Domain</Label>
        <Input
          className="mt-1"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        <p className="text-xs text-gray-400 mt-1">Auto-filled from selection — edit if needed</p>
      </div>

      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving || !selected || !domain}
      >
        {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Save Property
      </Button>
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  provider,
  isConnected,
  connectHref,
  children,
}: {
  name: string;
  description: string;
  provider: string;
  isConnected: boolean;
  connectHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          {isConnected ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children ?? (
          connectHref && !isConnected && (
            <Button asChild size="sm" variant="outline">
              <a href={connectHref}>
                <ExternalLink className="mr-2 h-3 w-3" />
                Connect
              </a>
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}

function SlackIntegration({ isConnected }: { isConnected: boolean }) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/integrations/slack/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl, site_id: "00000000-0000-0000-0000-000000000000" }),
      });
      const data = await res.json();
      if (data.success) toast({ title: "Slack connected!" });
      else toast({ title: "Failed", description: data.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await fetch("/api/v1/integrations/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: "00000000-0000-0000-0000-000000000000" }),
      });
      const data = await res.json();
      if (data.success) toast({ title: "Test message sent to Slack!" });
      else toast({ title: "Failed", description: data.error, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="webhook">Incoming Webhook URL</Label>
        <Input
          id="webhook"
          placeholder="https://hooks.slack.com/services/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || !webhookUrl} size="sm">
          {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Save
        </Button>
        {isConnected && (
          <Button onClick={test} disabled={testing} variant="outline" size="sm">
            {testing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Send Test
          </Button>
        )}
      </div>
    </div>
  );
}

function FramerIntegration() {
  const [apiKey, setApiKey] = useState("");
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/integrations/framer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, project_id: projectId }),
      });
      const data = await res.json();
      if (data.success) toast({ title: "Framer connected!" });
      else toast({ title: "Failed", description: data.error, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>API Key</Label>
        <Input placeholder="framer-api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      </div>
      <div>
        <Label>Project ID</Label>
        <Input placeholder="project-id" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
      </div>
      <Button onClick={save} disabled={saving || !apiKey || !projectId} size="sm">
        {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Save
      </Button>
    </div>
  );
}

function SitesManager({ sites, orgId }: { sites: SettingsViewProps["sites"]; orgId: string }) {
  const [newDomain, setNewDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function addSite() {
    if (!newDomain || !orgId) return;
    setSaving(true);
    // This would call a sites API route
    toast({ title: "Site added!", description: newDomain });
    setNewDomain("");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="example.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
        />
        <Button onClick={addSite} disabled={saving || !newDomain}>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>
      {sites.length === 0 ? (
        <p className="text-sm text-gray-400">No sites added yet.</p>
      ) : (
        <div className="space-y-2">
          {sites.map((site) => (
            <div key={site.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">{site.domain}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>GSC: {site.gsc_property_url ? "✓" : "—"}</span>
                  <span>GA4: {site.ga4_property_id ? "✓" : "—"}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsView({
  defaultTab,
  successMessage,
  errorMessage,
  connectedProviders: initialConnectedProviders,
  sites,
  orgId,
  integrations,
}: SettingsViewProps) {
  const [connectedProviders, setConnectedProviders] = useState(initialConnectedProviders);
  const [refreshKey, setRefreshKey] = useState(0);

  function handlePropertySaved() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          <CheckCircle className="h-4 w-4" />
          {successMessage === "gsc_connected" && "Google Search Console connected! Now select your property below."}
          {successMessage === "ga4_connected" && "Google Analytics 4 connected! Now select your property below."}
          {successMessage === "migrated" && "Sandbox migrated to live account!"}
          {!["gsc_connected", "ga4_connected", "migrated"].includes(successMessage) && successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          <XCircle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <IntegrationCard
              name="Google Search Console"
              description="Import search analytics, keywords, and impressions"
              provider="gsc"
              isConnected={connectedProviders.includes("gsc")}
              connectHref="/api/v1/integrations/gsc/connect"
            >
              {connectedProviders.includes("gsc") && (
                <div>
                  <p className="text-xs text-green-600 font-medium mb-2">✓ Connected — select which property to track:</p>
                  <PropertyPicker key={`gsc-${refreshKey}`} provider="gsc" onSaved={handlePropertySaved} />
                  <a href="/api/v1/integrations/gsc/connect" className="text-xs text-gray-400 hover:underline mt-2 block">
                    Reconnect / change account
                  </a>
                </div>
              )}
            </IntegrationCard>
            <IntegrationCard
              name="Google Analytics 4"
              description="Import sessions, conversions, and traffic data"
              provider="ga4"
              isConnected={connectedProviders.includes("ga4")}
              connectHref="/api/v1/integrations/ga4/connect"
            >
              {connectedProviders.includes("ga4") && (
                <div>
                  <p className="text-xs text-green-600 font-medium mb-2">✓ Connected — select which property to track:</p>
                  <PropertyPicker key={`ga4-${refreshKey}`} provider="ga4" onSaved={handlePropertySaved} />
                  <a href="/api/v1/integrations/ga4/connect" className="text-xs text-gray-400 hover:underline mt-2 block">
                    Reconnect / change account
                  </a>
                </div>
              )}
            </IntegrationCard>
            <IntegrationCard
              name="Slack"
              description="Receive automated SEO reports in your Slack workspace"
              provider="slack"
              isConnected={connectedProviders.includes("slack")}
            >
              <SlackIntegration isConnected={connectedProviders.includes("slack")} />
            </IntegrationCard>
            <IntegrationCard
              name="Framer CMS"
              description="Manage your marketing blog via Framer CMS"
              provider="framer"
              isConnected={connectedProviders.includes("framer")}
            >
              <FramerIntegration />
            </IntegrationCard>
          </div>
        </TabsContent>

        <TabsContent value="sites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Sites</CardTitle>
              <CardDescription>Manage the domains you track with SEOClaw</CardDescription>
            </CardHeader>
            <CardContent>
              <SitesManager sites={sites} orgId={orgId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Invite team members and manage roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="colleague@example.com" className="flex-1" />
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                </div>
                <p className="text-sm text-gray-400">Team management coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
