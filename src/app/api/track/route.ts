import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Anon key - SECURITY DEFINER fonksiyonlar RLS bypass eder
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, type, duration, percentage } = body;

    if (!videoId || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null;
    const ua = request.headers.get("user-agent") || null;

    if (type === "view") {
      // View count +1 (her zaman artar)
      await supabase.rpc("increment_view_count", { p_video_id: videoId });

      // Detaylı view kaydı (günlük tekil)
      await supabase.rpc("record_video_view", {
        p_video_id: videoId,
        p_watch_duration: 0,
        p_watch_percentage: 0,
        p_ip: ip,
        p_user_agent: ua,
      });
    } else if (type === "watch") {
      // Watch duration/percentage güncelle
      await supabase.rpc("record_video_view", {
        p_video_id: videoId,
        p_watch_duration: Math.round(duration || 0),
        p_watch_percentage: Math.round(percentage || 0),
        p_ip: ip,
        p_user_agent: ua,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
