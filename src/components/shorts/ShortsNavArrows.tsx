"use client";

import { ChevronUp, ChevronDown, X } from "lucide-react";
import Link from "next/link";

interface ShortsNavArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ShortsNavArrows({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ShortsNavArrowsProps) {
  return (
    <>
      {/* Geri butonu (ana sayfa) */}
      <Link
        href="/"
        className="fixed left-4 top-4 z-30 hidden items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:flex h-10 w-10"
      >
        <X className="h-5 w-5" />
      </Link>

      {/* Desktop ok butonları */}
      <div className="fixed right-8 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
