import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Use admin client to create user with auto-confirm (bypasses email confirmation)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm — no email verification required
    });

    if (adminError) {
      // Handle "already exists" gracefully
      if (adminError.message.includes("already been registered") || adminError.message.includes("already exists")) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: adminError.message },
        { status: 400 }
      );
    }

    // Now sign the user in immediately using the regular client
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: signInError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId: adminData.user?.id });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
