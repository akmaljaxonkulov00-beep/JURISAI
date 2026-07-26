'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  stiffness?: number;
  damping?: number;
  className?: string;
  compact?: boolean;
}

/**
 * AnimatedCounter — Smoothly animates from 0 to target value using
 * Framer Motion spring physics. Perfect for live stats dashboards.
 *
 * Usage:
 * ```tsx
 * <AnimatedCounter value={stats.total_users} suffix="+" />
 * ```
 */
export default function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  stiffness = 80,
  damping = 18,
  className = '',
  compact = false,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);

  const springValue = useSpring(motionValue, { stiffness, damping });

  const displayValue = useTransform(springValue, (latest) => {
    const rounded = Math.round(latest);
    const formatted = compact ? formatCompact(rounded) : rounded.toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span className={className}>{displayValue}</motion.span>;
}

function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}
