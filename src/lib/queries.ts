import { createClient } from "@supabase/supabase-js";
import type { Video, Category, Star } from "@/types";

// Server-side Supabase client (anon key - RLS handles access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// VIDEO QUERIES
// ============================================

// Video row'u front-end Video tipine dönüştür
function mapVideo(row: any): Video {
  const cdnBase = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "";
  const quality = row.max_quality === "4K" ? "4K"
    : row.max_quality === "1080p" ? "FHD"
    : "HD";

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || undefined,
    duration: row.duration || 0,
    orientation: row.orientation || "horizontal",
    thumbnail_url: row.thumbnail_url || `${cdnBase}/${row.bunny_video_id}/thumbnail.jpg`,
    preview_url: row.preview_url || undefined,
    video_url: row.video_url || "",
    view_count: row.view_count || 0,
    like_count: row.like_count || 0,
    comment_count: row.comment_count || 0,
    quality,
    status: row.status || "published",
    categories: (row.video_categories || []).map((vc: any) => ({
      id: vc.categories?.id || "",
      name: vc.categories?.name || "",
      slug: vc.categories?.slug || "",
      video_count: vc.categories?.video_count || 0,
    })),
    stars: (row.video_stars || []).map((vs: any) => ({
      id: vs.stars?.id || "",
      name: vs.stars?.name || "",
      slug: vs.stars?.slug || "",
      video_count: vs.stars?.video_count || 0,
      view_count: vs.stars?.view_count || 0,
      avatar_url: vs.stars?.avatar_url || undefined,
    })),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// Video select with joins
const VIDEO_SELECT = `
  *,
  video_categories(categories(id, name, slug, video_count)),
  video_stars(stars(id, name, slug, video_count, view_count, avatar_url))
`;

export async function getVideos(
  orderBy: "view_count" | "created_at" | "like_count" = "created_at",
  limit = 8,
  offset = 0
): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("status", "published")
    .order(orderBy, { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return [];
  return data.map(mapVideo);
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return mapVideo(data);
}

export async function getRelatedVideos(
  videoId: string,
  limit = 8
): Promise<Video[]> {
  // İlgili videoları bul (aynı videoyu hariç tut)
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("status", "published")
    .neq("id", videoId)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapVideo);
}

// ============================================
// CATEGORY QUERIES
// ============================================

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, thumbnail_url, video_count")
    .eq("is_active", true)
    .order("video_count", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, thumbnail_url, video_count")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getCategoryVideos(
  categoryId: string,
  limit = 24
): Promise<Video[]> {
  // video_categories join ile kategoriye ait videoları bul
  const { data: videoIds, error: joinError } = await supabase
    .from("video_categories")
    .select("video_id")
    .eq("category_id", categoryId);

  if (joinError || !videoIds || videoIds.length === 0) return [];

  const ids = videoIds.map((v) => v.video_id);

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("status", "published")
    .in("id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapVideo);
}

// ============================================
// STAR QUERIES
// ============================================

export async function getStars(): Promise<Star[]> {
  const { data, error } = await supabase
    .from("stars")
    .select("id, name, slug, avatar_url, video_count, view_count")
    .eq("is_active", true)
    .order("video_count", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getStarBySlug(slug: string): Promise<Star | null> {
  const { data, error } = await supabase
    .from("stars")
    .select("id, name, slug, avatar_url, bio, video_count, view_count")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getStarVideos(
  starId: string,
  limit = 24
): Promise<Video[]> {
  const { data: videoIds, error: joinError } = await supabase
    .from("video_stars")
    .select("video_id")
    .eq("star_id", starId);

  if (joinError || !videoIds || videoIds.length === 0) return [];

  const ids = videoIds.map((v) => v.video_id);

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .eq("status", "published")
    .in("id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapVideo);
}
