import type { Video, Category, Star } from "@/types";

// Mock categories for development
export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Amatör",
    slug: "amator",
    video_count: 1250,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "2",
    name: "Anal",
    slug: "anal",
    video_count: 890,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "3",
    name: "Asyalı",
    slug: "asyali",
    video_count: 2100,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "4",
    name: "Sarışın",
    slug: "sarisin",
    video_count: 1800,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "5",
    name: "Esmer",
    slug: "esmer",
    video_count: 1650,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "6",
    name: "Cumshot",
    slug: "cumshot",
    video_count: 980,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "7",
    name: "MILF",
    slug: "milf",
    video_count: 2400,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "8",
    name: "Lezbiyen",
    slug: "lezbiyen",
    video_count: 1100,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "9",
    name: "Genç (18+)",
    slug: "genc",
    video_count: 3200,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "10",
    name: "Üçlü",
    slug: "uclu",
    video_count: 750,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "11",
    name: "POV",
    slug: "pov",
    video_count: 1900,
    thumbnail_url: "/placeholder-category.jpg",
  },
  {
    id: "12",
    name: "Oral",
    slug: "oral",
    video_count: 2800,
    thumbnail_url: "/placeholder-category.jpg",
  },
];

// Mock stars for development
export const mockStars: Star[] = [
  {
    id: "1",
    name: "Lana Rhoades",
    slug: "lana-rhoades",
    video_count: 245,
    view_count: 12500000,
    avatar_url: "/placeholder-star.jpg",
  },
  {
    id: "2",
    name: "Mia Khalifa",
    slug: "mia-khalifa",
    video_count: 89,
    view_count: 9800000,
    avatar_url: "/placeholder-star.jpg",
  },
  {
    id: "3",
    name: "Riley Reid",
    slug: "riley-reid",
    video_count: 312,
    view_count: 15200000,
    avatar_url: "/placeholder-star.jpg",
  },
  {
    id: "4",
    name: "Abella Danger",
    slug: "abella-danger",
    video_count: 420,
    view_count: 11000000,
    avatar_url: "/placeholder-star.jpg",
  },
  {
    id: "5",
    name: "Angela White",
    slug: "angela-white",
    video_count: 380,
    view_count: 8900000,
    avatar_url: "/placeholder-star.jpg",
  },
  {
    id: "6",
    name: "Eva Elfie",
    slug: "eva-elfie",
    video_count: 156,
    view_count: 7200000,
    avatar_url: "/placeholder-star.jpg",
  },
];

// Mock videos for development
export const mockVideos: Video[] = Array.from({ length: 24 }, (_, i) => ({
  id: `video-${i + 1}`,
  title: [
    "Güzel sarışın evde yalnız kalınca",
    "Asyalı güzel ilk deneyimini yaşıyor",
    "Esmer güzel duşta yakalandı",
    "Amatör çift kamera önünde",
    "Seksi MILF genç adamı baştan çıkarıyor",
    "Lezbiyen çift havuz başında",
    "POV deneyimi ile unutulmaz anlar",
    "Üçlü macera başlıyor",
    "Genç çift otel odasında",
    "Ofiste gizli buluşma",
    "Plajda tanışma ve devamı",
    "Yoga dersi beklenmedik şekilde bitti",
  ][i % 12],
  slug: `video-${i + 1}`,
  description: "Bu bir test video açıklamasıdır.",
  duration: Math.floor(Math.random() * 1800) + 120, // 2-30 min
  orientation: i % 5 === 0 ? "vertical" : "horizontal",
  thumbnail_url: `/api/placeholder/${i % 5 === 0 ? "720/1280" : "1280/720"}`,
  video_url: "",
  view_count: Math.floor(Math.random() * 500000) + 1000,
  like_count: Math.floor(Math.random() * 10000) + 100,
  comment_count: Math.floor(Math.random() * 500) + 10,
  quality: (["HD", "FHD", "4K"] as const)[Math.floor(Math.random() * 3)],
  status: "published",
  categories: [
    mockCategories[Math.floor(Math.random() * mockCategories.length)],
  ],
  stars: [mockStars[Math.floor(Math.random() * mockStars.length)]],
  created_at: new Date(
    Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)
  ).toISOString(),
  updated_at: new Date().toISOString(),
}));
