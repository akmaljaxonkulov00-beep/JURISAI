import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, size = 'md', showValue = false, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const getSizeClasses = (size: string) => {
      switch (size) {
        case 'sm':
          return 'h-1';
        case 'lg':
          return 'h-4';
        default:
          return 'h-2';
      }
    };
    
    const getVariantClasses = (variant: string) => {
      switch (variant) {
        case 'success':
          return 'bg-green-500';
        case 'warning':
          return 'bg-yellow-500';
        case 'error':
          return 'bg-red-500';
        default:
          return 'bg-primary';
      }
    };

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        <div className="relative">
          <div
            className={cn(
              'w-full bg-secondary rounded-full overflow-hidden',
              getSizeClasses(size)
            )}
          >
            <div
              className={cn(
                'h-full transition-all duration-300 ease-out',
                getVariantClasses(variant)
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-background mix-blend-difference">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, type ProgressProps };
