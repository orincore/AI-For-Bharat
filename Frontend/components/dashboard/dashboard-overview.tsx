"use client"

import { useState, useEffect } from "react"
import { AISystemStatus } from "./ai-system-status"
import { AgentWorkflow } from "./agent-workflow"
import { AIRecommendation } from "./ai-recommendation"
import { AIInsights } from "./ai-insights"
import { AIActivityFeed } from "./ai-activity-feed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ArrowUpRight,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Brain,
  Zap,
  BarChart3,
  Loader2,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { api } from "@/lib/api"

const stats = [
  {
    title: "Total Posts",
    value: "1,284",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: FileText,
    description: "vs last month",
    gradient: "from-primary/20 to-neon-cyan/20",
    iconBg: "bg-primary/10",
    sparkline: [
      { v: 40 }, { v: 55 }, { v: 48 }, { v: 62 }, { v: 58 }, { v: 72 }, { v: 80 },
    ],
  },
  {
    title: "Engagement Rate",
    value: "4.6%",
    change: "+2.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "vs last month",
    gradient: "from-neon-cyan/20 to-primary/20",
    iconBg: "bg-neon-cyan/10",
    sparkline: [
      { v: 3.2 }, { v: 3.8 }, { v: 3.5 }, { v: 4.1 }, { v: 3.9 }, { v: 4.4 }, { v: 4.6 },
    ],
  },
  {
    title: "Scheduled Posts",
    value: "23",
    change: "5 today",
    changeType: "neutral" as const,
    icon: Clock,
    description: "pending publish",
    gradient: "from-chart-3/20 to-primary/20",
    iconBg: "bg-chart-3/10",
    sparkline: [
      { v: 15 }, { v: 18 }, { v: 12 }, { v: 20 }, { v: 25 }, { v: 22 }, { v: 23 },
    ],
  },
  {
    title: "AI Captions",
    value: "847",
    change: "+34.2%",
    changeType: "positive" as const,
    icon: Sparkles,
    description: "generated this month",
    gradient: "from-primary/20 to-chart-2/20",
    iconBg: "bg-primary/10",
    sparkline: [
      { v: 30 }, { v: 42 }, { v: 55 }, { v: 60 }, { v: 72 }, { v: 78 }, { v: 85 },
    ],
  },
]

const weeklyData = [
  { day: "Mon", engagement: 4200, reach: 18000 },
  { day: "Tue", engagement: 5800, reach: 22000 },
  { day: "Wed", engagement: 4900, reach: 19500 },
  { day: "Thu", engagement: 7200, reach: 28000 },
  { day: "Fri", engagement: 5100, reach: 21000 },
  { day: "Sat", engagement: 8400, reach: 32000 },
  { day: "Sun", engagement: 6800, reach: 26000 },
]

type RecentActivity = {
  action: string
  platform: string
  status: string
  time: string
  icon?: any
}

const recentActivity: RecentActivity[] = [
  { platform: "Instagram", icon: Instagram, action: "Reel posted", time: "2h ago", status: "Published" },
  { platform: "LinkedIn", icon: Linkedin, action: "Article scheduled", time: "4h ago", status: "Scheduled" },
  { platform: "X", icon: Twitter, action: "Thread drafted", time: "6h ago", status: "Draft" },
  { platform: "Instagram", icon: Instagram, action: "Story posted", time: "1d ago", status: "Published" },
]

const platformPerformance = [
  { platform: "Instagram", icon: Instagram, followers: "24.5K", growth: "+3.2%", posts: 156, color: "text-neon-instagram" },
  { platform: "LinkedIn", icon: Linkedin, followers: "12.8K", growth: "+5.1%", posts: 89, color: "text-neon-linkedin" },
  { platform: "X", icon: Twitter, followers: "18.2K", growth: "+1.8%", posts: 234, color: "text-neon-x" },
  { platform: "YouTube", icon: Youtube, followers: "32.4K", growth: "+6.3%", posts: 124, color: "text-red-500" },
]

const aiInsights = [
  {
    icon: Clock,
    label: "Best posting time",
    value: "Tue & Sat, 6 - 8 PM",
    detail: "Based on 30-day engagement data",
  },
  {
    icon: BarChart3,
    label: "Top performing platform",
    value: "Instagram Reels",
    detail: "3.2x higher engagement than static posts",
  },
  {
    icon: Zap,
    label: "Suggested content type",
    value: "Behind-the-scenes video",
    detail: "Trending in your niche this week",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

function Sparkline({ data }: { data: Array<{ v: number }> }) {
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.72 0.19 163)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="v"
            stroke="url(#sparkGrad)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-md">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {entry.dataKey === "engagement" ? "Engagement" : "Reach"}:{" "}
          <span className="font-medium text-primary">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

export function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadAiSummary();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error);
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAiSummary = async () => {
    setLoadingAiSummary(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/summarize-analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAiSummary(data.summary);
      }
    } catch (error: any) {
      console.error('Error loading AI summary:', error);
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const displayStats = dashboardData ? [
    {
      title: "Total Posts",
      value: dashboardData.totalPosts?.toString() || "0",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: FileText,
      description: "vs last month",
      gradient: "from-primary/20 to-neon-cyan/20",
      iconBg: "bg-primary/10",
      sparkline: [
        { v: 40 }, { v: 55 }, { v: 48 }, { v: 62 }, { v: 58 }, { v: 72 }, { v: 80 },
      ],
    },
    {
      title: "Engagement Rate",
      value: dashboardData.avgEngagementRate + "%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "vs last month",
      gradient: "from-neon-cyan/20 to-primary/20",
      iconBg: "bg-neon-cyan/10",
      sparkline: [
        { v: 3.2 }, { v: 3.8 }, { v: 3.5 }, { v: 4.1 }, { v: 3.9 }, { v: 4.4 }, { v: 4.6 },
      ],
    },
    {
      title: "Scheduled Posts",
      value: dashboardData.scheduledPosts?.toString() || "0",
      change: "5 today",
      changeType: "neutral" as const,
      icon: Clock,
      description: "pending publish",
      gradient: "from-chart-3/20 to-primary/20",
      iconBg: "bg-chart-3/10",
      sparkline: [
        { v: 15 }, { v: 18 }, { v: 12 }, { v: 20 }, { v: 25 }, { v: 22 }, { v: 23 },
      ],
    },
    {
      title: "AI Captions",
      value: "847",
      change: "+34.2%",
      changeType: "positive" as const,
      icon: Sparkles,
      description: "generated this month",
      gradient: "from-primary/20 to-chart-2/20",
      iconBg: "bg-primary/10",
      sparkline: [
        { v: 30 }, { v: 42 }, { v: 55 }, { v: 60 }, { v: 72 }, { v: 78 }, { v: 85 },
      ],
    },
  ] : stats;

  const displayWeeklyData = dashboardData?.weeklyData?.length > 0 ? dashboardData.weeklyData : weeklyData;
  const displayPlatformPerformanceRaw = dashboardData?.platformPerformance?.length > 0 ? dashboardData.platformPerformance : platformPerformance;
  const platformIconMap: Record<string, any> = {
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    twitter: Twitter,
    x: Twitter,
  };
  const displayPlatformPerformance = displayPlatformPerformanceRaw.map((platform: any) => ({
    ...platform,
    icon: platform.icon || platformIconMap[platform.platform?.toLowerCase()] || Instagram,
    color: platform.color || 'text-primary',
  }));
  const displayRecentActivity = dashboardData?.recentActivity?.length > 0 ? dashboardData.recentActivity : recentActivity;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData?.hasConnectedAccount) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <Instagram className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Instagram Account Connected</h3>
          <p className="text-muted-foreground mb-6">
            Connect your Instagram Business account to see real-time analytics and insights.
          </p>
          <Button onClick={() => window.location.href = '/dashboard?tab=settings'}>
            <Instagram className="h-4 w-4 mr-2" />
            Connect Instagram Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, John. Here{"'"}s what{"'"}s happening with your content.
        </p>
      </div>

      {/* Stat Cards with neon glow + sparklines */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {displayStats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="glow-card group relative border-border/60 bg-card transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl">
              <div
                className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}>
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {stat.changeType === "positive" ? (
                        <div className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5">
                          <ArrowUpRight className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">{stat.change}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">{stat.change}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{stat.description}</span>
                    </div>
                  </div>
                  <Sparkline data={stat.sparkline} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* AI-Powered Analytics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="glow-card relative overflow-hidden border-primary/25 bg-card transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.19 163 / 0.06), transparent 60%), radial-gradient(ellipse at 80% 50%, oklch(0.78 0.15 195 / 0.04), transparent 60%)",
            }}
          />
          <CardHeader className="relative flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
                <Brain className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">AI Analytics Summary</CardTitle>
                <p className="text-xs text-muted-foreground">Comprehensive insights from your connected accounts</p>
              </div>
            </div>
            <Button
              onClick={loadAiSummary}
              disabled={loadingAiSummary}
              size="sm"
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
            >
              {loadingAiSummary ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Refresh
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="relative">
            {loadingAiSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing your social media performance...</p>
                </div>
              </div>
            ) : aiSummary ? (
              <div className="prose prose-invert max-w-none">
                <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {aiSummary}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Click refresh to generate AI-powered insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glow-card relative overflow-hidden border-primary/25 bg-card transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.19 163 / 0.06), transparent 60%), radial-gradient(ellipse at 80% 50%, oklch(0.78 0.15 195 / 0.04), transparent 60%)",
            }}
          />
          <CardHeader className="relative flex flex-row items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
              <Zap className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Quick Insights</CardTitle>
              <p className="text-xs text-muted-foreground">Key recommendations from Orin</p>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid gap-3 sm:grid-cols-3">
              {aiInsights.map((insight, index) => (
                <motion.div
                  key={insight.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className="group/insight rounded-xl border border-border/40 bg-secondary/30 p-4 transition-all duration-200 hover:border-primary/25 hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <insight.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">{insight.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{insight.value}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{insight.detail}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Engagement Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Weekly Engagement
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Engagement and reach across all platforms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Engagement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-neon-cyan" />
                <span className="text-xs text-muted-foreground">Reach</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={displayWeeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="oklch(0.78 0.15 195)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.012 260)" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.60 0.01 260)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "oklch(0.60 0.01 260)" }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="oklch(0.78 0.15 195)"
                  strokeWidth={2}
                  fill="url(#reachGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="oklch(0.72 0.19 163)"
                  strokeWidth={2}
                  fill="url(#engagementGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity + Platform Performance */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {displayRecentActivity.map((activity: RecentActivity, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.06 }}
                    className="group flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 transition-all duration-200 hover:border-primary/20 hover:bg-secondary/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <Instagram className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          activity.status === "published"
                            ? "bg-primary/10 text-primary"
                            : activity.status === "scheduled"
                              ? "bg-chart-2/10 text-chart-2"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Performance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Platform Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {displayPlatformPerformance.map((platform: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + index * 0.06 }}
                    className="group flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 transition-all duration-200 hover:border-primary/20 hover:bg-secondary/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                        <platform.icon className={`h-4 w-4 ${platform.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{platform.platform}</p>
                        <p className="text-xs text-muted-foreground">{platform.followers} followers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <TrendingUp className="h-3 w-3 text-primary" />
                        <p className="text-sm font-semibold text-primary">{platform.growth}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{platform.posts} posts</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Recommendation, Insights and Activity Feed */}
      <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <AIRecommendation />
        <AIInsights />
        <AIActivityFeed />
      </div>
      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <AgentWorkflow />
        <AISystemStatus />
    </div>
    </div>
  )
}
