import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: { user: { id: user.id, email: user.email }, profile },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to get session" },
      { status: 500 }
    );
  }
}
