'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Clock, MessageSquare, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Service {
  id: string;
  name: string;
  status: string;
  icon: React.ReactNode;
}

const services: Service[] = [
  {
    id: '1',
    name: 'Orin AI Engine',
    status: 'Online',
    icon: <Brain className="w-5 h-5 text-primary" />,
  },
  {
    id: '2',
    name: 'Caption Generator',
    status: 'Running',
    icon: <Zap className="w-5 h-5 text-primary" />,
  },
  {
    id: '3',
    name: 'Scheduling Agent',
    status: 'Active',
    icon: <Clock className="w-5 h-5 text-primary" />,
  },
  {
    id: '4',
    name: 'Comment Automation',
    status: 'Monitoring',
    icon: <MessageSquare className="w-5 h-5 text-primary" />,
  },
  {
    id: '5',
    name: 'Creator Matching Engine',
    status: 'Scanning',
    icon: <Users className="w-5 h-5 text-primary" />,
  },
];

export function AISystemStatus() {
  return (
    <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-foreground">AI System Status</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational health of Orin AI services
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200"
            >
              {/* Left: Icon + Service Name */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  {service.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{service.name}</span>
              </div>

              {/* Right: Status Indicator + Status Text */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'loop',
                    duration: 2,
                    ease: 'easeInOut',
                  }}
                />
                <span className="text-xs font-semibold text-primary">{service.status}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* System Health Footer */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">
              All systems operational
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
