"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Github, Globe, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitOptimizationRequest } from "@/lib/infragility-api-client";

type FormData = {
  repositoryUrl: string;
  optimizationType: "seo" | "geo" | "both";
  priority: "normal" | "high" | "urgent";
  notes: string;
  requirements: {
    metaTags: boolean;
    structuredData: boolean;
    performance: boolean;
    accessibility: boolean;
    localization: boolean;
    analytics: boolean;
  };
};

const initialFormData: FormData = {
  repositoryUrl: "",
  optimizationType: "both",
  priority: "normal",
  notes: "",
  requirements: {
    metaTags: true,
    structuredData: true,
    performance: true,
    accessibility: true,
    localization: false,
    analytics: false,
  },
};

const priorityConfig = {
  normal: { color: "bg-blue-500", label: "Normal (48h)", price: "$499" },
  high: { color: "bg-amber-500", label: "High (24h)", price: "$799" },
  urgent: { color: "bg-red-500", label: "Urgent (12h)", price: "$1299" },
};

export default function OptimizationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitOptimizationRequest(formData);
    } catch (error) {
      console.error("Failed to submit optimization request:", error);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData(initialFormData);
      }, 3000);
    }
  };

  const handleRequirementChange = (requirement: keyof FormData["requirements"]) => {
    setFormData((prev) => ({
      ...prev,
      requirements: { ...prev.requirements, [requirement]: !prev.requirements[requirement] },
    }));
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
          <Send className="h-6 w-6 text-green-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">Request Submitted!</h3>
        <p className="text-white/40 text-sm">
          Your SEO/GEO optimization request has been received. Our CEO agent will dispatch the specialist team immediately.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="repositoryUrl" className="mb-2 flex items-center gap-2 text-white/70">
          <Github className="h-4 w-4" />
          GitHub Repository URL
        </Label>
        <Input
          id="repositoryUrl"
          placeholder="https://github.com/username/repository"
          value={formData.repositoryUrl}
          onChange={(e) => setFormData((p) => ({ ...p, repositoryUrl: e.target.value }))}
          required
          className="font-mono"
        />
        <p className="mt-1 text-xs text-white/30">Public repository URL. Our agents will clone and analyze it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="mb-3 flex items-center gap-2 text-white/70">
              <Target className="h-4 w-4" />
              Optimization Type
            </Label>
            <RadioGroup
              value={formData.optimizationType}
              onValueChange={(value: FormData["optimizationType"]) =>
                setFormData((p) => ({ ...p, optimizationType: value }))
              }
              className="space-y-2"
            >
              {(["seo", "geo", "both"] as const).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="cursor-pointer text-sm text-white/60 font-normal">
                    {type === "seo" ? "SEO Only" : type === "geo" ? "GEO Only" : "SEO + GEO (Recommended)"}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-3 flex items-center gap-2 text-white/70">
              <Zap className="h-4 w-4" />
              Priority Level
            </Label>
            <div className="space-y-2">
              {(Object.entries(priorityConfig) as [FormData["priority"], typeof priorityConfig.normal][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, priority: key }))}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-sm transition-colors",
                    formData.priority === key
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-white/[0.06] text-white/50 hover:bg-white/[0.04] hover:text-white/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
                    <span>{config.label}</span>
                  </div>
                  <span className="text-white/40">{config.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="mb-3 flex items-center gap-2 text-white/70">
              <Globe className="h-4 w-4" />
              Requirements
            </Label>
            <div className="space-y-3">
              {(Object.entries(formData.requirements) as [keyof FormData["requirements"], boolean][]).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={() => handleRequirementChange(key)}
                  />
                  <Label htmlFor={key} className="cursor-pointer text-sm font-normal text-white/60">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-white/70">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Specific requirements, target keywords, geographic focus, etc."
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              className="min-h-[100px] mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">Estimated Delivery</h4>
            <p className="text-xs text-white/40">{priorityConfig[formData.priority].label} • Includes full pipeline</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{priorityConfig[formData.priority].price}</div>
            <div className="text-xs text-white/40">One-time fee</div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !formData.repositoryUrl}
        className="w-full bg-gradient-to-r from-blue-600 to-teal-400 hover:from-blue-700 hover:to-teal-500 text-white"
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Optimization Request
          </>
        )}
      </Button>

      <p className="text-center text-xs text-white/30">
        By submitting, you agree to our terms. Our specialist agents will handle the entire optimization pipeline automatically.
      </p>
    </form>
  );
}
