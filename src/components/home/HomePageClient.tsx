"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeTabs, type TabKey } from "./HomeTabs";
import { VideoGrid } from "@/components/video/VideoGrid";
import type { Video } from "@/types";

interface HomePageClientProps {
  trendingVideos: Video[];
  newVideos: Video[];
  popularVideos: Video[];
  topRatedVideos: Video[];
}

const tabTitles: Record<TabKey, string> = {
  trending: "Trend Videolar",
  newest: "Yeni Eklenenler",
  "most-viewed": "En Çok İzlenenler",
  "top-rated": "En Beğenilenler",
};

export function HomePageClient({
  trendingVideos,
  newVideos,
  popularVideos,
  topRatedVideos,
}: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("trending");
  const [extraVideos, setExtraVideos] = useState<Video[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(8);
  const [hasMore, setHasMore] = useState(true);

  const tabVideos: Record<TabKey, Video[]> = {
    trending: trendingVideos,
    newest: newVideos,
    "most-viewed": popularVideos,
    "top-rated": topRatedVideos,
  };

  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/videos?offset=${offset}&limit=12`);
      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        setExtraVideos((prev) => [...prev, ...data.videos]);
        setOffset((prev) => prev + 12);
        if (data.videos.length < 12) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch {
      // Sessiz hata
    } finally {
      setLoadingMore(false);
    }
  }, [offset]);

  return (
    <>
      <HomeTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-4">
        <VideoGrid
          videos={tabVideos[activeTab]}
          title={tabTitles[activeTab]}
          columns={4}
        />
      </div>

      {extraVideos.length > 0 && (
        <div className="mt-6">
          <VideoGrid videos={extraVideos} columns={4} />
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center pb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2 px-8"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Daha Fazla Yükle
          </Button>
        </div>
      )}
    </>
  );
}
