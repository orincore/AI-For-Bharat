"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Instagram,
  Linkedin,
  Twitter,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const platforms = [
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "text-neon-instagram",
    activeBg: "bg-neon-instagram/10",
    activeBorder: "border-neon-instagram/40",
    glowClass: "glow-instagram",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-neon-linkedin",
    activeBg: "bg-neon-linkedin/10",
    activeBorder: "border-neon-linkedin/40",
    glowClass: "glow-linkedin",
  },
  {
    id: "x",
    label: "X (Twitter)",
    icon: Twitter,
    color: "text-neon-x",
    activeBg: "bg-neon-x/10",
    activeBorder: "border-neon-x/40",
    glowClass: "glow-x",
  },
]

const MAX_CAPTION_LENGTH = 2200

interface CreatePostProps {
  onGenerateCaption: (caption: string) => void
}

export function CreatePost({ onGenerateCaption }: CreatePostProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [caption, setCaption] = useState("")
  const [loading, setLoading] = useState(false)
  const generateCaption = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption: caption || 'Create an engaging Instagram caption about travel and adventure.' }),
      })
      const data = await response.json()
      setCaption(data.caption)
      onGenerateCaption(data.caption)
    } catch (error) {
      console.error('Error generating caption:', error)
      // Fallback to mock caption
      const mockCaption = `Exploring paradise one golden sunset at a time 🌅
Bali never fails to steal my heart. Every moment here feels magical.
#TravelReels #BaliLife #ContentCreator #ExploreMore #IslandVibes`
      setCaption(mockCaption)
      onGenerateCaption(mockCaption)
    } finally {
      setLoading(false)
    }
  }

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setUploadedFile({ name: file.name, type: file.type })
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileSelect = () => {
    setUploadedFile({ name: "travel-reel-bali.mp4", type: "video/mp4" })
  }

  const charPercent = Math.min((caption.length / MAX_CAPTION_LENGTH) * 100, 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your content and select platforms to publish.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Media */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Upload Media</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {!uploadedFile ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={handleFileSelect}
                  className={cn(
                    "glow-card group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-all duration-300",
                    isDragOver
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"
                  )}
                >
                  <motion.div
                    animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20"
                  >
                    <Upload className="h-6 w-6 text-primary" />
                  </motion.div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Drop your file here, or{" "}
                    <span className="text-primary">click to browse</span>
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Supports JPG, PNG, MP4, MOV up to 100MB
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary">
                      <Video className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative rounded-xl border border-primary/20 bg-primary/5 p-5"
                >
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      {uploadedFile.type.startsWith("video") ? (
                        <Video className="h-8 w-8 text-primary" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {uploadedFile.type.startsWith("video") ? "Video" : "Image"} ready for upload
                      </p>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-primary to-neon-cyan"
                        />
                      </div>
                      <p className="mt-1 text-xs text-primary font-medium">Upload complete</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Platform Selection + Caption */}
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Platforms & Caption
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Platform pills */}
            <div className="flex flex-col gap-2">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id)
                return (
                  <motion.button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200",
                      isSelected
                        ? `${platform.activeBg} ${platform.activeBorder} ${platform.glowClass}`
                        : "border-border/40 bg-secondary/30 text-muted-foreground hover:border-primary/20 hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <platform.icon
                        className={cn(
                          "h-4.5 w-4.5 transition-colors",
                          isSelected ? platform.color : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {platform.label}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Caption with character counter */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Caption</label>
                <span
                  className={cn(
                    "text-xs font-mono tabular-nums",
                    caption.length > MAX_CAPTION_LENGTH * 0.9
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {caption.length}/{MAX_CAPTION_LENGTH}
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                  placeholder="Write your caption or let Orin AI generate one..."
                  className="min-h-28 w-full resize-none rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {/* Character progress bar */}
                <div className="absolute bottom-2 left-4 right-4 h-0.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${charPercent}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors",
                      charPercent > 90
                        ? "bg-destructive"
                        : "bg-gradient-to-r from-primary to-neon-cyan"
                    )}
                  />
                </div>
              </div>
            </div>

            <Button
  onClick={generateCaption}
  className="mt-5 w-full bg-gradient-to-r from-primary to-neon-cyan text-primary-foreground hover:opacity-90 transition-opacity h-11 font-medium"
  disabled={selectedPlatforms.length === 0 || !uploadedFile || loading}
>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Orin AI is thinking...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with Orin AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
