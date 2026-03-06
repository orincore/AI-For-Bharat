'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Waveform, Sparkles, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function VoiceCommands() {
  const [recording, setRecording] = useState(false);

  const toggleRecording = () => {
    setRecording((r) => !r);
  };

  const waveformBars = Array.from({ length: 5 });

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Page Title Section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Voice Commands</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control SocialOS using WhatsApp-style voice commands.
        </p>
      </div>

      {/* Main Card */}
      <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-foreground">Speak a command</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center">
          {/* Microphone button */}
          <button
            onClick={toggleRecording}
            className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <Mic className="w-8 h-8 text-primary-foreground" />
            {/* waveform overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {waveformBars.map((_, idx) => (
                <motion.div
                  key={idx}
                  className="mx-0.5 w-1 bg-primary-foreground"
                  animate={{
                    height: recording ? ['20%', '100%', '20%'] : '20%',
                    opacity: recording ? [0.5, 1, 0.5] : 0.5,
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'loop',
                    duration: 0.6,
                    delay: idx * 0.1,
                  }}
                />
              ))}
            </div>
          </button>

          {/* Transcript */}
          <div className="w-full bg-secondary border border-border rounded-lg p-4">
            <p className="text-sm text-foreground">
              "Post my Bali reel to Instagram tomorrow at 6 PM"
            </p>
          </div>

          {/* AI Action Detection preview */}
          <Card className="w-full border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Detected Action</h3>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Platform:</span> Instagram
                </p>
                <p>
                  <span className="font-medium text-foreground">Content:</span> Bali Reel
                </p>
                <p>
                  <span className="font-medium text-foreground">Schedule:</span> Tomorrow 6 PM
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Execute button */}
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send className="w-4 h-4 mr-2" /> Execute with Orin AI
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
