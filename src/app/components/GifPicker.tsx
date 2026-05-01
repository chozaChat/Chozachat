import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion } from 'motion/react';
import { Send } from 'lucide-react';

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

export function GifPicker({ open, onClose, onSelectGif }: GifPickerProps) {
  const [gifUrl, setGifUrl] = useState('');

  const handleSend = () => {
    if (!gifUrl.trim()) return;

    // Validate URL format
    try {
      new URL(gifUrl);
      onSelectGif(gifUrl);
      setGifUrl('');
      onClose();
    } catch {
      alert('Please enter a valid URL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 border-2 border-purple-200 dark:border-purple-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add GIF 🎬
          </DialogTitle>
          <DialogDescription>
            Paste a GIF URL from Tenor, GIPHY, or any other source
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="https://media.tenor.com/..."
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              className="w-full border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-600 transition-colors"
            />
          </div>

          {gifUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
            >
              <img
                src={gifUrl}
                alt="GIF preview"
                className="w-full h-auto max-h-96 object-contain"
                onError={() => setGifUrl('')}
              />
            </motion.div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setGifUrl('');
                onClose();
              }}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!gifUrl.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50"
            >
              <Send className="size-4" />
              Send GIF
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>💡 <strong>Tip:</strong> To find GIFs:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Visit <a href="https://tenor.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 underline">tenor.com</a></li>
              <li>Search for your favorite GIF</li>
              <li>Right-click on the GIF and select "Copy image address"</li>
              <li>Paste the URL here</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
