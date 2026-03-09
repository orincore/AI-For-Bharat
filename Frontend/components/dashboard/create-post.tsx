"use client"

import { useState, useCallback, useEffect } from "react"
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
  Youtube,
  Sparkles,
  Check,
  Loader2,
  Send,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { instagramService } from "@/lib/instagram"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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
  {
    id: "youtube",
    label: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    activeBg: "bg-red-500/10",
    activeBorder: "border-red-500/40",
    glowClass: "glow-youtube",
  },
]

const MAX_CAPTION_LENGTH = 2200

type PublishingStatusPayload = {
  active: boolean
  stage?: string
}

interface CreatePostProps {
  onGenerateCaption: (caption: string) => void
  onPublishingStatusChange?: (status: PublishingStatusPayload) => void
}

export function CreatePost({ onGenerateCaption, onPublishingStatusChange }: CreatePostProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [caption, setCaption] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [videoTags, setVideoTags] = useState("")
  const [tone, setTone] = useState("engaging")
  const [audience, setAudience] = useState("general")
  const [includeHashtags, setIncludeHashtags] = useState(true)
  const [includeEmojis, setIncludeEmojis] = useState(true)
  const [additionalContext, setAdditionalContext] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [publishingProgress, setPublishingProgress] = useState<Record<string, { status: 'pending' | 'publishing' | 'success' | 'error', message?: string }>>({})
  const { toast } = useToast()
  const router = useRouter()

  const notifyPublishingStatus = useCallback(
    (active: boolean, stage?: string) => {
      onPublishingStatusChange?.({ active, stage })
    },
    [onPublishingStatusChange]
  )

  useEffect(() => {
    loadConnectedAccounts()
  }, [])

  const loadConnectedAccounts = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      // Fetch Instagram accounts
      const instagramAccounts = await instagramService.getConnectedAccounts()
      setConnectedAccounts(instagramAccounts)

      // Fetch YouTube channel
      const youtubeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube/channel`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const youtubeData = await youtubeResponse.json()

      // Build list of connected platforms
      const platforms: string[] = []
      if (instagramAccounts.length > 0) platforms.push('instagram')
      if (youtubeData?.success && youtubeData?.data) platforms.push('youtube')

      setConnectedPlatforms(platforms)
    } catch (error) {
      console.error('Error loading connected accounts:', error)
    }
  }

  const handleGenerateVideoMetadata = async () => {
    setLoadingMetadata(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          caption: caption || 'Create a compelling video caption and metadata.',
          platform: 'YouTube',
          tone,
          audience,
          includeHashtags,
          includeEmojis,
          additionalContext,
          generateVideoMetadata: true,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      if (data.videoMetadata) {
        setVideoTitle(data.videoMetadata.title || '')
        setVideoDescription(data.videoMetadata.description || '')
        setVideoTags((data.videoMetadata.tags || []).join(', '))
        toast({
          title: 'Video metadata generated!',
          description: 'Title, description, and tags have been auto-filled.',
        })
      } else {
        throw new Error('AI did not return video metadata.')
      }
    } catch (error: any) {
      toast({
        title: 'Failed to generate video metadata',
        description: error.message || 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setLoadingMetadata(false)
    }
  }

  const generateCaption = async () => {
    setLoading(true)
    try {
      const platform = selectedPlatforms[0] || 'instagram'
      const shouldGenerateVideoMetadata = selectedPlatforms.includes('youtube')
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('Not authenticated')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate-caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          caption: caption || 'Create an engaging caption about this content.',
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          tone,
          audience,
          includeHashtags,
          includeEmojis,
          additionalContext,
          generateVideoMetadata: shouldGenerateVideoMetadata,
        }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      
      setCaption(data.caption)
      onGenerateCaption(data.caption)

      if (data.videoMetadata) {
        setVideoTitle(data.videoMetadata.title || '')
        setVideoDescription(data.videoMetadata.description || '')
        setVideoTags((data.videoMetadata.tags || []).join(', '))
      }
      
      toast({
        title: 'Caption generated!',
        description: shouldGenerateVideoMetadata
          ? 'Caption and video metadata generated!'
          : 'AI has created an optimized caption for your post',
      })
    } catch (error: any) {
      console.error('Error generating caption:', error)
      toast({
        title: 'Failed to generate caption',
        description: error.message || 'Please try again',
        variant: 'destructive',
      })
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
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setUploadedFile(file)
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or video file',
        variant: 'destructive',
      })
    }
  }, [toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setUploadedFile(file)
    } else if (file) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or video file',
        variant: 'destructive',
      })
    }
  }

  const handlePublish = async () => {
    if (!uploadedFile || selectedPlatforms.length === 0 || !caption) {
      toast({
        title: 'Missing information',
        description: 'Please upload media, select at least one platform, and add a caption',
        variant: 'destructive',
      })
      return
    }

    if (selectedPlatforms.includes('youtube') && !videoTitle) {
      toast({
        title: 'Missing video title',
        description: 'YouTube requires a video title',
        variant: 'destructive',
      })
      return
    }

    setPublishing(true)
    const progress: Record<string, { status: 'pending' | 'publishing' | 'success' | 'error', message?: string }> = {}
    selectedPlatforms.forEach(p => {
      progress[p] = { status: 'pending' }
    })
    setPublishingProgress(progress)
    notifyPublishingStatus(true, 'Uploading media to cloud...')

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) throw new Error('Not authenticated')

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Publish to each selected platform
      for (const platform of selectedPlatforms) {
        try {
          setPublishingProgress(prev => ({
            ...prev,
            [platform]: { status: 'publishing' }
          }))
          notifyPublishingStatus(true, `Publishing to ${platform}...`)

          // Create FormData for file upload
          const formData = new FormData()
          formData.append('media', uploadedFile)
          formData.append('platform', platform)
          formData.append('caption', caption)
          if (videoTitle) formData.append('videoTitle', videoTitle)
          if (videoDescription) formData.append('videoDescription', videoDescription)
          if (videoTags) formData.append('videoTags', videoTags)

          // Create post
          const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          })

          const createData = await createResponse.json()
          if (!createData.success) throw new Error(createData.error)

          // Publish post
          const publishResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/posts/${createData.data.id}/publish`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          )

          const publishData = await publishResponse.json()
          if (!publishData.success) throw new Error(publishData.error)

          setPublishingProgress(prev => ({
            ...prev,
            [platform]: { status: 'success', message: 'Published successfully' }
          }))
          successCount++
        } catch (error: any) {
          console.error(`Error publishing to ${platform}:`, error)
          setPublishingProgress(prev => ({
            ...prev,
            [platform]: { status: 'error', message: error.message || 'Failed to publish' }
          }))
          errors.push(`${platform}: ${error.message}`)
          errorCount++
        }
      }

      // Show final result
      if (successCount > 0 && errorCount === 0) {
        toast({
          title: 'All posts published!',
          description: `Successfully published to ${successCount} platform${successCount > 1 ? 's' : ''}`,
        })
      } else if (successCount > 0 && errorCount > 0) {
        toast({
          title: 'Partially published',
          description: `${successCount} succeeded, ${errorCount} failed. Check details above.`,
        })
      } else {
        toast({
          title: 'Publishing failed',
          description: errors.join('; '),
          variant: 'destructive',
        })
      }

      // Reset form if at least one succeeded
      if (successCount > 0) {
        setTimeout(() => {
          setUploadedFile(null)
          setCaption('')
          setVideoTitle('')
          setVideoDescription('')
          setVideoTags('')
          setSelectedPlatforms([])
          setPublishingProgress({})
          router.push('/dashboard?tab=history')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error in publish flow:', error)
      toast({
        title: 'Publishing failed',
        description: error.message || 'Failed to publish post',
        variant: 'destructive',
      })
    } finally {
      setTimeout(() => {
        setPublishing(false)
        notifyPublishingStatus(false)
      }, 2000)
    }
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
                  onClick={() => document.getElementById('file-upload')?.click()}
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
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
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
                        {uploadedFile.type.startsWith("video") ? "Video" : "Image"} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
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
            <div className="flex flex-col space-y-3">
              {platforms.filter(p => connectedPlatforms.includes(p.id)).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/40 bg-secondary/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No platforms connected. Please connect Instagram or YouTube in Settings.
                  </p>
                </div>
              ) : (
                platforms.filter(p => connectedPlatforms.includes(p.id)).map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform.id)
                  const progress = publishingProgress[platform.id]
                  return (
                    <motion.button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      disabled={publishing}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200",
                        isSelected
                          ? `${platform.activeBg} ${platform.activeBorder} ${platform.glowClass}`
                          : "border-border/40 bg-secondary/30 text-muted-foreground hover:border-primary/20 hover:bg-secondary/50",
                        publishing && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <platform.icon
                          className={cn(
                            "h-4.5 w-4.5 transition-colors",
                            isSelected ? platform.color : "text-muted-foreground"
                          )}
                        />
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors",
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {platform.label}
                          </span>
                          {progress && (
                            <span className={cn(
                              "text-xs",
                              progress.status === 'publishing' && "text-blue-500",
                              progress.status === 'success' && "text-green-500",
                              progress.status === 'error' && "text-red-500",
                              progress.status === 'pending' && "text-muted-foreground"
                            )}>
                              {progress.status === 'publishing' && '⏳ Publishing...'}
                              {progress.status === 'success' && '✅ Published'}
                              {progress.status === 'error' && `❌ ${progress.message}`}
                              {progress.status === 'pending' && '⏸️ Pending'}
                            </span>
                          )}
                        </div>
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
                })
              )}
            </div>

            {/* AI Prompt Configuration */}
            <div className="mt-5 space-y-4 border-t border-border/40 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">AI Caption Settings</label>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="engaging">Engaging</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="humorous">Humorous</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="general">General</option>
                    <option value="young adults">Young Adults</option>
                    <option value="professionals">Professionals</option>
                    <option value="entrepreneurs">Entrepreneurs</option>
                    <option value="creators">Content Creators</option>
                    <option value="students">Students</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="h-4 w-4 rounded border-border/60 bg-secondary/30 text-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Include Hashtags</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmojis}
                    onChange={(e) => setIncludeEmojis(e.target.checked)}
                    className="h-4 w-4 rounded border-border/60 bg-secondary/30 text-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs font-medium text-muted-foreground">Include Emojis</span>
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Additional Context (Optional)</label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any specific details, keywords, or instructions for the AI..."
                  className="min-h-20 w-full resize-none rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Caption with character counter */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {selectedPlatforms.includes("youtube") ? "Short Caption (for Shorts or Community posts)" : "Caption"}
                </label>
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

            {/* YouTube-specific fields */}
            {selectedPlatforms.includes("youtube") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 space-y-4 border-t border-border/40 pt-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Video Title <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter your video title"
                    className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Video Description
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Describe your video content..."
                    className="min-h-24 w-full resize-none rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tags / Keywords
                  </label>
                  <input
                    type="text"
                    value={videoTags}
                    onChange={(e) => setVideoTags(e.target.value)}
                    placeholder="Enter tags separated by commas"
                    className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </motion.div>
            )}

            <div className="mt-5 space-y-3">
              <Button
                onClick={generateCaption}
                className="w-full bg-gradient-to-r from-primary to-neon-cyan text-primary-foreground hover:opacity-90 transition-opacity h-11 font-medium"
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
                    Generate Caption with Orin AI
                  </>
                )}
              </Button>
              
              <Button
                onClick={handlePublish}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 transition-opacity h-11 font-medium"
                disabled={!uploadedFile || selectedPlatforms.length === 0 || !caption || publishing}
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Publish to {selectedPlatforms.length > 0 ? `${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? 's' : ''}` : 'Platform'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
