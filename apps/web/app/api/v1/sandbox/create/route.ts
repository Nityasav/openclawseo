import { createServiceClient } from "@/lib/supabase/server";
import { CreateSandboxSchema } from "@/types/schemas";
import { generateSandboxData } from "@/lib/sandbox/generator";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSandboxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { template, role, org_id } = parsed.data;
    const accessToken = randomBytes(32).toString("hex");

    // Generate synthetic data immediately (no Docker for Vercel deployment)
    const syntheticData = generateSandboxData(template, Date.now());

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
      })
      .select()
      .single();

    if (error || !sandbox) {
      // Fallback: return in-memory sandbox data without DB persistence
      return NextResponse.json({
        success: true,
        data: {
          id: `demo_${Date.now()}`,
          access_token: accessToken,
          template,
          role,
          status: "ready",
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
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
        synthetic_data: syntheticData,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create sandbox";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
