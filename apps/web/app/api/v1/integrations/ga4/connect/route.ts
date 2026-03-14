import { NextRequest, NextResponse } from "next/server";
import { getGa4AuthUrl } from "@/lib/integrations/ga4";

export async function GET(request: NextRequest) {
  try {
    const source = new URL(request.url).searchParams.get("source") ?? "";
    const url = getGa4AuthUrl(source);
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to initiate GA4 OAuth" }, { status: 500 });
  }
}
