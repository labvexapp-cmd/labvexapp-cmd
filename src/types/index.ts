export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  duration: number; // seconds
  orientation: "horizontal" | "vertical" | "square";
  thumbnail_url: string;
  preview_url?: string; // animated preview
  video_url: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  quality?: "HD" | "FHD" | "4K";
  status: "draft" | "published" | "processing";
  categories: Category[];
  stars: Star[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  video_count: number;
  translations?: Record<string, { name: string; description?: string }>;
}

export interface Star {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  nationality?: string;
  measurements?: Record<string, string>;
  social_media?: Record<string, string>;
  aliases?: string[];
  video_count: number;
  view_count: number;
  follower_count?: number;
  translations?: Record<string, { name: string; bio?: string }>;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  like_count: number;
  parent_id?: string;
  is_ai_generated: boolean;
  user: {
    username: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  language: string;
  is_premium: boolean;
  created_at: string;
}
