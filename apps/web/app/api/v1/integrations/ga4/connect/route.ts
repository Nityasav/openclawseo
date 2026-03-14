import { NextRequest, NextResponse } from "next/server";
import { getGa4AuthUrl } from "@/lib/integrations/ga4";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { origin, searchParams } = new URL(request.url);
    const source = searchParams.get("source") ?? "";

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`${origin}/auth/login`);
    }

    const url = getGa4AuthUrl(source, user.id);
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to initiate GA4 OAuth" }, { status: 500 });
  }
}
