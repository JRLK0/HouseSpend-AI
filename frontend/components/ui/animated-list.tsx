"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Children, isValidElement } from "react";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function AnimatedList({ 
  children, 
  className,
  staggerDelay = 0.1 
}: AnimatedListProps) {
  const childrenArray = Children.toArray(children);
  
  return (
    <div className={cn("space-y-3", className)}>
      {childrenArray.map((child, index) => {
        if (isValidElement(child)) {
          return (
            <motion.div
              key={child.key || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: index * staggerDelay 
              }}
            >
              {child}
            </motion.div>
          );
        }
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * staggerDelay 
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}

