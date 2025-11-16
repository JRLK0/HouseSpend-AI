"use client";

import { cn } from "@/lib/utils/cn";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function ShineBorder({ 
  children, 
  className,
  color = "#3b82f6" 
}: ShineBorderProps) {
  return (
    <div
      className={cn(
        "relative inline-flex rounded-lg border border-gray-200 bg-white p-6",
        "before:absolute before:inset-0 before:rounded-lg before:p-[1px]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        "before:opacity-0 before:transition-opacity before:duration-500",
        "hover:before:opacity-100",
        className
      )}
      style={{
        background: `linear-gradient(${color}20, ${color}20) padding-box, linear-gradient(var(--angle), ${color}, transparent, ${color}) border-box`,
      }}
    >
      {children}
    </div>
  );
}

