import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion } from 'motion/react';

interface StickerPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: string) => void;
}

const STICKER_CATEGORIES = {
  'Emotions': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
    '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏',
    '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓'
  ],
  'Gestures': [
    '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '✊', '👊', '🤛', '🤜',
    '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍', '💅', '🤳', '💪', '🦾', '🦿',
    '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'
  ],
  'Animals': [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
    '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛',
    '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖'
  ],
  'Food': [
    '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭',
    '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕',
    '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
    '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'
  ],
  'Activities': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓',
    '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
    '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋', '🤼',
    '🤸', '🤺', '🤾', '🏌', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚴'
  ],
  'Objects': [
    '⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾',
    '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎', '📟',
    '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛',
    '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵'
  ],
  'Symbols': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣', '💕',
    '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮', '✝', '☪', '🕉', '☸',
    '✡', '🔯', '🕎', '☯', '☦', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌',
    '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛', '🉑', '☢', '☣'
  ],
  'Nature': [
    '🌍', '🌎', '🌏', '🌐', '🗺', '🗾', '🧭', '🏔', '⛰', '🌋', '🗻', '🏕',
    '🏖', '🏜', '🏝', '🏞', '🏟', '🏛', '🏗', '🧱', '🪨', '🪵', '🛖', '🏘',
    '🏚', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫',
    '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩'
  ]
};

export function StickerPicker({ open, onClose, onSelectSticker }: StickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Emotions');

  const handleSelectSticker = (sticker: string) => {
    onSelectSticker(sticker);
    onClose();
  };

  const filteredStickers = searchQuery
    ? Object.values(STICKER_CATEGORIES).flat().filter(sticker => sticker.includes(searchQuery))
    : STICKER_CATEGORIES[selectedCategory as keyof typeof STICKER_CATEGORIES];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-200 dark:border-blue-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose a Sticker 🎨
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Search stickers... 🔍"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-600 transition-colors"
          />

          {!searchQuery && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full flex-wrap h-auto bg-blue-100 dark:bg-gray-800">
                {Object.keys(STICKER_CATEGORIES).map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category} 
                    className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-[450px] overflow-y-auto p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
            {filteredStickers.map((sticker, index) => (
              <motion.div
                key={`${sticker}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01, duration: 0.2 }}
                whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  className="h-16 w-16 text-5xl hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-2xl transition-all shadow-sm hover:shadow-lg"
                  onClick={() => handleSelectSticker(sticker)}
                >
                  {sticker}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}