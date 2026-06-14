import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ProgressChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  showLabels?: boolean;
  className?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  data,
  maxValue = 100,
  showLabels = true,
  className
}) => {
  const getBarColor = (color?: string) => {
    switch (color) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  };

  const getBadgeColor = (value: number) => {
    if (value >= 80) return 'success';
    if (value >= 60) return 'default';
    if (value >= 40) return 'warning';
    return 'destructive';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center space-x-2">
                  {showLabels && (
                    <span className="text-sm text-gray-600">
                      {item.value}/{maxValue}
                    </span>
                  )}
                  <Badge variant={getBadgeColor(item.value)}>
                    {Math.round((item.value / maxValue) * 100)}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    getBarColor(item.color)
                  )}
                  style={{ width: `${Math.min((item.value / maxValue) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { ProgressChart };
