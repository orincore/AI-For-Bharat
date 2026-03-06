"use client"

interface CaptionPreviewProps {
  caption: string
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Copy,
  Check,
  Send,
  RefreshCw,
  Instagram,
  Linkedin,
  Twitter,
  Sparkles,
  Pencil,
  X,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { cn } from "@/lib/utils"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

export function CaptionPreview({ caption }: CaptionPreviewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedCaptions, setEditedCaptions] = useState<Record<string, string>>({})

  const captions = [
    {
      platform: "Instagram",
      icon: Instagram,
      caption:
        caption || "Generate a caption to preview it here.",
      hashtags:
        "#BaliTravel #GoldenHour #TravelReels #IslandLife #ExploreMore #ContentCreator #WanderlustVibes #TravelDiary",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      hoverColor: "hover:border-pink-500/50",
      scoreColor: "from-pink-500 to-rose-500",
      score: 94,
    },
    {
      platform: "LinkedIn",
      icon: Linkedin,
      caption:
        "Just wrapped an incredible content shoot in Bali. As a creator, I've learned that authenticity in storytelling is what drives real engagement. This reel captures the essence of travel content that resonates -- real moments, real emotions, real connections.",
      hashtags: "#ContentCreator #Storytelling #CreativeWork #Bali",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      hoverColor: "hover:border-blue-500/50",
      scoreColor: "from-blue-500 to-cyan-500",
      score: 89,
    },
    {
      platform: "Twitter",
      icon: Twitter,
      caption:
        "🌴 Just got back from an amazing shoot in Bali. The vibes, the light, the culture - everything was perfect. Already planning the next adventure! 🎥✨",
      hashtags: "#Travel #ContentCreator #Bali #TravelPhotography",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      borderColor: "border-sky-500/30",
      hoverColor: "hover:border-sky-500/50",
      scoreColor: "from-sky-500 to-blue-500",
      score: 91,
    },
  ]

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRegenerate = (id: string) => {
    setRegenerating(id)
    setTimeout(() => setRegenerating(null), 1500)
  }

  const handleEdit = (platform: string, originalCaption: string) => {
    if (editingId === platform) {
      setEditingId(null)
    } else {
      setEditingId(platform)
      if (!editedCaptions[platform]) {
        setEditedCaptions((prev) => ({ ...prev, [platform]: originalCaption }))
      }
    }
  }

  const handleCancelEdit = (platform: string) => {
    setEditingId(null)
    setEditedCaptions((prev) => {
      const copy = { ...prev }
      delete copy[platform]
      return copy
    })
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">Caption Preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated captions optimized for each platform.
        </p>
      </div>

      {/* Grid of Caption Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 w-full overflow-hidden"
      >
        {captions.map((c) => (
          <motion.div key={c.platform} variants={item} className="w-full overflow-hidden">
            <Card
              className={cn(
                "relative w-full h-full border bg-slate-800/50",
                c.borderColor,
                c.hoverColor,
                "hover:shadow-lg hover:shadow-purple-500/10 hover:bg-slate-800/70"
              )}
            >
              {/* Card Header */}
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} border ${c.borderColor}`}>
                      <c.icon className={`h-5 w-5 ${c.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-white">
                        {c.platform}
                      </CardTitle>
                      <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300 border border-purple-500/30">
                        <Sparkles className="h-3 w-3" />
                        AI Generated
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(c.platform, c.caption)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                        editingId === c.platform
                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                          : "bg-slate-700/50 text-slate-400 hover:bg-slate-600 hover:text-white border border-slate-600/50"
                      )}
                      aria-label={`Edit ${c.platform} caption`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Regenerate Button */}
                    <button
                      onClick={() => handleRegenerate(c.platform)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/50 text-slate-400 transition-all duration-200 hover:bg-slate-600 hover:text-white border border-slate-600/50"
                      aria-label={`Regenerate ${c.platform} caption`}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 transition-transform",
                          regenerating === c.platform && "animate-spin"
                        )}
                      />
                    </button>

                    {/* Copy Button */}
                    <button
                      onClick={() =>
                        handleCopy(c.caption + (c.hashtags ? "\n\n" + c.hashtags : ""), c.platform)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/50 text-slate-400 transition-all duration-200 hover:bg-slate-600 hover:text-white border border-slate-600/50"
                      aria-label={`Copy ${c.platform} caption`}
                    >
                      {copiedId === c.platform ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>

              {/* Card Content */}
              <CardContent className="space-y-4">
                {/* Caption Text */}
                {editingId === c.platform ? (
                  <div className="space-y-3">
                    <textarea
                      value={editedCaptions[c.platform] || c.caption}
                      onChange={(e) =>
                        setEditedCaptions((prev) => ({
                          ...prev,
                          [c.platform]: e.target.value,
                        }))
                      }
                      className="min-h-24 w-full resize-none rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600/30 px-3 py-1.5 text-xs font-medium text-purple-300 border border-purple-500/50 transition-colors hover:bg-purple-600/50"
                      >
                        <Check className="h-3 w-3" />
                        Save
                      </button>
                      <button
                        onClick={() => handleCancelEdit(c.platform)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-600/50 transition-colors hover:bg-slate-600/70"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-slate-200">
                    {editedCaptions[c.platform] || c.caption}
                  </p>
                )}

                {/* Hashtags */}
                {c.hashtags && (
                  <p className={`text-xs leading-relaxed ${c.color} font-medium`}>
                    {c.hashtags}
                  </p>
                )}

                {/* AI Optimization Score */}
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-slate-300">
                        Engagement Score
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${c.color}`}>{c.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.score}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${c.scoreColor}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Publish Button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full overflow-hidden"
      >
        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-opacity h-11 font-medium">
          <Send className="mr-2 h-4 w-4" />
          Publish to All Platforms
        </Button>
      </motion.div>
    </div>
  )
}
