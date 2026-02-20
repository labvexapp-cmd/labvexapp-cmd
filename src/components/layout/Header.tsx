"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "@/lib/constants";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="glass-strong sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:h-16">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-border bg-card p-0">
            <div className="flex h-14 items-center border-b border-border px-4">
              <Logo />
            </div>
            <nav className="flex flex-col p-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <Button className="w-full" variant="default">
                <User className="mr-2 h-4 w-4" />
                Giriş Yap
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Logo className="mr-2" />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search - Desktop */}
        <div className="hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Video ara..."
              className="h-9 border-border bg-secondary/50 pl-9 text-sm placeholder:text-muted-foreground focus:bg-secondary"
            />
          </div>
        </div>

        {/* Search - Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          {searchOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </Button>

        {/* Trending button - Desktop */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-amber-accent md:flex"
        >
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Trend</span>
        </Button>

        {/* User button */}
        <Button variant="default" size="sm" className="hidden md:flex">
          <User className="mr-1.5 h-4 w-4" />
          Giriş Yap
        </Button>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="border-t border-border px-4 py-2 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Video ara..."
              className="h-9 bg-secondary/50 pl-9 text-sm"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
