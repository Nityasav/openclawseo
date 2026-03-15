"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SandboxProvider } from "@/lib/sandbox/context";
import { DemoInterface } from "./demo-interface";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { generateSandboxData } from "@/lib/sandbox/generator";
import type { SyntheticSite } from "@/lib/sandbox/generator";

export default function SandboxDemoPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
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
    async function loadSandbox() {
      try {
        if (token) {
          const res = await fetch(`/api/v1/sandbox/by-token?token=${encodeURIComponent(token)}`);
          const data = await res.json();
          if (data.success) {
            setSandboxData(data.data);
          } else {
            setError(data.error || "Invalid or expired link");
          }
          setLoading(false);
          return;
        }
        const res = await fetch("/api/v1/sandbox/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template: "site_audit", role: "prospect" }),
        });
        const data = await res.json();
        if (data.success) {
          setSandboxData(data.data);
        } else {
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
    loadSandbox();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <p className="text-sm text-white/70">Spinning up your demo environment...</p>
        <p className="text-xs text-white/40">This takes under 5 seconds</p>
      </div>
    );
  }

  if (!sandboxData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-red-400">{error || "Failed to create demo"}</p>
          <Button className="mt-4" asChild>
            <a href="/sandbox/demo">{token ? "Start a fresh demo" : "Try again"}</a>
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
