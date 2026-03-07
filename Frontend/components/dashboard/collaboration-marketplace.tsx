'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Globe } from 'lucide-react';

interface Campaign {
  id: string;
  brand: string;
  logo: string;
  title: string;
  description: string;
  budget: string;
  platforms: string[];
  category: string;
}

const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    brand: 'TravelX',
    logo: 'https://via.placeholder.com/40',
    title: 'Bali Resort Promotion',
    description: 'Promote a luxury resort in Bali with stunning visuals and stories.',
    budget: '$1500',
    platforms: ['Instagram', 'YouTube'],
    category: 'Travel',
  },
  {
    id: '2',
    brand: 'TechNova',
    logo: 'https://via.placeholder.com/40',
    title: 'New Smartphone Launch',
    description: 'Highlight features of the latest TechNova phone.',
    budget: '$2000',
    platforms: ['Instagram'],
    category: 'Tech',
  },
  {
    id: '3',
    brand: 'StyleHub',
    logo: 'https://via.placeholder.com/40',
    title: 'Fall Fashion Line',
    description: 'Show off the new autumn collection.',
    budget: '$1200',
    platforms: ['Instagram', 'YouTube'],
    category: 'Fashion',
  },
];

export function CollaborationMarketplace() {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', 'Travel', 'Tech', 'Lifestyle', 'Fashion'];

  const filtered = useMemo(() => {
    if (filter === 'All') return sampleCampaigns;
    return sampleCampaigns.filter((c) => c.category === filter);
  }, [filter]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collaboration Marketplace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find brand partnerships and creator collaborations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === cat
                ? 'bg-primary text-primary-foreground ring-2 ring-primary/50'
                : 'bg-secondary text-foreground border border-border hover:bg-secondary/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Campaign grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={c.logo} alt={c.brand} className="w-10 h-10 rounded-full" />
                <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-foreground">Budget:</span>
                <span className="font-medium text-foreground">{c.budget}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.platforms.map((p) => (
                  <span
                    key={p}
                    className="inline-block px-2 py-1 rounded-full bg-secondary text-foreground text-xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Apply
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
