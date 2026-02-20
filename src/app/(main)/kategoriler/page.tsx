import Link from "next/link";
import { Grid3X3 } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { formatViewCount } from "@/lib/constants";

export const revalidate = 60;

export default async function KategorilerPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Grid3X3 className="h-6 w-6" />
          <h1 className="text-xl font-bold md:text-2xl">Kategoriler</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tüm kategorileri keşfedin. İlginizi çeken konulara göz atın.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/kategori/${category.slug}`}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-secondary/50"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Icon placeholder */}
            <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <span className="text-lg font-bold">
                {category.name.charAt(0)}
              </span>
            </div>

            {/* Category info */}
            <div className="relative">
              <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                {category.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatViewCount(category.video_count)} video
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
