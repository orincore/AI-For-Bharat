'use client';

import React, { useState } from 'react';
import { Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const platforms = [
  { name: 'Instagram', icon: <Instagram className="w-5 h-5 text-primary" /> },
  { name: 'Twitter', icon: <Twitter className="w-5 h-5 text-primary" /> },
  { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5 text-primary" /> },
  { name: 'YouTube', icon: <Youtube className="w-5 h-5 text-primary" /> },
];

export function AliasSettings() {
  const [aliases, setAliases] = useState({
    Instagram: '@ig_orincore',
    Twitter: '@orincore_tweet',
    LinkedIn: '@li_orincore',
    YouTube: '',
  });

  const handleChange = (platform: string, value: string) => {
    setAliases((prev) => ({ ...prev, [platform]: value }));
  };

  const handleSave = (platform: string) => {
    // stub: could call API
    console.log('save', platform, aliases[platform]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Aliasing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create platform-specific aliases for automated posting.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="space-y-4">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex items-center gap-2 w-full sm:w-1/4">
                {p.icon}
                <span className="text-foreground font-medium">{p.name}</span>
              </div>
              <Input
                value={aliases[p.name as keyof typeof aliases]}
                onChange={(e) => handleChange(p.name, e.target.value)}
                className="w-full sm:w-2/4 bg-secondary border-border text-foreground placeholder-muted-foreground"
                placeholder="Enter alias..."
              />
              <Button
                onClick={() => handleSave(p.name)}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alias Preview */}
      <Card className="border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-foreground">Alias Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(aliases).map(([plat, alias]) => (
            alias && (
              <div key={plat} className="text-sm text-foreground">
                {alias} &rarr; {plat} post
              </div>
            )
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
