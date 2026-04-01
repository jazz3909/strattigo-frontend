"use client";

interface ProgressBarProps {
  value: number; // 0-100
  variant?: "purple" | "blue" | "green" | "amber" | "gradient";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const variantStyles = {
  purple: "bg-violet-600",
  blue: "bg-blue-600",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  gradient: "gradient-brand",
};

const trackStyles = {
  purple: "bg-violet-100",
  blue: "bg-blue-100",
  green: "bg-emerald-100",
  amber: "bg-amber-100",
  gradient: "bg-violet-100",
};

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function ProgressBar({
  value,
  variant = "gradient",
  size = "md",
  showLabel = false,
  animated = true,
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="font-medium">{clampedValue}%</span>
        </div>
      )}
      <div className={`w-full rounded-full overflow-hidden ${trackStyles[variant]} ${sizeStyles[size]}`}>
        <div
          className={`h-full rounded-full ${variantStyles[variant]} ${animated ? "transition-all duration-700 ease-out" : ""}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
