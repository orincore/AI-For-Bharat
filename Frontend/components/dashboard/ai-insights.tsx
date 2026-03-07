'use client';

import { motion } from "framer-motion"
import React from 'react';
import { Clock, TrendingUp, Hash, Zap, Sparkles, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | React.ReactNode;
  subtitle?: string;
  color: string;
}

function InsightCard({ icon, title, value, subtitle, color }: InsightCardProps) {
  return (
    <div className="group relative p-4 rounded-lg border border-border bg-muted/30 transition-all duration-300 hover:border-primary/30 hover:bg-secondary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${color}`} />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-lg ${color} bg-opacity-20`}>
            {icon}
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>

        {/* Value */}
        <div className="mb-2">
          <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function AIInsights() {
  return (
    <div className="relative">
      {/* Main Container */}
      <div className="h-full min-h-[420px] flex flex-col rounded-2xl border border-border bg-card backdrop-blur-lg overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Insights</h2>
              <p className="text-sm text-muted-foreground">Powered by advanced analytics</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Best Time to Post */}
            <InsightCard
              icon={<Clock className="w-5 h-5 text-blue-400" />}
              title="Best Time to Post"
              value="2:00 PM - 4:00 PM"
              subtitle="Tuesday to Thursday • Peak engagement window"
              color="bg-blue-500"
            />

            {/* Top Performing Platform */}
            <InsightCard
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              title="Top Performing Platform"
              value={
                <div className="flex items-baseline gap-2">
                  <span>Instagram</span>
                  <span className="text-sm font-normal text-green-400 flex items-center gap-1">
                    <ArrowUpRight className="w-4 h-4" />
                    +24%
                  </span>
                </div>
              }
              subtitle="Highest engagement and reach"
              color="bg-green-500"
            />

            {/* Suggested Hashtags */}
            <InsightCard
              icon={<Hash className="w-5 h-5 text-pink-400" />}
              title="Suggested Hashtags"
              value={
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block px-2.5 py-1 rounded bg-pink-500/20 text-pink-300 text-xs font-medium">
                    #CreatorLife
                  </span>
                  <span className="inline-block px-2.5 py-1 rounded bg-pink-500/20 text-pink-300 text-xs font-medium">
                    #ContentCreator
                  </span>
                  <span className="inline-block px-2.5 py-1 rounded bg-pink-500/20 text-pink-300 text-xs font-medium">
                    #SocialMedia
                  </span>
                </div>
              }
              subtitle="High volume, trending topics"
              color="bg-pink-500"
            />

            {/* Predicted Engagement Score */}
            <InsightCard
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              title="Predicted Engagement Score"
              value={
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-3xl font-bold text-amber-400">8.7</span>
                    <span className="text-slate-400">/10</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
  <motion.div
    initial={{ width: 0 }}
    animate={{ width: "87%" }}
    transition={{ duration: 1.2, ease: "easeOut" }}
    className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
  />
</div>
                    </div>
                  </div>
                </div>
              }
              subtitle="Based on your content patterns"
              color="bg-amber-500"
            />
          </div>

          {/* YouTube-Specific Insights */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="p-1.5 rounded bg-red-500/20">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
              </div>
              YouTube Platform Insights
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <span className="text-sm text-muted-foreground">Best time to post YouTube videos</span>
                <span className="text-sm font-semibold text-red-400">3:00 PM - 5:00 PM</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <span className="text-sm text-muted-foreground">Recommended video length</span>
                <span className="text-sm font-semibold text-red-400">8-12 minutes</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <span className="text-sm text-muted-foreground">Trending YouTube tags</span>
                <div className="flex gap-1">
                  <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded">#Tutorial</span>
                  <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded">#HowTo</span>
                  <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded">#Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Summary */}
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Analysis Summary
            </h3>

            <div className="space-y-3">
              {/* Stat Item 1 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 shadow-sm transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg hover:-translate-y-1">
                <span className="text-sm text-muted-foreground">Average post lifespan</span>
                <span className="text-sm font-semibold text-foreground">72 hours</span>
              </div>

              {/* Stat Item 2 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 shadow-sm transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg hover:-translate-y-1">
                <span className="text-sm text-muted-foreground">Optimal caption length</span>
                <span className="text-sm font-semibold text-foreground">120-200 characters</span>
              </div>

              {/* Stat Item 3 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 shadow-sm transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg hover:-translate-y-1">
                <span className="text-sm text-muted-foreground">Recommended post frequency</span>
                <span className="text-sm font-semibold text-foreground">3-5 posts per week</span>
              </div>

              {/* Stat Item 4 */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 shadow-sm transition-all duration-300 hover:bg-secondary/50 hover:shadow-lg hover:-translate-y-1">
                <span className="text-sm text-muted-foreground">Audience peak activity</span>
                <span className="text-sm font-semibold text-foreground">Evenings (6-10 PM)</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30 shadow-sm">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">💡 Pro Tip:</span> Follow these AI recommendations to maximize your reach and engagement. Update your strategy weekly for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}