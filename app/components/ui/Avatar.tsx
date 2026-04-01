"use client";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const gradients = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-violet-600",
  "from-indigo-500 to-blue-600",
];

function stringToGradient(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

const sizeMap = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-14 h-14 text-lg",
};

export function Avatar({ name, size = "md", className = "" }: AvatarProps) {
  const initials = name
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const gradient = stringToGradient(name);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex-shrink-0 select-none ${sizeMap[size]} ${className}`}
      aria-label={name}
    >
      {initials || "?"}
    </span>
  );
}
