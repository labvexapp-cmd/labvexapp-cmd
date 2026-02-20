"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Play, Star, User } from "lucide-react";

const items = [
  { label: "Ana Sayfa", href: "/", icon: Home },
  { label: "Kategoriler", href: "/kategoriler", icon: Grid3X3 },
  { label: "Shorts", href: "/shorts", icon: Play },
  { label: "Starlar", href: "/starlar", icon: Star },
  { label: "Profil", href: "/profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-strong fixed bottom-0 left-0 right-0 z-50 border-t border-border md:hidden">
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {item.href === "/shorts" ? (
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              ) : (
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
