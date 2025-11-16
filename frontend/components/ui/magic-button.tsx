"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface MagicButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
}

export function MagicButton({ 
  children, 
  className,
  onClick,
  variant = "default"
}: MagicButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 overflow-hidden shadow-md";
  
  const variants = {
    default: "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white hover:shadow-lg hover:shadow-purple-500/50",
    outline: "border-2 border-blue-600/50 text-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 hover:text-white hover:border-transparent hover:shadow-md",
    ghost: "text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text hover:bg-blue-50",
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {variant === "default" && (
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 hover:opacity-30 transition-opacity blur-sm"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

