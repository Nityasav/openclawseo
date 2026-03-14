"use client";

import React, { createContext, useContext } from "react";

interface SandboxContextType {
  isSandbox: boolean;
  sandboxId?: string;
  accessToken?: string;
  role?: string;
  expiresAt?: string;
  domain?: string;
}

const SandboxContext = createContext<SandboxContextType>({ isSandbox: false });

export function SandboxProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: SandboxContextType;
}) {
  return (
    <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>
  );
}

export function useSandbox(): SandboxContextType {
  return useContext(SandboxContext);
}
