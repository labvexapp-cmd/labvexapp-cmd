import { VideoCard } from "./VideoCard";
import type { Video } from "@/types";

interface VideoGridProps {
  videos: Video[];
  title?: string;
  columns?: 2 | 3 | 4 | 5;
}

export function VideoGrid({ videos, title, columns = 4 }: VideoGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  return (
    <section>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground md:text-xl">
            {title}
          </h2>
          <a
            href="#"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Tümünü Gör
          </a>
        </div>
      )}
      <div className={`grid gap-3 md:gap-4 ${gridCols[columns]}`}>
        {videos.map((video, i) => (
          <VideoCard key={video.id} video={video} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}
