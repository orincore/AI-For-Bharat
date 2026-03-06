"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Bot,
  User,
  Sparkles,
  Target,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Hash,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ReasoningStep {
  id: string
  icon: React.ElementType
  label: string
  status: "pending" | "active" | "done"
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  reasoning?: {
    intent: string
    platforms: string[]
    action: string
    steps: ReasoningStep[]
  }
}

const createReasoningSteps = (): ReasoningStep[] => [
  { id: "analyze", icon: Search, label: "Analyzing command", status: "pending" },
  { id: "intent", icon: Target, label: "Intent detected", status: "pending" },
  { id: "platforms", icon: Globe, label: "Platforms detected", status: "pending" },
  { id: "generate", icon: FileText, label: "Generating captions", status: "pending" },
  { id: "hashtags", icon: Hash, label: "Optimizing hashtags", status: "pending" },
]

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hey! I'm Orin, your AI content assistant. I can help you create posts, generate captions, schedule content, and analyze your performance across platforms. What would you like to do?",
    timestamp: new Date(),
  },
]

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-secondary/50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 0.15, 0.3].map((delay) => (
            <motion.span
              key={delay}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1, 0.85] }}
              transition={{ duration: 1.2, repeat: Infinity, delay }}
              className="h-2 w-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function ReasoningPanel({ reasoning }: { reasoning: Message["reasoning"] }) {
  const [expanded, setExpanded] = useState(true)
  const [steps, setSteps] = useState<ReasoningStep[]>(reasoning?.steps || [])

  useEffect(() => {
    if (!reasoning?.steps) return
    const initialSteps = reasoning.steps.map((s) => ({ ...s, status: "pending" as const }))
    setSteps(initialSteps)

    const timers: NodeJS.Timeout[] = []
    initialSteps.forEach((_, i) => {
      // Set step to active
      timers.push(
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: "active" } : s))
          )
        }, i * 500)
      )
      // Set step to done
      timers.push(
        setTimeout(() => {
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s))
          )
        }, i * 500 + 400)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [reasoning?.steps])

  if (!reasoning) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="mb-2 ml-11"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="font-medium">Orin Reasoning</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden rounded-xl border border-primary/15 bg-primary/5 p-3"
          >
            {/* Sequential animated steps */}
            <div className="flex flex-col gap-2 mb-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.25 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-5 w-5 items-center justify-center">
                    {step.status === "done" ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </motion.div>
                    ) : step.status === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <step.icon
                    className={cn(
                      "h-3.5 w-3.5",
                      step.status === "done"
                        ? "text-primary"
                        : step.status === "active"
                          ? "text-primary"
                          : "text-muted-foreground/50"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors duration-200",
                      step.status === "done"
                        ? "font-medium text-foreground"
                        : step.status === "active"
                          ? "font-medium text-primary"
                          : "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Summary badges */}
            <div className="flex flex-col gap-2 border-t border-primary/10 pt-3">
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Intent:</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {reasoning.intent}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-neon-cyan" />
                <span className="text-xs text-muted-foreground">Platforms:</span>
                <div className="flex gap-1">
                  {reasoning.platforms.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-neon-cyan/10 px-2 py-0.5 text-[11px] font-medium text-neon-cyan"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-chart-3" />
                <span className="text-xs text-muted-foreground">Action:</span>
                <span className="text-xs font-medium text-foreground">{reasoning.action}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function OrinChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const sendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I've analyzed your request and crafted optimized captions for each platform. Each caption is tailored to the platform's audience and format. Check the preview cards on the right to review, edit, and publish!",
        timestamp: new Date(),
        reasoning: {
          intent: "GENERATE_CAPTIONS",
          platforms: ["Instagram", "LinkedIn"],
          action: "Generating platform-optimized captions",
          steps: createReasoningSteps(),
        },
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 2200)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Orin AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your AI content assistant. Ask Orin to create, schedule, or optimize your posts.
        </p>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Bot className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-card bg-primary" />
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Orin</p>
            <p className="text-[11px] font-medium text-primary">Online -- Ready to create</p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ maxHeight: "calc(100vh - 380px)" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <div key={message.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      message.role === "assistant"
                        ? "bg-primary/10 ring-1 ring-primary/20"
                        : "bg-secondary ring-1 ring-border"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "assistant"
                        ? "rounded-tl-sm border border-border/40 bg-secondary/50 text-foreground"
                        : "rounded-tr-sm bg-gradient-to-br from-primary to-neon-cyan text-primary-foreground"
                    )}
                  >
                    {message.content.split("\n").map((line, i) => (
                      <span key={i}>
                        {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong key={j} className="font-semibold">
                                {part.slice(2, -2)}
                              </strong>
                            )
                          }
                          return part
                        })}
                        {i < message.content.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Reasoning panel for AI messages */}
                {message.role === "assistant" && message.reasoning && (
                  <ReasoningPanel reasoning={message.reasoning} />
                )}
              </div>
            ))}
          </AnimatePresence>
          <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
        </div>

        {/* Input */}
        <div className="border-t border-border/40 p-3">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Orin anything..."
                rows={1}
                className="w-full resize-none rounded-xl border border-border/60 bg-secondary/30 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary/50 focus:bg-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <motion.button
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              whileTap={{ scale: 0.95 }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-neon-cyan text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Orin may make mistakes. Review content before publishing.
          </p>
        </div>
      </div>
    </div>
  )
}
