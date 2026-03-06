'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Send, Trash2, Edit2, Instagram, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

type PlatformType = 'Instagram' | 'LinkedIn' | 'Twitter';

interface ScheduledPost {
  id: string;
  platform: PlatformType;
  caption: string;
  scheduledDate: string;
  scheduledTime: string;
  createdAt: string;
}

const platformConfig: Record<PlatformType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  Instagram: {
    icon: <Instagram className="w-5 h-5" />,
    color: 'text-pink-400',
    bgColor: 'bg-primary/10 border-primary/30',
  },
  LinkedIn: {
    icon: <Linkedin className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-primary/10 border-primary/30',
  },
  Twitter: {
    icon: <Twitter className="w-5 h-5" />,
    color: 'text-sky-400',
    bgColor: 'bg-primary/10 border-primary/30',
  },
};

// Sample scheduled posts
const sampleScheduledPosts: ScheduledPost[] = [
  {
    id: '1',
    platform: 'Instagram',
    caption: 'Just wrapped up an amazing workshop on React performance optimization! Check out the slides in my latest blog post. 🎉',
    scheduledDate: '2025-03-15',
    scheduledTime: '10:00',
    createdAt: 'Mar 6, 2025',
  },
  {
    id: '2',
    platform: 'LinkedIn',
    caption: 'Excited to share that our team just launched a groundbreaking feature. This is just the beginning of what\'s to come!',
    scheduledDate: '2025-03-18',
    scheduledTime: '14:30',
    createdAt: 'Mar 6, 2025',
  },
  {
    id: '3',
    platform: 'Twitter',
    caption: 'Hot take: The future of web development is serverless. What do you think? #webdev #programming',
    scheduledDate: '2025-03-12',
    scheduledTime: '09:15',
    createdAt: 'Mar 5, 2025',
  },
];

export function SchedulePost() {
  const [platform, setPlatform] = useState<PlatformType>('Instagram');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(sampleScheduledPosts);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSchedule = () => {
    if (!caption.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a caption for your post.',
      });
      return;
    }

    if (!date || !time) {
      toast({
        title: 'Error',
        description: 'Please select a date and time.',
      });
      return;
    }

    if (editingId) {
      // Update existing post
      setScheduledPosts(
        scheduledPosts.map((post) =>
          post.id === editingId
            ? {
                ...post,
                platform,
                caption,
                scheduledDate: date,
                scheduledTime: time,
              }
            : post
        )
      );
      toast({
        title: 'Updated!',
        description: 'Your scheduled post has been updated.',
      });
      setEditingId(null);
    } else {
      // Create new post
      const newPost: ScheduledPost = {
        id: Date.now().toString(),
        platform,
        caption,
        scheduledDate: date,
        scheduledTime: time,
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      setScheduledPosts([newPost, ...scheduledPosts]);
      toast({
        title: 'Scheduled!',
        description: 'Your post has been scheduled successfully.',
      });
    }

    // Reset form
    setCaption('');
    setDate('');
    setTime('');
  };

  const handleEdit = (post: ScheduledPost) => {
    setPlatform(post.platform);
    setCaption(post.caption);
    setDate(post.scheduledDate);
    setTime(post.scheduledTime);
    setEditingId(post.id);
  };

  const handleCancel = (id: string) => {
    setScheduledPosts(scheduledPosts.filter((post) => post.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setCaption('');
      setDate('');
      setTime('');
      setPlatform('Instagram');
    }
    toast({
      title: 'Cancelled',
      description: 'The scheduled post has been removed.',
    });
  };

  const handleClearForm = () => {
    setCaption('');
    setDate('');
    setTime('');
    setPlatform('Instagram');
    setEditingId(null);
  };

  const formatScheduledDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Schedule Post
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan and schedule your social media posts in advance
        </p>
      </div>

      {/* Main Scheduling Card */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
          {editingId ? 'Edit Scheduled Post' : 'Schedule a New Post'}
        </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Platform Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Platform
            </label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(platformConfig) as PlatformType[]).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatform(plat)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    platform === plat
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                      : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                  }`}
                >
                  {platformConfig[plat].icon}
                  <span className="hidden sm:inline">{plat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Caption Textarea */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Caption Preview
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write your caption here... (max 2200 characters)"
            maxLength={2200}
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            {caption.length}/2200 characters
          </div>
        </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSchedule}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2"
              >
                <Send className="w-4 h-4 mr-2" />
                {editingId ? 'Update Post' : 'Schedule Post'}
              </Button>
              {editingId && (
                <Button
                  onClick={handleClearForm}
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Posts List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Scheduled Posts ({scheduledPosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  className="group rounded-xl border border-border bg-secondary/30 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left Content */}
                    <div className="flex-1 min-w-0">
                      {/* Platform Badge and DateTime */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {platformConfig[post.platform].icon}
                        </div>
                        <div>
                          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                            {post.platform}
                          </Badge>
                        </div>
                        <div className="text-sm text-foreground font-medium">
                          {formatScheduledDateTime(post.scheduledDate, post.scheduledTime)}
                        </div>
                      </div>

                      {/* Caption Preview */}
                      <p className="text-foreground text-sm line-clamp-2">
                        {post.caption}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post)}
                        className="border-border text-foreground hover:bg-secondary flex-1 sm:flex-none"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(post.id)}
                        className="border-border/60 text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-48 rounded-xl border border-border border-dashed bg-secondary/30">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  No scheduled posts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your first scheduled post above
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}