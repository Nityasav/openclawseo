"use client";

import { useState } from "react";
import { useSandbox } from "@/lib/sandbox/context";
import type { WalkthroughStep } from "@/lib/sandbox/scenario";

interface AddStepInput {
  title: string;
  description: string;
}

export function useWalkthrough() {
  const { sandboxId, accessToken, walkthroughSteps, addWalkthroughStep, removeWalkthroughStep } = useSandbox();
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  async function addStep(input: AddStepInput): Promise<boolean> {
    if (!sandboxId) return false;
    setIsSaving(true);

    const step: WalkthroughStep = {
      id: `step_${Date.now()}`,
      title: input.title,
      description: input.description,
      url_hash: typeof window !== "undefined" ? window.location.hash : "",
      scroll_y: typeof window !== "undefined" ? window.scrollY : 0,
      captured_at: new Date().toISOString(),
    };

    // Optimistic update
    addWalkthroughStep(step);

    try {
      const res = await fetch(`/api/v1/sandbox/${sandboxId}/walkthrough`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          title: input.title,
          description: input.description,
          url_hash: step.url_hash,
          scroll_y: step.scroll_y,
        }),
      });
      if (!res.ok) {
        // Roll back on failure
        removeWalkthroughStep(step.id);
        return false;
      }
      return true;
    } catch {
      removeWalkthroughStep(step.id);
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function removeStep(stepId: string): Promise<boolean> {
    if (!sandboxId) return false;
    setIsRemoving(stepId);

    // Optimistic remove
    removeWalkthroughStep(stepId);

    try {
      await fetch(`/api/v1/sandbox/${sandboxId}/walkthrough?stepId=${stepId}`, {
        method: "DELETE",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsRemoving(null);
    }
  }

  return {
    steps: walkthroughSteps,
    addStep,
    removeStep,
    isSaving,
    isRemoving,
  };
}
