"use client";

import { useEffect, useState } from "react";
import { SandboxProvider } from "@/lib/sandbox/context";
import { DemoInterface } from "./demo-interface";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generateSandboxData } from "@/lib/sandbox/generator";
import type { SyntheticSite } from "@/lib/sandbox/generator";

export default function SandboxDemoPage() {
  const [loading, setLoading] = useState(true);
  const [sandboxData, setSandboxData] = useState<{
    id: string;
    access_token: string;
    expires_at: string;
    role: string;
    synthetic_data: SyntheticSite;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function createSandbox() {
      try {
        const res = await fetch("/api/v1/sandbox/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template: "site_audit", role: "prospect" }),
        });
        const data = await res.json();
        if (data.success) {
          setSandboxData(data.data);
        } else {
          // Fallback: generate synthetic data client-side
          const syntheticData = generateSandboxData("site_audit", Date.now());
          setSandboxData({
            id: `demo_${Date.now()}`,
            access_token: "demo",
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            role: "prospect",
            synthetic_data: syntheticData,
          });
        }
      } catch {
        const syntheticData = generateSandboxData("site_audit", 42);
        setSandboxData({
          id: "demo_fallback",
          access_token: "demo",
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          role: "prospect",
          synthetic_data: syntheticData,
        });
      } finally {
        setLoading(false);
      }
    }
    createSandbox();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Spinning up your demo environment...</p>
        <p className="text-xs text-gray-400">This takes under 5 seconds</p>
      </div>
    );
  }

  if (!sandboxData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || "Failed to create demo"}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SandboxProvider
      value={{
        isSandbox: true,
        sandboxId: sandboxData.id,
        accessToken: sandboxData.access_token,
        role: sandboxData.role,
        expiresAt: sandboxData.expires_at,
        domain: sandboxData.synthetic_data.domain,
      }}
    >
      <DemoInterface data={sandboxData.synthetic_data} expiresAt={sandboxData.expires_at} sandboxId={sandboxData.id} />
    </SandboxProvider>
  );
}
