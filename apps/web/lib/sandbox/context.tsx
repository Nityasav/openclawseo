"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ScenarioConfig, WalkthroughStep } from "./scenario";

interface SandboxContextType {
  isSandbox: boolean;
  sandboxId?: string;
  accessToken?: string;
  role?: string;
  expiresAt?: string;
  domain?: string;
  // Scenario
  scenarioConfig?: ScenarioConfig;
  scenarioName?: string;
  isTemplate?: boolean;
  // Walkthrough state
  walkthroughSteps: WalkthroughStep[];
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  addWalkthroughStep: (step: WalkthroughStep) => void;
  removeWalkthroughStep: (stepId: string) => void;
}

const SandboxContext = createContext<SandboxContextType>({
  isSandbox: false,
  walkthroughSteps: [],
  isRecording: false,
  setIsRecording: () => {},
  addWalkthroughStep: () => {},
  removeWalkthroughStep: () => {},
});

interface SandboxProviderProps {
  children: React.ReactNode;
  value: {
    isSandbox: boolean;
    sandboxId?: string;
    accessToken?: string;
    role?: string;
    expiresAt?: string;
    domain?: string;
    scenarioConfig?: ScenarioConfig;
    scenarioName?: string;
    isTemplate?: boolean;
    initialSteps?: WalkthroughStep[];
  };
}

export function SandboxProvider({ children, value }: SandboxProviderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[]>(
    value.initialSteps ?? []
  );

  const addWalkthroughStep = useCallback((step: WalkthroughStep) => {
    setWalkthroughSteps((prev) => [...prev, step]);
  }, []);

  const removeWalkthroughStep = useCallback((stepId: string) => {
    setWalkthroughSteps((prev) => prev.filter((s) => s.id !== stepId));
  }, []);

  return (
    <SandboxContext.Provider
      value={{
        isSandbox: value.isSandbox,
        sandboxId: value.sandboxId,
        accessToken: value.accessToken,
        role: value.role,
        expiresAt: value.expiresAt,
        domain: value.domain,
        scenarioConfig: value.scenarioConfig,
        scenarioName: value.scenarioName,
        isTemplate: value.isTemplate,
        walkthroughSteps,
        isRecording,
        setIsRecording,
        addWalkthroughStep,
        removeWalkthroughStep,
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
}

export function useSandbox(): SandboxContextType {
  return useContext(SandboxContext);
}
