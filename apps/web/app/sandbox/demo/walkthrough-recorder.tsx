"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, CircleStop, Crosshair, Loader2 } from "lucide-react";
import { useSandbox } from "@/lib/sandbox/context";
import { useWalkthrough } from "@/hooks/use-walkthrough";
import { cn } from "@/lib/utils";

export function WalkthroughRecorder() {
  const { isRecording, setIsRecording, walkthroughSteps } = useSandbox();
  const { addStep, isSaving } = useWalkthrough();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capturedHash, setCapturedHash] = useState("");
  const [capturedScrollY, setCapturedScrollY] = useState(0);

  function handleOpenCapture() {
    // Snapshot scroll + hash at the moment capture is triggered
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    setCapturedHash(hash);
    setCapturedScrollY(scrollY);
    setTitle("");
    setDescription("");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    const ok = await addStep({ title: title.trim(), description: description.trim() });
    if (ok) {
      setDialogOpen(false);
    }
  }

  return (
    <>
      {/* Floating pill */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {isRecording && (
          <div className="flex items-center gap-2 rounded-full border border-red-500/40 bg-[#1a0808] px-3 py-1.5 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-red-400">REC</span>
            <span className="text-xs text-white/50">{walkthroughSteps.length} step{walkthroughSteps.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isRecording && (
            <>
              <Button
                size="sm"
                onClick={handleOpenCapture}
                className="rounded-full border border-white/10 bg-white/[0.06] text-white shadow-xl backdrop-blur hover:bg-white/[0.12]"
              >
                <Crosshair className="mr-1.5 h-3.5 w-3.5" />
                Capture Step
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRecording(false)}
                className="rounded-full border-red-500/30 bg-red-500/10 text-red-400 shadow-xl hover:bg-red-500/20 hover:text-red-300"
              >
                <CircleStop className="mr-1.5 h-3.5 w-3.5" />
                Stop
              </Button>
            </>
          )}

          {!isRecording && (
            <Button
              size="sm"
              onClick={() => setIsRecording(true)}
              className="rounded-full border border-white/10 bg-[#141414] text-white shadow-xl backdrop-blur hover:bg-white/[0.08]"
            >
              <Camera className="mr-1.5 h-3.5 w-3.5" />
              Record
            </Button>
          )}
        </div>
      </div>

      {/* Capture Step dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/[0.08] bg-[#141414] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Crosshair className="h-4 w-4 text-white/60" />
              Capture Walkthrough Step
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Step Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Review keyword opportunities"
                className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/30"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should the user do or notice at this step?"
                className="min-h-[80px] border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/30 resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {capturedHash && (
                <div className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Hash</span>
                  <span className="font-mono text-xs text-white/60">{capturedHash || "—"}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.03] px-2 py-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Scroll</span>
                <span className="font-mono text-xs text-white/60">{capturedScrollY}px</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || isSaving}
              className="bg-white text-black hover:bg-white/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Step"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
