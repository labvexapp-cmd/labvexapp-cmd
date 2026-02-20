import type { Video, Category, Star } from "@/types";

const SITE_URL = "https://labvex.site";
const SITE_NAME = "LabVex";

// JSON-LD: VideoObject schema for video pages
export function generateVideoJsonLd(video: Video) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description || video.title,
    thumbnailUrl: video.thumbnail_url,
    uploadDate: video.created_at,
    duration: formatIsoDuration(video.duration),
    contentUrl: video.video_url || undefined,
    embedUrl: `${SITE_URL}/video/${video.slug}`,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: video.view_count,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: video.like_count,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: video.comment_count,
      },
    ],
    ...(video.stars.length > 0 && {
      actor: video.stars.map((star) => ({
        "@type": "Person",
        name: star.name,
        url: `${SITE_URL}/star/${star.slug}`,
      })),
    }),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    isFamilyFriendly: false,
  };
}

// JSON-LD: ItemList for category/star pages
export function generateItemListJsonLd(
  title: string,
  url: string,
  videos: Video[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    url,
    numberOfItems: videos.length,
    itemListElement: videos.slice(0, 10).map((video, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/video/${video.slug}`,
      name: video.title,
    })),
  };
}

// JSON-LD: Person for star pages
export function generateStarJsonLd(star: Star) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: star.name,
    url: `${SITE_URL}/star/${star.slug}`,
    image: star.avatar_url,
    description: star.bio,
  };
}

// JSON-LD: WebSite schema for homepage
export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/arama?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// JSON-LD: BreadcrumbList
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Helper: Convert seconds to ISO 8601 duration (PT1H2M3S)
function formatIsoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result = "PT";
  if (hours > 0) result += `${hours}H`;
  if (minutes > 0) result += `${minutes}M`;
  result += `${secs}S`;
  return result;
}

// Generate meta tags for video pages
export function generateVideoMeta(video: Video) {
  return {
    title: `${video.title} - ${SITE_NAME}`,
    description:
      video.description ||
      `${video.title} - ${video.quality || "HD"} kalitede izle. ${SITE_NAME}'de ücretsiz.`,
    openGraph: {
      title: video.title,
      description: video.description || video.title,
      url: `${SITE_URL}/video/${video.slug}`,
      type: "video.other",
      videos: video.video_url
        ? [
            {
              url: video.video_url,
              width: video.orientation === "vertical" ? 720 : 1920,
              height: video.orientation === "vertical" ? 1280 : 1080,
            },
          ]
        : [],
      images: video.thumbnail_url
        ? [
            {
              url: video.thumbnail_url,
              width: 1280,
              height: 720,
              alt: video.title,
            },
          ]
        : [],
    },
    twitter: {
      card: "player" as const,
      title: video.title,
      description: video.description || video.title,
    },
  };
}
