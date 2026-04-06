"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, variant = "pill", className = "" }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (variant !== "underline") return;
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector(`[data-tab-id="${activeId}"]`) as HTMLElement;
    if (!activeBtn) return;
    setSliderStyle({
      left: activeBtn.offsetLeft,
      width: activeBtn.offsetWidth,
    });
  }, [activeId, tabs, variant]);

  if (variant === "underline") {
    return (
      <div
        ref={containerRef}
        className={`relative flex gap-0 overflow-x-auto ${className}`}
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer"
            style={{ color: activeId === tab.id ? "var(--accent)" : "var(--text-secondary)" }}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-semibold"
                style={
                  activeId === tab.id
                    ? { background: "var(--accent-dim)", color: "var(--accent)" }
                    : { background: "var(--surface-2)", color: "var(--text-secondary)" }
                }
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
        {/* Sliding underline indicator */}
        <div
          className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out"
          style={{ left: sliderStyle.left, width: sliderStyle.width, background: "var(--accent)" }}
        />
      </div>
    );
  }

  // Pill variant
  return (
    <div
      className={`flex gap-1 rounded-2xl p-1 overflow-x-auto ${className}`}
      style={{ background: "var(--surface-2)" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 cursor-pointer"
          style={
            activeId === tab.id
              ? { background: "var(--surface)", color: "var(--accent)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
              : { color: "var(--text-secondary)" }
          }
          onMouseEnter={(e) => {
            if (activeId !== tab.id) {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeId !== tab.id) {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
            }
          }}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className="inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-bold"
              style={
                activeId === tab.id
                  ? { background: "var(--accent-dim)", color: "var(--accent)" }
                  : { background: "var(--surface-3)", color: "var(--text-secondary)" }
              }
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
