import { NextRequest, NextResponse } from "next/server";
import { getGscAuthUrl } from "@/lib/integrations/gsc";

export async function GET(request: NextRequest) {
  try {
    const source = new URL(request.url).searchParams.get("source") ?? "";
    const url = getGscAuthUrl(source);
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to initiate GSC OAuth" }, { status: 500 });
  }
}
