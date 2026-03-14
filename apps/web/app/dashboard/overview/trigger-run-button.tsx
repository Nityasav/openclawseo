"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TriggerRunButton({ siteId }: { siteId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to trigger run", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleTrigger} disabled={loading} size="sm">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
      Run Audit Now
    </Button>
  );
}
