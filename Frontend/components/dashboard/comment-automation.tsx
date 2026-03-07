'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Check, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CommentAutomation() {
  // sample data
  const comments = [
    {
      id: '1',
      avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop',
      username: '@travelgirl',
      comment: 'Where is this location? Looks amazing!',
      reply:
        "It's Ubud, Bali! One of my favorite places. Highly recommend visiting during sunset.",
      confidence: 92,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Automated Comment Replies
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI suggests replies to audience comments.
        </p>
      </div>

      <div className="space-y-4">
        {comments.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardContent className="space-y-4">
                {/* user info */}
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar}
                    alt={c.username}
                    className="w-10 h-10 rounded-full border border-border"
                  />
                  <span className="text-foreground font-medium">
                    {c.username}
                  </span>
                </div>

                {/* comment text */}
                <p className="text-foreground">{c.comment}</p>

                {/* AI suggestion */}
                <div className="bg-secondary border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      AI Suggested Reply
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{c.reply}</p>
                </div>

                {/* confidence bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      AI Confidence
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {c.confidence}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                      style={{ width: `${c.confidence}%` }}
                    />
                  </div>
                </div>

                {/* action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-primary/10 text-primary hover:bg-primary/20">
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button className="bg-secondary text-foreground hover:bg-secondary/80">
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <MessageCircle className="w-4 h-4 mr-1" /> Send Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
