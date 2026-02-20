export const SITE_NAME = "LabVex";
export const SITE_DESCRIPTION =
  "En kaliteli HD videolar. Kategoriler, starlar ve daha fazlası.";

// Navigation items
export const NAV_ITEMS = [
  { label: "Ana Sayfa", href: "/", icon: "Home" },
  { label: "Kategoriler", href: "/kategoriler", icon: "Grid3X3" },
  { label: "Shorts", href: "/shorts", icon: "Play" },
  { label: "Starlar", href: "/starlar", icon: "Star" },
] as const;

// Bottom navigation for mobile
export const BOTTOM_NAV_ITEMS = [
  { label: "Ana Sayfa", href: "/", icon: "Home" },
  { label: "Kategoriler", href: "/kategoriler", icon: "Grid3X3" },
  { label: "Shorts", href: "/shorts", icon: "Play" },
  { label: "Starlar", href: "/starlar", icon: "Star" },
  { label: "Profil", href: "/profil", icon: "User" },
] as const;

// Video quality labels
export const QUALITY_LABELS: Record<string, string> = {
  HD: "HD",
  FHD: "1080p",
  "4K": "4K",
};

// Duration formatter
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// View count formatter (1.2K, 3.5M etc.)
export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

// Relative time (2 saat once, 3 gun once etc.)
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) return `${diffYear} yıl önce`;
  if (diffMonth > 0) return `${diffMonth} ay önce`;
  if (diffWeek > 0) return `${diffWeek} hafta önce`;
  if (diffDay > 0) return `${diffDay} gün önce`;
  if (diffHour > 0) return `${diffHour} saat önce`;
  if (diffMin > 0) return `${diffMin} dakika önce`;
  return "az önce";
}
