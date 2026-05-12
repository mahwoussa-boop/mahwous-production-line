'use client';

// ============================================================
// components/Skeleton.tsx
// مكوّن Skeleton فاخر بتدرّج ذهبي خفيف، يتماشى مع الثيم.
// Additive: مكوّن مستقل، يُستورد عند الحاجة.
// ============================================================

import { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  style?: CSSProperties;
}

const ROUND: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

export default function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = 'md',
  style,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`mahwous-skeleton ${ROUND[rounded]} ${className}`}
      style={{ width, height, ...style }}
    >
      <style jsx>{`
        .mahwous-skeleton {
          background: linear-gradient(
            90deg,
            rgba(212, 175, 55, 0.06) 0%,
            rgba(212, 175, 55, 0.18) 50%,
            rgba(212, 175, 55, 0.06) 100%
          );
          background-size: 200% 100%;
          animation: mahwous-shimmer 1.6s ease-in-out infinite;
        }
        @keyframes mahwous-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonGroup({ count = 3, height = '1rem', gap = '0.5rem' }: {
  count?: number; height?: string; gap?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} width={`${100 - i * 12}%`} />
      ))}
    </div>
  );
}
