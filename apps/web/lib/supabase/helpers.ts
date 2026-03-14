/**
 * Helper to safely extract org_id from a profile query result.
 * Works around TypeScript strict mode issues with Supabase typed client.
 */
export function getOrgId(profile: unknown): string | null {
  if (!profile || typeof profile !== "object") return null;
  const p = profile as Record<string, unknown>;
  return typeof p.org_id === "string" ? p.org_id : null;
}

export function getField<T>(obj: unknown, key: string): T | null {
  if (!obj || typeof obj !== "object") return null;
  return (obj as Record<string, unknown>)[key] as T | null;
}
