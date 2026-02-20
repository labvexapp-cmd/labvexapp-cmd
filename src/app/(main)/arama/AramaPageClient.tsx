"use client";

import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/video/VideoCard";
import { mockVideos, mockCategories } from "@/lib/mock-data";
import type { Video } from "@/types";

type SortOption = "relevant" | "newest" | "most-viewed" | "longest";

export function AramaPageClient() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevant");
  const [showSort, setShowSort] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const sortLabels: Record<SortOption, string> = {
    relevant: "En Alakalı",
    newest: "En Yeni",
    "most-viewed": "En Çok İzlenen",
    longest: "En Uzun",
  };

  const filteredVideos = useMemo(() => {
    let results = [...mockVideos];

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.stars.some((s) => s.name.toLowerCase().includes(q)) ||
          v.categories.some((c) => c.name.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter((v) =>
        v.categories.some((c) => c.slug === selectedCategory)
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        results.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
      case "most-viewed":
        results.sort((a, b) => b.view_count - a.view_count);
        break;
      case "longest":
        results.sort((a, b) => b.duration - a.duration);
        break;
      default:
        // relevant - keep default order (or sort by likes for mock)
        results.sort((a, b) => b.like_count - a.like_count);
    }

    return results;
  }, [query, sortBy, selectedCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      {/* Search header */}
      <div className="mb-6">
        <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl">
          <Search className="h-6 w-6 text-primary" />
          Arama
        </h1>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Video, star veya kategori ara..."
            className="w-full rounded-xl border border-border bg-secondary/50 py-3 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          Tümü
        </Badge>
        {mockCategories.map((cat) => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.slug ? "default" : "outline"}
            className="cursor-pointer transition-colors hover:bg-primary/10"
            onClick={() =>
              setSelectedCategory(
                selectedCategory === cat.slug ? null : cat.slug
              )
            }
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {/* Results bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredVideos.length} sonuç
          {query && (
            <span>
              {" "}
              &middot; &quot;{query}&quot;
            </span>
          )}
        </p>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSort(!showSort)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {sortLabels[sortBy]}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showSort && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSortBy(option);
                    setShowSort(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
                    sortBy === option
                      ? "bg-primary/10 text-primary"
                      : "text-foreground"
                  }`}
                >
                  {sortLabels[option]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Film className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground">
            Sonuç bulunamadı
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Farklı anahtar kelimeler deneyin veya filtreleri değiştirin.
          </p>
        </div>
      )}
    </div>
  );
}
