'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Trash2, Heart, MessageCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

type PlatformType = 'Instagram' | 'LinkedIn' | 'Twitter' | 'YouTube';

interface ContentItem {
  id: string;
  caption: string;
  thumbnail: string;
  platform: PlatformType;
  likes: number;
  comments: number;
  createdAt: string;
}

const platformColors: Record<PlatformType, string> = {
  Instagram: 'bg-primary/10 text-primary border-primary/30',
  LinkedIn: 'bg-primary/10 text-primary border-primary/30',
  Twitter: 'bg-primary/10 text-primary border-primary/30',
  YouTube: 'bg-red-500/10 text-red-500 border-red-500/30',
};

// Sample data for demonstration
const sampleContent: ContentItem[] = [
  {
    id: '1',
    caption: 'Just launched my new course on web development! Join thousands of students learning React and Next.js. Link in bio 🚀',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    platform: 'Instagram',
    likes: 2450,
    comments: 128,
    createdAt: 'Mar 5, 2025',
  },
  {
    id: '2',
    caption: 'Excited to announce my new role as Senior Developer at TechCorp! Looking forward to building amazing products with an incredible team.',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    platform: 'LinkedIn',
    likes: 1203,
    comments: 47,
    createdAt: 'Mar 4, 2025',
  },
  {
    id: '3',
    caption: 'The future of web development is here. AI-powered code generation is changing how we build. What are your thoughts? #WebDev #AI',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=400&fit=crop',
    platform: 'Twitter',
    likes: 3890,
    comments: 256,
    createdAt: 'Mar 3, 2025',
  },
  {
    id: '4',
    caption: 'Behind the scenes of our latest product launch. Thanks to everyone who made this possible! 🙏',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    platform: 'Instagram',
    likes: 1567,
    comments: 89,
    createdAt: 'Mar 2, 2025',
  },
  {
    id: '5',
    caption: 'Just hit 100K followers! Thank you all for the support and engagement. This journey has been amazing.',
    thumbnail: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=400&fit=crop',
    platform: 'Instagram',
    likes: 5234,
    comments: 342,
    createdAt: 'Mar 1, 2025',
  },
  {
    id: '6',
    caption: 'Check out my latest blog post on building scalable web applications. The full article is on my website.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    platform: 'LinkedIn',
    likes: 892,
    comments: 56,
    createdAt: 'Feb 28, 2025',
  },
  {
    id: '7',
    caption: 'NEW VIDEO: Complete React Tutorial for Beginners! 🚀 Learn everything you need to know to get started with React development.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    platform: 'YouTube',
    likes: 8450,
    comments: 523,
    createdAt: 'Feb 27, 2025',
  },
];

export function ContentLibrary() {
  const [content, setContent] = useState<ContentItem[]>(sampleContent);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const userId = process.env.NEXT_PUBLIC_USER_ID || 'demo-user-123';

  useEffect(() => {
    loadContentLibrary();
  }, []);

  const loadContentLibrary = async () => {
    setLoading(true);
    try {
      const response = await api.getContentLibrary(userId);
      if (response.success && response.data.length > 0) {
        setContent(response.data.map((item: any) => ({
          id: item.id,
          caption: item.caption,
          thumbnail: item.thumbnail,
          platform: item.platform.charAt(0).toUpperCase() + item.platform.slice(1) as PlatformType,
          likes: item.likes,
          comments: item.comments,
          createdAt: new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        })));
      }
    } catch (error) {
      console.error('Error loading content library:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncContent = async (platform: string) => {
    setLoading(true);
    try {
      await api.syncContentLibrary(userId, platform.toLowerCase());
      await loadContentLibrary();
      toast({
        title: 'Synced!',
        description: `${platform} content has been synced.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync content.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCaption = (caption: string, id: string) => {
    navigator.clipboard.writeText(caption);
    toast({
      title: 'Copied!',
      description: 'Caption copied to clipboard.',
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContent(id);
      setContent(content.filter((item) => item.id !== id));
      toast({
        title: 'Deleted',
        description: 'Content has been removed from your library.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete content.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Content Library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and organize your social media posts
          </p>
        </div>
        <Button
          onClick={() => loadContentLibrary()}
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Content Count */}
      <div className="text-sm text-muted-foreground">
        {content.length} {content.length === 1 ? 'post' : 'posts'} in library
      </div>

      {/* Grid Layout */}
      {content.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-secondary aspect-square">
                <img
                  src={item.thumbnail}
                  alt="Content thumbnail"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

                {/* Platform Badge */}
                <div className="absolute top-3 right-3">
                  <Badge
                    variant="outline"
                    className={`${platformColors[item.platform]} font-semibold`}
                  >
                    {item.platform}
                  </Badge>
                </div>
              </div>

              {/* Caption Section */}
              <div className="p-4 bg-card/50 backdrop-blur-sm">
                <p className="text-sm text-foreground line-clamp-3 mb-4">
                  {item.caption}
                </p>

                {/* Engagement Stats */}
                <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground pb-4 border-b border-border/50">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span>{item.likes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>{item.comments.toLocaleString()}</span>
                  </div>
                  <div className="ml-auto text-muted-foreground">{item.createdAt}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-border text-foreground hover:bg-secondary"
                    onClick={() => handleCopyCaption(item.caption, item.id)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border/60 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-96 rounded-xl border border-border border-dashed bg-secondary/30">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No content yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Start creating and managing your social media posts
          </p>
        </div>
      )}
    </div>
  );
}