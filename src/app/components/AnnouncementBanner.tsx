import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { X, Megaphone } from 'lucide-react';
import { useBlur } from '../contexts/BlurContext';

interface AnnouncementBannerProps {
  id: string;
  title: string;
  description: string;
  buttonText?: string;
  onDismiss: () => void;
}

export function AnnouncementBanner({ id, title, description, buttonText = "Got it!", onDismiss }: AnnouncementBannerProps) {
  const { blurStrength } = useBlur();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-2 md:px-4 py-4 bg-black/50"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: `blur(${blurStrength}px)`,
            WebkitBackdropFilter: `blur(${blurStrength}px)`,
          }}
        >
          <div className="p-2 md:p-6 dark:bg-gray-800/95 dark:text-white flex-1 overflow-y-auto">
            <div className="flex items-start gap-2 md:gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="p-2 md:p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Megaphone className="size-4 md:size-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-2xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{description}</p>
              </div>
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="icon"
                className="flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="mt-4 md:mt-6 flex justify-end">
              <Button
                onClick={onDismiss}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}