import { NextResponse } from "next/server";
import { getGa4AuthUrl } from "@/lib/integrations/ga4";

export async function GET() {
  try {
    const url = getGa4AuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to initiate GA4 OAuth" }, { status: 500 });
  }
}
