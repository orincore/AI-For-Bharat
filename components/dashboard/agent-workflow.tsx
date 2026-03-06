'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  BarChart3,
  Brain,
  Zap,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const workflowSteps = [
  { id: 1, label: 'Observe', icon: Eye, description: 'Monitor content and audience' },
  { id: 2, label: 'Analyze', icon: BarChart3, description: 'Process data patterns' },
  { id: 3, label: 'Decide', icon: Brain, description: 'Generate recommendations' },
  { id: 4, label: 'Act', icon: Zap, description: 'Execute actions' },
  { id: 5, label: 'Learn', icon: BookOpen, description: 'Optimize strategies' },
];

const activityLog = [
  '✔ Reel uploaded',
  '✔ Content analyzed',
  '✔ Captions generated',
  '✔ Best posting time predicted',
  '✔ Post scheduled',
  '✔ Comments auto-replied',
];

export function AgentWorkflow() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Workflow Pipeline */}
      <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardContent className="py-8">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx < 3; // simulate active steps

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 mb-3 ${
                      isActive
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{
                          repeat: Infinity,
                          repeatType: 'loop',
                          duration: 1.5,
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <h3
                    className={`text-xs font-semibold text-center ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </h3>

                  {/* Description */}
                  <p className="text-[10px] text-muted-foreground text-center mt-1 line-clamp-2">
                    {step.description}
                  </p>

                  {/* Connector Line */}
                  {idx < workflowSteps.length - 1 && (
                    <motion.div
                      className={`hidden md:block h-0.5 flex-1 mx-2 mt-6 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-primary/30'
                          : 'bg-border'
                      }`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: idx * 0.1 + 0.2, duration: 0.4 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-foreground">Live Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activityLog.map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{activity.replace('✔ ', '')}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
