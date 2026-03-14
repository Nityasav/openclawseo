import { NextResponse } from "next/server";
import { getGscAuthUrl } from "@/lib/integrations/gsc";

export async function GET() {
  try {
    const url = getGscAuthUrl();
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to initiate GSC OAuth" }, { status: 500 });
  }
}
