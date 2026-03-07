'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, Trash2, Edit2, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type PlatformType = 'Instagram' | 'LinkedIn' | 'Twitter' | 'YouTube';

interface ScheduledPost {
  id: string;
  platform: PlatformType;
  caption: string;
  scheduledDate: string;
  scheduledTime: string;
  createdAt: string;
  videoTitle?: string;
  videoDescription?: string;
  videoTags?: string;
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
  YouTube: {
    icon: <Youtube className="w-5 h-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/30',
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
  {
    id: '4',
    platform: 'YouTube',
    caption: 'NEW TUTORIAL: Building a Full-Stack App with React & Node.js - Complete Guide for Beginners! 🚀',
    scheduledDate: '2025-03-20',
    scheduledTime: '16:00',
    createdAt: 'Mar 6, 2025',
    videoTitle: 'Building a Full-Stack App with React & Node.js',
    videoDescription: 'Learn how to build a full-stack app with React and Node.js in this comprehensive tutorial.',
    videoTags: 'React, Node.js, Full-Stack, Tutorial',
  },
];

export function SchedulePost() {
  const [platform, setPlatform] = useState<PlatformType>('Instagram');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoTags, setVideoTags] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(sampleScheduledPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const userId = process.env.NEXT_PUBLIC_USER_ID || 'demo-user-123';

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      const response = await api.getScheduledPosts(userId);
      if (response.success && response.data.length > 0) {
        setScheduledPosts(response.data.map((post: any) => ({
          id: post.id,
          platform: post.platform.charAt(0).toUpperCase() + post.platform.slice(1) as PlatformType,
          caption: post.caption,
          scheduledDate: post.scheduledTime?.split('T')[0] || '',
          scheduledTime: post.scheduledTime?.split('T')[1]?.substring(0, 5) || '',
          createdAt: new Date(post.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          videoTitle: post.videoTitle,
          videoDescription: post.videoDescription,
          videoTags: post.videoTags,
        })));
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
    }
  };

  const handleSchedule = async () => {
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

    setLoading(true);
    try {
      const scheduledTime = `${date}T${time}:00.000Z`;
      
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('platform', platform.toLowerCase());
      formData.append('caption', caption);
      formData.append('scheduledTime', scheduledTime);
      if (videoTitle) formData.append('videoTitle', videoTitle);
      if (videoDescription) formData.append('videoDescription', videoDescription);
      if (videoTags) formData.append('videoTags', videoTags);

      const response = await api.createPost(formData);
      
      if (response.success) {
        await loadScheduledPosts();
        toast({
          title: editingId ? 'Updated!' : 'Scheduled!',
          description: editingId ? 'Your scheduled post has been updated.' : 'Your post has been scheduled successfully.',
        });
        handleClearForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to schedule post.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: ScheduledPost) => {
    setPlatform(post.platform);
    setCaption(post.caption);
    setDate(post.scheduledDate);
    setTime(post.scheduledTime);
    setEditingId(post.id);
  };

  const handleCancel = async (id: string) => {
    try {
      await api.deletePost(id);
      setScheduledPosts(scheduledPosts.filter((post) => post.id !== id));
      if (editingId === id) {
        handleClearForm();
      }
      toast({
        title: 'Cancelled',
        description: 'The scheduled post has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel post.',
      });
    }
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
            {platform === 'YouTube' ? 'Short Caption (for Shorts or Community posts)' : 'Caption Preview'}
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

        {/* YouTube-specific fields */}
        {platform === 'YouTube' && (
          <div className="mb-6 space-y-4 p-4 border border-border/40 rounded-lg bg-secondary/30">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Video Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter your video title"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Video Description
              </label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Describe your video content..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags / Keywords
              </label>
              <input
                type="text"
                value={videoTags}
                onChange={(e) => setVideoTags(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSchedule}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Scheduling...' : editingId ? 'Update Post' : 'Schedule Post'}
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