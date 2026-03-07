'use client';

import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Hash,
  Clock,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ActivityType =
  | 'caption-generated'
  | 'hashtags-optimized'
  | 'posting-time-suggested'
  | 'engagement-analyzed'
  | 'content-improved'
  | 'trend-detected';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  status: 'success' | 'pending' | 'warning';
  color: string;
}

const activityColors: Record<ActivityType, { bg: string; text: string; border: string }> = {
  'caption-generated': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  'hashtags-optimized': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  'posting-time-suggested': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  'engagement-analyzed': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  'content-improved': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  'trend-detected': {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
};

// Sample activity data
const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'caption-generated',
    title: 'Caption Generated',
    description: 'AI generated a compelling caption for your travel photo with 15 hashtag suggestions',
    timestamp: 'Just now',
    icon: <MessageSquare className="w-5 h-5" />,
    status: 'success',
    color: 'blue',
  },
  {
    id: '2',
    type: 'hashtags-optimized',
    title: 'Hashtags Optimized',
    description: 'Optimized your hashtag strategy based on trending topics and audience insights',
    timestamp: '5 minutes ago',
    icon: <Hash className="w-5 h-5" />,
    status: 'success',
    color: 'pink',
  },
  {
    id: '3',
    type: 'posting-time-suggested',
    title: 'Best Posting Time',
    description: 'Analyzed your audience activity. Recommended posting at 2:30 PM for maximum reach',
    timestamp: '12 minutes ago',
    icon: <Clock className="w-5 h-5" />,
    status: 'success',
    color: 'purple',
  },
  {
    id: '4',
    type: 'engagement-analyzed',
    title: 'Engagement Analyzed',
    description: 'Processed 1,234 engagements from your last 10 posts. Found 3 key trends',
    timestamp: '32 minutes ago',
    icon: <TrendingUp className="w-5 h-5" />,
    status: 'success',
    color: 'green',
  },
  {
    id: '5',
    type: 'content-improved',
    title: 'Content Quality Improved',
    description: 'Suggested refinements to your caption wording. Expected engagement boost: +18%',
    timestamp: '1 hour ago',
    icon: <Zap className="w-5 h-5" />,
    status: 'success',
    color: 'amber',
  },
  {
    id: '6',
    type: 'trend-detected',
    title: 'Trending Topic Detected',
    description: 'Recently trending in your niche: #TechInnovation. Recommended to include in posts',
    timestamp: '2 hours ago',
    icon: <AlertCircle className="w-5 h-5" />,
    status: 'warning',
    color: 'red',
  },
];

function ActivityItemComponent({ activity, isLast }: { activity: ActivityItem; isLast: boolean }) {
  const colors = activityColors[activity.type];
  const statusIcon =
    activity.status === 'success' ? (
      <CheckCircle2 className="w-4 h-4 text-primary" />
    ) : (
      <AlertCircle className="w-4 h-4 text-primary" />
    );

  return (
    <div className="relative">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-12 bg-gradient-to-b from-border to-border/50" />
      )}

      {/* Activity Item */}
      <div className="flex gap-4 items-start">
        {/* Timeline Dot */}
        <div className="relative flex flex-col items-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${colors.bg} ${colors.border}`}
          >
            <div className={colors.text}>{activity.icon}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-6 pt-2">
          <div className="group rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-secondary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{activity.title}</h4>
                  {statusIcon}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground/60">{activity.timestamp}</span>
              <Badge
                variant="outline"
                className={`text-xs ${colors.bg} ${colors.text} border-border`}
              >
                {activity.type.replace('-', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIActivityFeed() {
  return (
    <div className="h-full min-h-[420px] flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card backdrop-blur-lg p-6">
      {/* Header section */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-400" />
        <h3 className="font-semibold text-lg text-foreground">AI Activity Feed</h3>
      </div>

      {/* Main content (timeline + link) */}
      <div className="flex-1">
        <div className="space-y-0">
          {sampleActivities.slice(0, 3).map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === 2} /* only first three shown */
            />
          ))}
        </div>
        <div className="mt-4 text-sm text-primary cursor-pointer hover:underline">
          View all activities →
        </div>
      </div>

      {/* Footer / action area */}
      <div className="mt-4 pt-6 border-t border-border/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            AI continuously monitors and optimizes your content performance
          </p>
          <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            View all activities →
          </button>
        </div>
      </div>
    </div>
  );
}