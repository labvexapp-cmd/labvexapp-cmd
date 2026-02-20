import Link from "next/link";
import { Star, Eye } from "lucide-react";
import { mockStars } from "@/lib/mock-data";
import { formatViewCount } from "@/lib/constants";

export default function StarlarPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Star className="h-6 w-6" />
          <h1 className="text-xl font-bold md:text-2xl">Starlar</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          En popüler starları keşfedin.
        </p>
      </div>

      {/* Star grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {mockStars.map((star) => (
          <Link
            key={star.id}
            href={`/star/${star.slug}`}
            className="group flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/50 hover:bg-secondary/50"
          >
            {/* Avatar */}
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-2xl font-bold text-primary transition-transform group-hover:scale-105">
              {star.name.charAt(0)}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
              {star.name}
            </h3>

            {/* Stats */}
            <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
              <span>{star.video_count} video</span>
              <span className="flex items-center justify-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViewCount(star.view_count)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
