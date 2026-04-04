import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, Megaphone } from 'lucide-react';

interface AnnouncementBannerProps {
  id: string;
  title: string;
  description: string;
  onDismiss: () => void;
}

export function AnnouncementBanner({ id, title, description, onDismiss }: AnnouncementBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Megaphone className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-1">{title}</h3>
              <p className="text-sm opacity-90 whitespace-pre-wrap">{description}</p>
            </div>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 text-white hover:bg-white/20"
            >
              OK
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
