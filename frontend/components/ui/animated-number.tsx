"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  decimals?: number;
}

export function AnimatedNumber({ 
  value, 
  className,
  decimals = 0 
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    damping: 15,
    stiffness: 100,
  });

  const display = useTransform(spring, (current) =>
    current.toFixed(decimals)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

