"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  User,
  Bell,
  Palette,
  Globe,
  Shield,
  Sun,
  Moon,
  Instagram,
  Linkedin,
  Twitter,
  Check,
  X,
  Youtube,
  RefreshCw,
  Loader2,
  MonitorPlay,
  PlugZap,
} from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { InstagramAccounts } from "./instagram-accounts"
import { toast } from "@/hooks/use-toast"

const profileItems = [
  { label: "Display Name", value: "John Doe" },
  { label: "Email", value: "john@example.com" },
  { label: "Bio", value: "Content creator & travel enthusiast" },
]

const notificationItems = [
  { id: "published", label: "Post Published", defaultOn: true },
  { id: "followers", label: "New Followers", defaultOn: true },
  { id: "report", label: "Weekly Report", defaultOn: true },
]

const connectedPlatforms = [
  { label: "Instagram", icon: Instagram, connected: true, color: "text-neon-instagram" },
  { label: "LinkedIn", icon: Linkedin, connected: true, color: "text-neon-linkedin" },
  { label: "X", icon: Twitter, connected: false, color: "text-neon-x" },
]

function ToggleSwitch({
  defaultChecked = false,
}: {
  defaultChecked?: boolean
}) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn(
        "relative h-6 w-10 rounded-full transition-colors duration-200",
        on ? "bg-primary" : "bg-secondary"
      )}
      aria-label="Toggle"
    >
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-foreground shadow-sm"
        style={{ backgroundColor: on ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
      />
    </button>
  )
}

interface YouTubeChannel {
  channelId: string
  title: string
  thumbnail?: string
  subscribers?: string
}

function YouTubeConnectionCard() {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null)
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetchChannel()

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [window.location.origin]
      const backendOrigin = process.env.NEXT_PUBLIC_API_URL
      if (backendOrigin) {
        try {
          allowedOrigins.push(new URL(backendOrigin).origin)
        } catch (e) {}
      }

      if (!allowedOrigins.includes(event.origin)) return

      if (event.data?.type === 'YOUTUBE_CONNECTED') {
        const channelData = event.data.channel
        if (channelData) {
          toast({
            title: 'YouTube Connected',
            description: `${channelData.title} connected successfully.`,
          })
          setChannel({
            channelId: channelData.channelId,
            title: channelData.title,
            thumbnail: channelData.thumbnail,
            subscribers: channelData.subscribers,
          })
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const fetchChannel = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      if (!token) return
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube/channel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data?.success && data?.data) {
        setChannel(data.data)
      }
    } catch (error) {
      console.warn('Unable to load YouTube channel', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube/connect`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (!data.success || !data.data?.authUrl) {
        throw new Error(data.error || 'Failed to start YouTube connection')
      }

      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      window.open(
        data.data.authUrl,
        'YouTube OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      )
    } catch (error: any) {
      toast({
        title: 'Unable to connect YouTube',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      const token = localStorage.getItem('auth_token')
      if (!token) return
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube/channel`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to disconnect')
      toast({
        title: 'YouTube disconnected',
        description: 'Your channel was disconnected successfully.',
      })
      setChannel(null)
    } catch (error: any) {
      toast({
        title: 'Unable to disconnect',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Youtube className="h-4 w-4 text-red-500" />
        </div>
        <CardTitle className="text-base font-semibold text-foreground">YouTube Channel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading channel details...
          </div>
        ) : channel ? (
          <div className="rounded-xl border border-border/40 bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                {channel.thumbnail ? (
                  <img src={channel.thumbnail} alt={channel.title} className="h-full w-full object-cover" />
                ) : (
                  <MonitorPlay className="m-2 h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{channel.title}</p>
                {channel.subscribers && (
                  <p className="text-xs text-muted-foreground">{channel.subscribers} subscribers</p>
                )}
                <p className="text-xs text-muted-foreground">Channel ID: {channel.channelId}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={fetchChannel}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/40 bg-secondary/30 p-4 text-sm text-muted-foreground">
            <p className="mb-3 font-medium text-foreground">No YouTube channel connected</p>
            <p>
              Connect your YouTube channel to schedule uploads, track performance, and post directly from Orin.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={handleConnect} className="gap-2">
                <PlugZap className="h-4 w-4" /> Connect YouTube
              </Button>
              <Button variant="outline" size="sm" onClick={fetchChannel}>
                <RefreshCw className="h-4 w-4" /> Refresh status
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              You will be redirected to Google to authorize access. Make sure pop-ups are allowed for this site.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SettingsSection() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, notifications, and connected platforms.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {profileItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {notificationItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <ToggleSwitch defaultChecked={item.defaultOn} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appearance / Theme */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {/* Theme toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        theme === "light"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      Light
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                        theme === "dark"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      Dark
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <span className="text-sm font-medium text-foreground">English</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Connected Platforms */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {connectedPlatforms.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <p.icon className={cn("h-4 w-4", p.color)} />
                      <span className="text-sm text-muted-foreground">{p.label}</span>
                    </div>
                    {p.connected ? (
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                        <Check className="h-3 w-3 text-primary" />
                        <span className="text-[11px] font-medium text-primary">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5">
                        <X className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium text-muted-foreground">Not connected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Instagram Accounts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <InstagramAccounts />
      </motion.div>

      {/* YouTube Connection */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <YouTubeConnectionCard />
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card className="border-destructive/20 bg-card">
          <CardHeader className="flex flex-row items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-4 w-4 text-destructive" />
            </div>
            <CardTitle className="text-base font-semibold text-foreground">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove your account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
