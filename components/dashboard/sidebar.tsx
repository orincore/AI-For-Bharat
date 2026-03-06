"use client"

import { Folder, Calendar, Users, Mic, AtSign, MessageCircle as MessageCircleIcon, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PenSquare,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: PenSquare, label: "Create Post", id: "create" },
  { icon: Bot, label: "Orin AI", id: "orin" },
  { icon: Mic, label: "Voice Commands", id: "voice" },
  { icon: AtSign, label: "Aliases", id: "aliases" },
  { icon: MessageCircleIcon, label: "Automation", id: "automation" },
  { icon: Briefcase, label: "Marketplace", id: "marketplace" },

  { icon: Folder, label: "Content Library", id: "library" },
  { icon: Calendar, label: "Schedule", id: "schedule" },
  { icon: Users, label: "Creators", id: "creators" },

  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Settings, label: "Settings", id: "settings" },
]

interface SidebarProps {
  activeSection: string
  onNavigate: (section: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  activeSection,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
            <Zap className="h-4.5 w-4.5 text-primary" />
            <div className="absolute inset-0 rounded-xl bg-primary/10 blur-md" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <span className="whitespace-nowrap text-base font-bold tracking-tight text-sidebar-foreground">
                  Social
                  <span className="text-primary">OS</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  {/* Active neon indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                      style={{
                        boxShadow: "0 0 8px var(--neon-primary), 0 0 16px var(--neon-primary)",
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  {/* Neon glow on hover */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      isActive && "opacity-100"
                    )}
                    style={{
                      background: isActive
                        ? "radial-gradient(ellipse at left, oklch(0.72 0.19 163 / 0.06), transparent 70%)"
                        : "radial-gradient(ellipse at left, oklch(0.72 0.19 163 / 0.03), transparent 70%)",
                    }}
                  />

                  <item.icon
                    className={cn(
                      "relative h-[18px] w-[18px] shrink-0 transition-all duration-200",
                      isActive && "drop-shadow-[0_0_6px_var(--neon-primary)]"
                    )}
                  />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="relative whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Upgrade badge + collapse */}
      <div className="border-t border-sidebar-border p-2">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary">Pro Plan</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Unlimited AI captions and scheduling
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/10">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-neon-cyan" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-xl p-2 text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
