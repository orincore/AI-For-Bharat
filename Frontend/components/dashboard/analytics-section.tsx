"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  ArrowUpRight,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
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
  PieChart,
  Pie,
  Cell,
} from "recharts"

const defaultMetrics = [
  { label: "Total Reach", value: "0", change: "+0%", icon: Eye },
  { label: "New Followers", value: "0", change: "+0%", icon: Users },
  { label: "Avg. Engagement", value: "0%", change: "+0%", icon: TrendingUp },
  { label: "Posts Published", value: "0", change: "+0", icon: BarChart3 },
]

const defaultWeeklyData = [
  { day: "Mon", engagement: 0, reach: 0, followers: 0 },
  { day: "Tue", engagement: 0, reach: 0, followers: 0 },
  { day: "Wed", engagement: 0, reach: 0, followers: 0 },
  { day: "Thu", engagement: 0, reach: 0, followers: 0 },
  { day: "Fri", engagement: 0, reach: 0, followers: 0 },
  { day: "Sat", engagement: 0, reach: 0, followers: 0 },
  { day: "Sun", engagement: 0, reach: 0, followers: 0 },
]

const defaultPlatformDistribution = [
  { name: "Instagram", value: 100, color: "oklch(0.65 0.24 350)", icon: Instagram },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-md">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {entry.dataKey.charAt(0).toUpperCase() + entry.dataKey.slice(1)}:{" "}
          <span className="font-medium text-primary">{entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

export function AnalyticsSection() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (data.success && data.data.hasConnectedAccount) {
        setAnalyticsData(data.data)
      }
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const metrics = analyticsData ? [
    { label: "Total Reach", value: analyticsData.totalReach?.toLocaleString() || "0", change: "+0%", icon: Eye },
    { label: "Followers", value: analyticsData.followersCount?.toLocaleString() || "0", change: "+0%", icon: Users },
    { label: "Avg. Engagement", value: analyticsData.avgEngagementRate + "%", change: "+0%", icon: TrendingUp },
    { label: "Posts Published", value: analyticsData.totalPosts?.toString() || "0", change: "+0", icon: BarChart3 },
  ] : defaultMetrics

  const weeklyData = analyticsData?.weeklyData?.length > 0 ? analyticsData.weeklyData : defaultWeeklyData
  const platformDistribution = defaultPlatformDistribution

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your content performance across all platforms.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <Card className="glow-card group border-border/60 bg-card transition-all duration-300 hover:border-primary/30">
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <metric.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {metric.value}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5">
                    <ArrowUpRight className="h-3 w-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">{metric.change}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">this month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Engagement line chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Weekly Engagement
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Engagement and reach over the past week
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
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="analyticsEngGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.72 0.19 163)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analyticsReachGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.15 195)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="oklch(0.78 0.15 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.012 260)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "oklch(0.60 0.01 260)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.60 0.01 260)" }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="reach" stroke="oklch(0.78 0.15 195)" strokeWidth={2} fill="url(#analyticsReachGrad)" />
                  <Area type="monotone" dataKey="engagement" stroke="oklch(0.72 0.19 163)" strokeWidth={2} fill="url(#analyticsEngGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-border/60 bg-card h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Platform Distribution
              </CardTitle>
              <p className="text-xs text-muted-foreground">Content split by platform</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {platformDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {platformDistribution.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <p.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{p.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
