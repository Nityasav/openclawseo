"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, Loader2, Plus, Trash2, XCircle } from "lucide-react";
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
          <>
            {connectHref && !isConnected && (
              <Button asChild size="sm" variant="outline">
                <a href={connectHref}>
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Connect
                </a>
              </Button>
            )}
            {isConnected && connectHref && (
              <Button asChild size="sm" variant="outline">
                <a href={connectHref}>
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Reconnect
                </a>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function GscSitePicker({ orgId }: { orgId: string }) {
  const [sites, setSites] = useState<Array<{ siteUrl: string; permissionLevel: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const { toast } = useToast();

  async function fetchSites() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/integrations/gsc/sites");
      const data = await res.json();
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      setSites(data.sites ?? []);
      setFetched(true);
      if ((data.sites ?? []).length === 0) {
        toast({ title: "No sites found", description: "No GSC properties found for this account." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch GSC sites", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function selectSite(siteUrl: string) {
    setSaving(siteUrl);
    try {
      const res = await fetch("/api/v1/integrations/gsc/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_url: siteUrl, org_id: orgId }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Site linked!", description: `${siteUrl} linked to your account.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save site", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={fetchSites} disabled={loading} size="sm" variant="outline">
        {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Fetch GSC Sites
      </Button>
      {fetched && sites.length > 0 && (
        <div className="space-y-2">
          {sites.map((site) => (
            <div key={site.siteUrl} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{site.siteUrl}</p>
                <p className="text-xs text-gray-500">{site.permissionLevel}</p>
              </div>
              <Button
                size="sm"
                onClick={() => selectSite(site.siteUrl)}
                disabled={saving === site.siteUrl}
              >
                {saving === site.siteUrl && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Link
              </Button>
            </div>
          ))}
        </div>
      )}
      {fetched && sites.length === 0 && (
        <p className="text-sm text-gray-400">No GSC sites found for this Google account.</p>
      )}
    </div>
  );
}

function Ga4PropertyPicker({ orgId }: { orgId: string }) {
  const [properties, setProperties] = useState<Array<{ propertyId: string; displayName: string; account: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const { toast } = useToast();

  async function fetchProperties() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/integrations/ga4/properties");
      const data = await res.json();
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      setProperties(data.properties ?? []);
      setFetched(true);
      if ((data.properties ?? []).length === 0) {
        toast({ title: "No properties found", description: "No GA4 properties found for this account." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch GA4 properties", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function selectProperty(propertyId: string) {
    setSaving(propertyId);
    try {
      const res = await fetch("/api/v1/integrations/ga4/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, org_id: orgId }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Property linked!", description: `GA4 property linked to your account.` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save property", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={fetchProperties} disabled={loading} size="sm" variant="outline">
        {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        Fetch GA4 Properties
      </Button>
      {fetched && properties.length > 0 && (
        <div className="space-y-2">
          {properties.map((prop) => (
            <div key={prop.propertyId} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{prop.displayName}</p>
                <p className="text-xs text-gray-500">{prop.account} &middot; {prop.propertyId}</p>
              </div>
              <Button
                size="sm"
                onClick={() => selectProperty(prop.propertyId)}
                disabled={saving === prop.propertyId}
              >
                {saving === prop.propertyId && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Link
              </Button>
            </div>
          ))}
        </div>
      )}
      {fetched && properties.length === 0 && (
        <p className="text-sm text-gray-400">No GA4 properties found for this Google account.</p>
      )}
    </div>
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
  connectedProviders,
  sites,
  orgId,
  integrations,
}: SettingsViewProps) {
  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          <CheckCircle className="h-4 w-4" />
          {successMessage === "gsc_connected" && "Google Search Console connected successfully!"}
          {successMessage === "ga4_connected" && "Google Analytics 4 connected successfully!"}
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
              connectHref={connectedProviders.includes("gsc") ? undefined : "/api/v1/integrations/gsc/connect"}
            >
              {connectedProviders.includes("gsc") ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href="/api/v1/integrations/gsc/connect">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Reconnect
                      </a>
                    </Button>
                  </div>
                  <GscSitePicker orgId={orgId} />
                </div>
              ) : undefined}
            </IntegrationCard>
            <IntegrationCard
              name="Google Analytics 4"
              description="Import sessions, conversions, and traffic data"
              provider="ga4"
              isConnected={connectedProviders.includes("ga4")}
              connectHref={connectedProviders.includes("ga4") ? undefined : "/api/v1/integrations/ga4/connect"}
            >
              {connectedProviders.includes("ga4") ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href="/api/v1/integrations/ga4/connect">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Reconnect
                      </a>
                    </Button>
                  </div>
                  <Ga4PropertyPicker orgId={orgId} />
                </div>
              ) : undefined}
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
