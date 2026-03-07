"use client"

import { useEffect, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Sparkles,
  Calendar,
  BarChart3,
  Users,
  PenSquare,
  LayoutDashboard,
  Bot,
  Settings,
  FileText,
  Hash,
} from "lucide-react"

interface CommandPaletteProps {
  onNavigate: (section: string) => void
}

const aiCommands = [
  {
    icon: Sparkles,
    label: "Generate captions",
    description: "Ask Orin to generate platform-optimized captions",
    action: "orin",
  },
  {
    icon: Calendar,
    label: "Schedule post",
    description: "Schedule content for optimal posting times",
    action: "create",
  },
  {
    icon: BarChart3,
    label: "Analyze engagement",
    description: "View detailed engagement analytics",
    action: "analytics",
  },
  {
    icon: Users,
    label: "Find collaborators",
    description: "Discover creators in your niche",
    action: "orin",
  },
  {
    icon: Hash,
    label: "Optimize hashtags",
    description: "Get AI-powered hashtag recommendations",
    action: "orin",
  },
  {
    icon: FileText,
    label: "Draft a thread",
    description: "Create a multi-post thread with Orin",
    action: "orin",
  },
]

const navCommands = [
  { icon: LayoutDashboard, label: "Go to Dashboard", action: "dashboard" },
  { icon: PenSquare, label: "Go to Create Post", action: "create" },
  { icon: Bot, label: "Go to Orin AI", action: "orin" },
  { icon: BarChart3, label: "Go to Analytics", action: "analytics" },
  { icon: Settings, label: "Go to Settings", action: "settings" },
]

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (action: string) => {
    setOpen(false)
    onNavigate(action)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Ask Orin or search commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="AI Commands">
          {aiCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={() => handleSelect(cmd.action)}
              className="gap-3 px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <cmd.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{cmd.label}</span>
                <span className="text-xs text-muted-foreground">{cmd.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          {navCommands.map((cmd) => (
            <CommandItem
              key={cmd.label}
              onSelect={() => handleSelect(cmd.action)}
              className="gap-3 px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <cmd.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
