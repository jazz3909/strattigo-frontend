"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "rect" | "circle";
  lines?: number;
}

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  const base = "animate-shimmer rounded";
  const variantClass =
    variant === "circle" ? "rounded-full" : variant === "text" ? "rounded h-4" : "rounded-xl";

  return <div className={`${base} ${variantClass} ${className}`} />;
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={`h-4 ${i === lines - 1 ? "w-3/5" : i % 2 === 0 ? "w-full" : "w-5/6"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStudyGuide() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <SkeletonText lines={4} />
        </div>
      ))}
    </div>
  );
}
