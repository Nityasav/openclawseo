import { createServiceClient } from "@/lib/supabase/server";
import { CreateSandboxWithScenarioSchema } from "@/types/schemas";
import { generateScenarioData } from "@/lib/sandbox/generator";
import { isScenarioConfig } from "@/lib/sandbox/scenario";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSandboxWithScenarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { template, role, org_id, scenario_name, scenario_config } = parsed.data;
    const accessToken = randomBytes(32).toString("hex");
    const seed = Date.now();

    const syntheticData = generateScenarioData(
      template,
      seed,
      isScenarioConfig(scenario_config) ? scenario_config : undefined
    );

    const supabase = createServiceClient();

    const { data: sandbox, error } = await supabase
      .from("sandbox_environments")
      .insert({
        org_id: org_id ?? null,
        template,
        status: "ready",
        access_token: accessToken,
        role,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        scenario_name: scenario_name ?? null,
        scenario_config: scenario_config ?? null,
        walkthrough_steps: [],
        is_template: false,
      })
      .select()
      .single();

    if (error || !sandbox) {
      return NextResponse.json({
        success: true,
        data: {
          id: `demo_${Date.now()}`,
          access_token: accessToken,
          template,
          role,
          status: "ready",
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          scenario_name: scenario_name ?? null,
          scenario_config: scenario_config ?? null,
          walkthrough_steps: [],
          is_template: false,
          synthetic_data: syntheticData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: sandbox.id,
        access_token: sandbox.access_token,
        template: sandbox.template,
        role: sandbox.role,
        status: sandbox.status,
        expires_at: sandbox.expires_at,
        scenario_name: sandbox.scenario_name,
        scenario_config: sandbox.scenario_config,
        walkthrough_steps: sandbox.walkthrough_steps ?? [],
        is_template: sandbox.is_template,
        synthetic_data: syntheticData,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create sandbox";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
