import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ integrations: [] });
    }

    const { data: integrations } = await supabase
      .from("integrations")
      .select("provider")
      .eq("org_id", profile.org_id);

    return NextResponse.json({ integrations: integrations ?? [] });
  } catch (err) {
    return NextResponse.json({ integrations: [] });
  }
}
