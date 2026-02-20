import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-primary-foreground"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-gradient-cyan">Lab</span>
        <span className="text-foreground">Vex</span>
      </span>
    </Link>
  );
}
