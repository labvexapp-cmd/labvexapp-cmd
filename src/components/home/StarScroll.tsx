"use client";

import Link from "next/link";
import { formatViewCount } from "@/lib/constants";
import type { Star } from "@/types";

interface StarScrollProps {
  stars: Star[];
}

export function StarScroll({ stars }: StarScrollProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground md:text-xl">
          Popüler Starlar
        </h2>
        <Link
          href="/starlar"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Tümü
        </Link>
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {stars.map((star) => (
          <Link
            key={star.id}
            href={`/star/${star.slug}`}
            className="group flex flex-shrink-0 flex-col items-center gap-2"
          >
            {/* Avatar placeholder */}
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-secondary transition-all group-hover:border-primary group-hover:glow-cyan md:h-20 md:w-20">
              <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">
                {star.name.charAt(0)}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors md:text-sm">
                {star.name}
              </p>
              <p className="text-[10px] text-muted-foreground md:text-xs">
                {star.video_count} video &middot;{" "}
                {formatViewCount(star.view_count)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
