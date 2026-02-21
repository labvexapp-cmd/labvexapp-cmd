"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { formatViewCount } from "@/lib/constants";
import type { Video } from "@/types";

interface ShortsSideActionsProps {
  video: Video;
}

export function ShortsSideActions({ video }: ShortsSideActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(video.like_count);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/shorts/${video.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-5">
      {/* Like */}
      <button
        onClick={handleLike}
        className="flex flex-col items-center gap-1"
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isLiked
              ? "bg-red-500/20 text-red-500"
              : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          }`}
        >
          <Heart
            className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`}
          />
        </div>
        <span className="text-[11px] font-medium text-white">
          {formatViewCount(likeCount)}
        </span>
      </button>

      {/* Comment */}
      <button className="flex flex-col items-center gap-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
          <MessageCircle className="h-6 w-6" />
        </div>
        <span className="text-[11px] font-medium text-white">
          {formatViewCount(video.comment_count)}
        </span>
      </button>

      {/* Save */}
      <button
        onClick={() => setIsSaved(!isSaved)}
        className="flex flex-col items-center gap-1"
      >
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isSaved
              ? "bg-amber-500/20 text-amber-400"
              : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          }`}
        >
          <Bookmark
            className={`h-6 w-6 ${isSaved ? "fill-current" : ""}`}
          />
        </div>
        <span className="text-[11px] font-medium text-white">Kaydet</span>
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        className="flex flex-col items-center gap-1"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors">
          <Share2 className="h-6 w-6" />
        </div>
        <span className="text-[11px] font-medium text-white">Paylaş</span>
      </button>
    </div>
  );
}
