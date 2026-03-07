"use client"

import { VoiceCommands } from "@/components/dashboard/voice-commands"
import { AliasSettings } from "@/components/dashboard/alias-settings"
import { CommentAutomation } from "@/components/dashboard/comment-automation"
import { CollaborationMarketplace } from "@/components/dashboard/collaboration-marketplace"
import { ContentLibrary } from "@/components/dashboard/content-library"
import { SchedulePost } from "@/components/dashboard/schedule-post"
import { CreatorDiscovery } from "@/components/dashboard/creator-discovery"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { AIActivityFeed } from "@/components/dashboard/ai-activity-feed"
import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopNavbar } from "@/components/dashboard/top-navbar"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { CreatePost } from "@/components/dashboard/create-post"
import { OrinChat } from "@/components/dashboard/orin-chat"
import { CaptionPreview } from "@/components/dashboard/caption-preview"
import { AnalyticsSection } from "@/components/dashboard/analytics-section"
import { SettingsSection } from "@/components/dashboard/settings-section"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [generatedCaption, setGeneratedCaption] = useState("")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />
      case "create":
        return (
    <CreatePost
      onGenerateCaption={setGeneratedCaption}
    /> )
      case "orin":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full max-w-full overflow-hidden">
            <div className="lg:col-span-3 w-full overflow-hidden">
              <OrinChat />
            </div>
            <div className="lg:col-span-2 w-full overflow-hidden">
              <CaptionPreview caption={generatedCaption} />
            </div>
          </div>
        )
      case "library":
        return <ContentLibrary />
      case "schedule":
        return <SchedulePost />
      case "creators":
        return <CreatorDiscovery />
      case "analytics":
        return <AnalyticsSection />
      case "voice":
        return <VoiceCommands />
      case "aliases":
        return <AliasSettings />
      case "automation":
        return <CommentAutomation />
      case "marketplace":
        return <CollaborationMarketplace />
      case "settings":
        return <SettingsSection />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-background relative">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_60%)]"></div>
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        <TopNavbar sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 p-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
        <CommandPalette onNavigate={setActiveSection} />
      </div>
    </div>
  )
}
