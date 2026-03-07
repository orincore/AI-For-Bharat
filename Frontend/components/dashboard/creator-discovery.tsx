'use client';

import React, { useState, useMemo } from 'react';
import { Users, TrendingUp, MessageSquare, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

type CategoryType = 'Travel' | 'Fitness' | 'Tech' | 'Fashion' | 'Beauty' | 'Food' | 'Gaming' | 'Music';

interface Creator {
  id: string;
  name: string;
  avatar: string;
  category: CategoryType;
  followers: number;
  engagementRate: number;
  bio: string;
}

const categoryColors: Record<CategoryType, string> = {
  Travel: 'bg-primary/10 text-primary border-primary/30',
  Fitness: 'bg-primary/10 text-primary border-primary/30',
  Tech: 'bg-primary/10 text-primary border-primary/30',
  Fashion: 'bg-primary/10 text-primary border-primary/30',
  Beauty: 'bg-primary/10 text-primary border-primary/30',
  Food: 'bg-primary/10 text-primary border-primary/30',
  Gaming: 'bg-primary/10 text-primary border-primary/30',
  Music: 'bg-primary/10 text-primary border-primary/30',
};

// Sample creator data
const sampleCreators: Creator[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    category: 'Travel',
    followers: 245000,
    engagementRate: 8.5,
    bio: 'Exploring the world one adventure at a time ✈️',
  },
  {
    id: '2',
    name: 'Maria Garcia',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    category: 'Fitness',
    followers: 189000,
    engagementRate: 12.3,
    bio: 'Fitness coach | Transforming lives through wellness 💪',
  },
  {
    id: '3',
    name: 'James Chen',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    category: 'Tech',
    followers: 342000,
    engagementRate: 9.7,
    bio: 'Tech enthusiast | Web dev | AI explorer 🚀',
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    category: 'Fashion',
    followers: 512000,
    engagementRate: 11.2,
    bio: 'Fashion designer | Style inspiration | Sustainable fashion 👗',
  },
  {
    id: '5',
    name: 'Sarah Lee',
    avatar: 'https://images.unsplash.com/photo-1517849845537-1d51a20414de?w=400&h=400&fit=crop',
    category: 'Beauty',
    followers: 428000,
    engagementRate: 13.8,
    bio: 'Makeup artist | Beauty tutorials | Skincare routine 💄',
  },
  {
    id: '6',
    name: 'David Martinez',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    category: 'Food',
    followers: 198000,
    engagementRate: 10.5,
    bio: 'Food blogger | Recipe creator | Culinary adventures 🍽️',
  },
  {
    id: '7',
    name: 'Lisa Anderson',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cdac4c112b8d?w=400&h=400&fit=crop',
    category: 'Gaming',
    followers: 567000,
    engagementRate: 15.2,
    bio: 'Esports player | Gaming content creator | Twitch streamer 🎮',
  },
  {
    id: '8',
    name: 'Marcus Thompson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    category: 'Music',
    followers: 289000,
    engagementRate: 14.1,
    bio: 'Producer | Music educator | Sharing my creative journey 🎵',
  },
];

export function CreatorDiscovery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [collaborations, setCollaborations] = useState<string[]>([]);

  const categories: (CategoryType | 'All')[] = ['All', 'Travel', 'Fitness', 'Tech', 'Fashion', 'Beauty', 'Food', 'Gaming', 'Music'];

  // Filter creators based on search and category
  const filteredCreators = useMemo(() => {
    return sampleCreators.filter((creator) => {
      const matchesSearch =
        creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.bio.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || creator.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleCollaborate = (creatorId: string, creatorName: string) => {
    if (collaborations.includes(creatorId)) {
      setCollaborations(collaborations.filter((id) => id !== creatorId));
      toast({
        title: 'Removed',
        description: `You removed your collaboration interest with ${creatorName}.`,
      });
    } else {
      setCollaborations([...collaborations, creatorId]);
      toast({
        title: 'Interest Sent!',
        description: `You've expressed interest to collaborate with ${creatorName}.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Discover Creators
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find and connect with creators for collaborations
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search creators by name or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-200 text-sm ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                  : 'bg-secondary text-foreground border border-border hover:border-primary/30 hover:bg-secondary/80'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Found {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
      </div>

      {/* Creator Grid */}
      {filteredCreators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCreators.map((creator) => (
            <div
              key={creator.id}
              className="group rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 flex flex-col"
            >
              {/* Avatar and Background */}
              <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-full h-full object-cover absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                {/* Avatar Circle */}
                <div className="flex justify-center -mt-12 mb-4 relative z-10">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-24 h-24 rounded-full border-4 border-card object-cover shadow-lg"
                  />
                </div>

                {/* Creator Info */}
                <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                  {creator.name}
                </h3>

                {/* Category Badge */}
                <div className="flex justify-center mb-3">
                  <Badge
                    variant="outline"
                    className={`${categoryColors[creator.category]} font-semibold`}
                  >
                    {creator.category}
                  </Badge>
                </div>

                {/* Bio */}
                <p className="text-xs text-muted-foreground text-center mb-4 line-clamp-2">
                  {creator.bio}
                </p>

                {/* Stats */}
                <div className="space-y-2 mb-5 pb-5 border-b border-border/50">
                  {/* Followers */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Followers</span>
                    </div>
                    <span className="text-foreground font-semibold">
                      {(creator.followers / 1000).toFixed(0)}K
                    </span>
                  </div>

                  {/* Engagement Rate */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>Engagement</span>
                    </div>
                    <span className="text-foreground font-semibold">
                      {creator.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Collaborate Button */}
                <Button
                  onClick={() => handleCollaborate(creator.id, creator.name)}
                  className={`w-full transition-all duration-200 ${
                    collaborations.includes(creator.id)
                      ? 'bg-primary/80 hover:bg-primary text-primary-foreground'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {collaborations.includes(creator.id) ? 'Interested' : 'Collaborate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-96 rounded-xl border border-border border-dashed bg-secondary/30">
          <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No creators found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Collaboration Interest Badge */}
      {collaborations.length > 0 && (
        <div className="fixed bottom-8 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-medium">{collaborations.length} collaboration interest{collaborations.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
}