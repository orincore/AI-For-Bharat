"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  User,
  TrendingUp,
  BarChart3,
  Heart,
  MessageCircle,
  ExternalLink,
  ImageOff,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const CONVERSATION_STORAGE_KEY = "orin_ai_conversation_id"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  posts?: PostPreview[]
  comments?: CommentHighlight[]
}

export default OrinAIChat;

interface CommentHighlight {
  text: string
  author?: string
  timestamp?: string
  likes?: number
}

interface PostPreview {
  title: string
  summary?: string
  likes?: number
  comments?: number
  mediaUrl?: string
  link?: string
  platform?: string
}

const POST_SECTION_REGEX = /📊 Post:[\s\S]*?(?=(?:\n\s*📊 Post:)|$)/g
const COMMENT_REGEX = /(?:comment|Comment)(?:\s+(?:was|reads?|says?)):[\s]*["']([^"']+)["']/g
const QUOTE_REGEX = /["']([^"']{20,})["']/g

const LISTED_COMMENT_LINE_REGEX = /^@([\w._]+):\s+"([^"]+)"$/
const LISTED_COMMENT_META_REGEX = /^Posted:\s*([^|]+?)(?:\s*\|\s*(\d+)\s+likes?)?$/i

const parseAssistantContent = (content: string) => {
  const postMatches = content.match(POST_SECTION_REGEX)
  let cleanedContent = content
  const posts: PostPreview[] = []
  const comments: CommentHighlight[] = []

  if (postMatches) {
    postMatches.forEach((match) => {
      cleanedContent = cleanedContent.replace(match, "").trim()

      const withoutPrefix = match.replace("📊 Post:", "").trim()
      const [headlineRaw, ...rest] = withoutPrefix.split("\n")
      const headline = headlineRaw?.trim() || "Untitled Post"
      const body = rest.join(" ").trim()
      const likes = parseInt((match.match(/Likes:\s*([\d,]+)/i)?.[1] || "0").replace(/,/g, ""), 10)
      const commentsCount = parseInt((match.match(/Comments:\s*([\d,]+)/i)?.[1] || "0").replace(/,/g, ""), 10)
      const mediaUrlMatch = match.match(/https?:\/\/\S+\.(?:png|jpe?g|webp|gif)/i)
      const genericUrlMatch = match.match(/https?:\/\/\S+/)

      posts.push({
        title: headline,
        summary: body.replace(/\|\s*Likes:.*/i, "").trim(),
        likes: Number.isNaN(likes) ? undefined : likes,
        comments: Number.isNaN(commentsCount) ? undefined : commentsCount,
        mediaUrl: mediaUrlMatch?.[0],
        link: genericUrlMatch?.[0],
        platform: match.toLowerCase().includes("youtube") ? "YouTube" : "Instagram",
      })

  // Detect structured comment lists like:
  // @username: "Comment text"
  // Posted: Feb 27, 2026, 11:19 PM | 2 likes
  const lines = cleanedContent.split("\n")
  const linesToRemove = new Set<number>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const listMatch = line.match(LISTED_COMMENT_LINE_REGEX)
    if (!listMatch) {
      continue
    }

    const author = listMatch[1]
    const text = listMatch[2]
    const metaLine = lines[i + 1]?.trim()
    const metaMatch = metaLine?.match(LISTED_COMMENT_META_REGEX)

    comments.push({
      text,
      author,
      timestamp: metaMatch?.[1]?.trim(),
      likes: metaMatch?.[2] ? Number(metaMatch[2]) : undefined,
    })

    linesToRemove.add(i)
    if (metaMatch) {
      linesToRemove.add(i + 1)
    }
    if (lines[i + 2]?.trim() === "") {
      linesToRemove.add(i + 2)
    }
  }

  if (linesToRemove.size > 0) {
    cleanedContent = lines
      .filter((_, idx) => !linesToRemove.has(idx))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  }
    })
  }

  const commentMatches = [...content.matchAll(COMMENT_REGEX)]
  commentMatches.forEach((match) => {
    const authorMatch = content.match(new RegExp(`(?:from|by)\\s+(?:user\\s+)?([\\w_]+)\\s+and\\s+it\\s+reads?:\\s*["']${match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))
    const timestampMatch = content.match(new RegExp(`["']${match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^.]*?(?:on|posted)\\s+([A-Z][a-z]+\\s+\\d+,\\s+\\d{4})`, 'i'))
    
    comments.push({
      text: match[1],
      author: authorMatch?.[1],
      timestamp: timestampMatch?.[1],
    })
    cleanedContent = cleanedContent.replace(match[0], '').trim()
  })

  return {
    cleaned: cleanedContent.replace(/\n{3,}/g, "\n\n").trim(),
    posts,
    comments: comments.length > 0 ? comments : undefined,
  }
}

const CommentHighlightCard = ({ comment }: { comment: CommentHighlight }) => {
  return (
    <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <MessageCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium italic text-foreground leading-relaxed">
            "{comment.text}"
          </p>
          {(comment.author || comment.timestamp || typeof comment.likes === "number") && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {comment.author && (
                <span className="font-semibold text-primary">@{comment.author}</span>
              )}
              {comment.timestamp && (
                <>
                  {(comment.author) && <span>•</span>}
                  <span>{comment.timestamp}</span>
                </>
              )}
              {typeof comment.likes === "number" && (
                <>
                  {(comment.author || comment.timestamp) && <span>•</span>}
                  <span className="flex items-center gap-1 text-rose-500">
                    <Heart className="h-3 w-3" />
                    {comment.likes} like{comment.likes === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const PostPreviewCard = ({ post }: { post: PostPreview }) => {
  const hasImage = Boolean(post.mediaUrl)

  return (
    <div className="rounded-2xl border border-border/40 bg-background/95 shadow-sm ring-1 ring-border/20">
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-muted to-muted/60">
        <div className="aspect-video">
          {hasImage ? (
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ImageOff className="h-5 w-5" />
              <span>No preview available</span>
            </div>
          )}
        </div>
        {post.platform && (
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow">
            {post.platform}
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground line-clamp-2">{post.title}</p>
          {post.summary && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{post.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          {typeof post.likes === "number" && (
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              {post.likes.toLocaleString()}
            </span>
          )}
          {typeof post.comments === "number" && (
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              {post.comments.toLocaleString()}
            </span>
          )}
        </div>
        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View post
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export function OrinAIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! I'm Orin AI, your social media assistant. I can help you with:\n\n• **Analytics Insights** - Get AI-powered summaries of your performance\n• **Content Strategy** - Ask questions about your connected accounts\n• **Performance Analysis** - Understand what's working and what's not\n• **Recommendations** - Get personalized tips to grow your audience\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [analyticsSummary, setAnalyticsSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const persistConversationId = (id: string) => {
    setConversationId(id)
    localStorage.setItem(CONVERSATION_STORAGE_KEY, id)
  }

  const loadConversation = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        return
      }

      const storedId = localStorage.getItem(CONVERSATION_STORAGE_KEY) || undefined
      const params = new URLSearchParams()
      if (storedId) {
        params.append("conversationId", storedId)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ai/conversation${params.toString() ? `?${params.toString()}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()
      if (!data.success || !data.conversation) {
        return
      }

      persistConversationId(data.conversation.id)

      if (Array.isArray(data.messages) && data.messages.length > 0) {
        const historyMessages: Message[] = data.messages
          .map((msg: any) => {
            const role: "assistant" | "user" = msg.role === "assistant" ? "assistant" : "user"
            const baseContent = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
            const timestamp = msg.createdAt ? new Date(msg.createdAt) : new Date()

            if (role === "assistant") {
              const { cleaned, posts, comments } = parseAssistantContent(baseContent)
              return {
                id: msg.id || `${role}-${msg.createdAt}`,
                role,
                content: cleaned,
                posts,
                comments,
                timestamp,
              }
            }

            return {
              id: msg.id || `${role}-${msg.createdAt}`,
              role,
              content: baseContent,
              timestamp,
            }
          })
          .filter((msg: Message) => Boolean(msg.content))

        if (historyMessages.length > 0) {
          setMessages(historyMessages)
        }
      }
    } catch (error) {
      console.error("Failed to load conversation history", error)
    } finally {
      setInitializing(false)
    }
  }, [])

  useEffect(() => {
    loadConversation()
  }, [loadConversation])

  const fetchAnalyticsSummary = async () => {
    setLoadingSummary(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/summarize-analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      setAnalyticsSummary(data.summary)
      
      // Add summary as a message
      const { cleaned, posts } = parseAssistantContent(data.summary)
      const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        role: "assistant",
        content: cleaned,
        posts,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, summaryMessage])
    } catch (error: any) {
      toast({
        title: "Failed to fetch analytics",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const token = localStorage.getItem("auth_token")
      if (!token) throw new Error("Not authenticated")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          question: input,
          conversationId: conversationId || undefined,
        }),
      })

      const data = await response.json()
      if (!data.success) throw new Error(data.error)

      if (data.conversationId) {
        persistConversationId(data.conversationId)
      }

      const { cleaned, posts, comments } = parseAssistantContent(data.answer)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: cleaned,
        posts,
        comments,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      toast({
        title: "Failed to get response",
        description: error.message || "Please try again",
        variant: "destructive",
      })

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orin AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your intelligent social media assistant powered by AWS Bedrock
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={fetchAnalyticsSummary}
          disabled={loadingSummary}
          className="h-auto flex-col items-start gap-2 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:bg-primary/20"
          variant="outline"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Summarize Analytics</span>
          </div>
          <span className="text-xs text-muted-foreground text-left">
            Get AI-powered insights from your connected accounts
          </span>
        </Button>

        <Button
          onClick={() => setInput("What are my top performing posts?")}
          className="h-auto flex-col items-start gap-2 p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 hover:bg-green-500/20"
          variant="outline"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="font-semibold">Performance Analysis</span>
          </div>
          <span className="text-xs text-muted-foreground text-left">
            Ask about your content performance
          </span>
        </Button>
      </div>

      {/* Chat Interface */}
      <Card className="border-border/60 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Chat with Orin AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto space-y-4 rounded-xl border border-border/40 bg-secondary/30 p-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border border-border/40"
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-invert max-w-none">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <p className="mt-2 text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {!initializing && message.role === "assistant" && message.comments && message.comments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.comments.map((comment, index) => (
                          <CommentHighlightCard key={`${message.id}-comment-${index}`} comment={comment} />
                        ))}
                      </div>
                    )}
                    {message.role === "assistant" && message.posts && message.posts.length > 0 && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {message.posts.map((post, index) => (
                          <PostPreviewCard key={`${message.id}-post-${index}`} post={post} />
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl bg-muted border border-border/40 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your social media accounts..."
              className="min-h-[60px] resize-none rounded-xl border-border/60 bg-secondary/30 text-sm"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="h-[60px] w-[60px] shrink-0 rounded-xl bg-gradient-to-r from-primary to-primary/80"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Orin AI analyzes your connected accounts to provide personalized insights
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
