"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  RefreshCw,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MonitorPlay,
  FileText,
} from "lucide-react";

type HistoryStatus = "pending" | "success" | "failed";

interface PostHistoryItem {
  id: string;
  postId: string;
  platform: string;
  platformAccountId?: string;
  platformUsername?: string;
  status: HistoryStatus;
  stage?: string;
  errorMessage?: string;
  caption?: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt: string;
  platformPostId?: string;
}

const platformMeta: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "text-neon-instagram" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "text-neon-linkedin" },
  twitter: { label: "X (Twitter)", icon: Twitter, color: "text-neon-x" },
  youtube: { label: "YouTube", icon: Youtube, color: "text-red-500" },
};

const statusMeta: Record<HistoryStatus, { label: string; tone: string; icon: React.ElementType }> = {
  pending: { label: "Processing", tone: "warning", icon: Clock },
  success: { label: "Published", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "destructive", icon: XCircle },
};

export function ContentLibrary() {
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      const response = await api.getPostHistory(token);
      if (!response.success) throw new Error(response.error || "Failed to load history");

      const normalized = (response.data || []).map((item: any) => ({
        ...item,
        createdAt: item.createdAt || item.updatedAt,
      }));

      setHistory(normalized);
    } catch (err: any) {
      console.error("Error loading history:", err);
      setError(err.message || "Failed to load history");
      toast({
        title: "Unable to load history",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusBadgeClass = (tone: string) => {
    switch (tone) {
      case "success":
        return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
      case "destructive":
        return "bg-red-500/15 text-red-500 border-red-500/30";
      case "warning":
      default:
        return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    }
  };

  const renderHistoryCard = (entry: PostHistoryItem) => {
    const platform = platformMeta[entry.platform] || {
      label: entry.platform,
      icon: FileText,
      color: "text-foreground",
    };
    const status = statusMeta[entry.status];

    return (
      <Card key={entry.id} className="border-border/60 bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center", platform.color)}>
                <platform.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {platform.label}
                  {entry.platformUsername && (
                    <span className="text-xs text-muted-foreground font-normal">@{entry.platformUsername}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Post ID: {entry.postId}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn("gap-1 border", statusBadgeClass(status.tone))}>
              <status.icon className="h-3.5 w-3.5" />
              {status.label}
            </Badge>
          </div>

          {entry.caption && (
            <p className="text-sm text-foreground/90 line-clamp-3">{entry.caption}</p>
          )}

          <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground md:grid-cols-2">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Timeline</p>
              <p>{new Date(entry.createdAt).toLocaleString()}</p>
              {entry.stage && (
                <p className="capitalize">
                  Stage: <span className="text-foreground/80">{entry.stage}</span>
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Details</p>
              {entry.platformPostId ? (
                <p>
                  Platform ID: <span className="text-foreground/80">{entry.platformPostId}</span>
                </p>
              ) : (
                <p>No platform ID yet</p>
              )}
              {entry.mediaUrl && (
                <a
                  href={entry.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary"
                >
                  <MonitorPlay className="h-3.5 w-3.5" /> View media
                </a>
              )}
            </div>
          </div>

          {entry.errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-500">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{entry.errorMessage}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Content History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every publish attempt across your connected accounts
          </p>
        </div>
        <Button
          onClick={loadHistory}
          variant="outline"
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-border border-dashed bg-secondary/30 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No content history yet. Publish a post to see it here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map(renderHistoryCard)}
        </div>
      )}
    </div>
  );
}