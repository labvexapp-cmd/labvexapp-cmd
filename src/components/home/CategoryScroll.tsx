"use client";

import Link from "next/link";
import type { Category } from "@/types";

interface CategoryScrollProps {
  categories: Category[];
}

export function CategoryScroll({ categories }: CategoryScrollProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground md:text-xl">
          Kategoriler
        </h2>
        <Link
          href="/kategoriler"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Tümü
        </Link>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/kategori/${cat.slug}`}
            className="flex-shrink-0 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            {cat.name}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {cat.video_count > 1000
                ? `${(cat.video_count / 1000).toFixed(1)}K`
                : cat.video_count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
