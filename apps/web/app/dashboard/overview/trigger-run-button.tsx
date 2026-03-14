"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function TriggerRunButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const pollRunStatus = useCallback(
    (runId: string) => {
      setPolling(true);
      let attempts = 0;
      const maxAttempts = 20; // ~60 seconds

      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await fetch(`/api/v1/agent/status/${runId}`);
          const data = await res.json();
          const status = data.data?.status;

          router.refresh();

          if (status === "complete" || status === "failed" || attempts >= maxAttempts) {
            clearInterval(interval);
            setPolling(false);
            if (status === "complete") {
              toast({ title: "Audit complete!", description: "Your SEO report is ready." });
            } else if (status === "failed") {
              toast({
                title: "Audit failed",
                description: data.data?.error_message ?? "Run failed",
                variant: "destructive",
              });
            }
          }
        } catch {
          clearInterval(interval);
          setPolling(false);
        }
      }, 3000);
    },
    [router, toast]
  );

  async function handleTrigger() {
    if (!siteId) {
      toast({ title: "No site found", description: "Add a site in Settings first", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/agent/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: siteId, run_type: "full" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Audit started!", description: `Run ID: ${data.data.run_id}` });
        router.refresh();
        pollRunStatus(data.data.run_id);
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to trigger run", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const isActive = loading || polling;

  return (
    <Button onClick={handleTrigger} disabled={isActive} size="sm">
      {isActive ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Zap className="mr-1.5 h-3 w-3" strokeWidth={1.5} />}
      {polling ? "Running..." : "Run Audit Now"}
    </Button>
  );
}
