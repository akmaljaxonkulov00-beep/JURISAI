import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Avatar, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'irac_analysis' | 'document_generated' | 'scenario_created' | 'weakness_detected';
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  details?: string;
  timestamp: Date;
  metadata?: {
    score?: number;
    document_type?: string;
    scenario_type?: string;
    weakness_count?: number;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 10,
  className
}) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'irac_analysis':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'document_generated':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'scenario_created':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'weakness_detected':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActivityTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'irac_analysis': return 'IRAC tahlili';
      case 'document_generated': return 'Hujjat yaratildi';
      case 'scenario_created': return 'Senariy yaratildi';
      case 'weakness_detected': return 'Kamchilik aniqlandi';
      default: return type;
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'hozirgina';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} daqiqa oldin`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} soat oldin`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} kun oldin`;
    return `${Math.floor(diffInSeconds / 2592000)} oy oldin`;
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">So'nggi faoliyat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.length > 0 ? (
            displayActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user.name}
                    </p>
                    <span className="text-xs text-gray-500">
                      {getRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.action}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.details}
                    </p>
                  )}
                  {activity.metadata && (
                    <div className="flex items-center space-x-2 mt-2">
                      {activity.metadata.score && (
                        <Badge variant="outline" className="text-xs">
                          Ball: {activity.metadata.score}
                        </Badge>
                      )}
                      {activity.metadata.document_type && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.document_type}
                        </Badge>
                      )}
                      {activity.metadata.scenario_type && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.scenario_type}
                        </Badge>
                      )}
                      {activity.metadata.weakness_count && (
                        <Badge variant="warning" className="text-xs">
                          {activity.metadata.weakness_count} kamchilik
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Avatar
                    src={activity.user.avatar}
                    fallback={activity.user.name}
                    size="sm"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Hali faoliyat yo'q</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { ActivityFeed };
