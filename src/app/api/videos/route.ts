import { NextRequest, NextResponse } from "next/server";
import { getVideosFeed } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 24);

  const videos = await getVideosFeed(limit, offset);
  return NextResponse.json({ videos });
}
