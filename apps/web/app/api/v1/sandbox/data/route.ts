import { generateScenarioData, SandboxTemplate } from "@/lib/sandbox/generator";
import { DEFAULT_FLAGS_BY_PROFILE, type SandboxIndustry, type SandboxDataProfile } from "@/lib/sandbox/scenario";
import { NextRequest, NextResponse } from "next/server";

const VALID_TEMPLATES: SandboxTemplate[] = ["site_audit", "competitor_analysis", "content_strategy"];
const VALID_INDUSTRIES: SandboxIndustry[] = ["saas", "ecommerce", "local_business", "media", "agency"];
const VALID_PROFILES: SandboxDataProfile[] = ["healthy", "struggling", "recovering", "new_site", "peak_performance"];

// GET /api/v1/sandbox/data?template=site_audit&seed=42&industry=saas&dataProfile=struggling
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const template = (searchParams.get("template") ?? "site_audit") as SandboxTemplate;
  const seed = parseInt(searchParams.get("seed") ?? "42", 10);
  const industry = searchParams.get("industry") as SandboxIndustry | null;
  const dataProfile = searchParams.get("dataProfile") as SandboxDataProfile | null;

  if (!VALID_TEMPLATES.includes(template)) {
    return NextResponse.json(
      { success: false, error: `Invalid template. Must be one of: ${VALID_TEMPLATES.join(", ")}` },
      { status: 400 }
    );
  }
  if (industry && !VALID_INDUSTRIES.includes(industry)) {
    return NextResponse.json(
      { success: false, error: `Invalid industry. Must be one of: ${VALID_INDUSTRIES.join(", ")}` },
      { status: 400 }
    );
  }
  if (dataProfile && !VALID_PROFILES.includes(dataProfile)) {
    return NextResponse.json(
      { success: false, error: `Invalid dataProfile. Must be one of: ${VALID_PROFILES.join(", ")}` },
      { status: 400 }
    );
  }

  const config = industry || dataProfile ? {
    industry: industry ?? "saas",
    dataProfile: dataProfile ?? "healthy",
    featureFlags: DEFAULT_FLAGS_BY_PROFILE[dataProfile ?? "healthy"],
  } : undefined;

  const data = generateScenarioData(template, isNaN(seed) ? 42 : seed, config);

  return NextResponse.json({ success: true, data });
}
