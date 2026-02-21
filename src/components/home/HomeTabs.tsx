"use client";

import { Flame, Clock, Eye, ThumbsUp } from "lucide-react";

export type TabKey = "trending" | "newest" | "most-viewed" | "top-rated";

interface HomeTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const tabs: { key: TabKey; label: string; icon: typeof Flame }[] = [
  { key: "trending", label: "Trend", icon: Flame },
  { key: "newest", label: "Yeni", icon: Clock },
  { key: "most-viewed", label: "En İzlenen", icon: Eye },
  { key: "top-rated", label: "En Beğenilen", icon: ThumbsUp },
];

export function HomeTabs({ activeTab, onTabChange }: HomeTabsProps) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
