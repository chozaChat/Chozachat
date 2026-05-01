import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Reply, Pencil, X, Smile, Send, Paperclip } from 'lucide-react';
import { RefObject } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  senderId: string;
  text?: string;
  content?: string;
  timestamp: string;
}

interface MessageInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  setEditMessageText: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEdit: () => void;
  onStickerClick: () => void;
  onAttachClick?: () => void;
  getSenderName: (id: string) => string;
  messageInputRef: RefObject<HTMLInputElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function MessageInput({
  messageText,
  setMessageText,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  setEditMessageText,
  onSubmit,
  onEdit,
  onStickerClick,
  onAttachClick,
  getSenderName,
  messageInputRef,
  messagesEndRef
}: MessageInputProps) {
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMessage) {
      onEdit();
    } else {
      onSubmit(e);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditMessageText("");
    setMessageText("");
  };

  return (
    <div className="space-y-2">
      {/* Reply indicator */}
      {replyingTo && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 px-3 py-2 rounded"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <Reply className="size-3" />
              Replying to {getSenderName(replyingTo.senderId)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {replyingTo.content || replyingTo.text}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6 hover:bg-blue-100 dark:hover:bg-blue-800"
            onClick={() => setReplyingTo(null)}
          >
            <X className="size-4" />
          </Button>
        </motion.div>
      )}
      
      {/* Edit indicator */}
      {editingMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 px-3 py-2 rounded"
        >
          <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
            <Pencil className="size-3" />
            Editing message
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6 hover:bg-yellow-100 dark:hover:bg-yellow-800"
            onClick={cancelEdit}
          >
            <X className="size-4" />
          </Button>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onStickerClick}
            className="hover:bg-gradient-to-br hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/40 dark:hover:to-orange-900/40 transition-all"
          >
            <Smile className="size-5" />
          </Button>
        </motion.div>
        <Input
          ref={messageInputRef}
          type="text"
          placeholder={editingMessage ? t('message.editMessage') : t('message.typeMessage')}
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            // Also update editMessageText when editing
            if (editingMessage) {
              setEditMessageText(e.target.value);
            }
          }}
          onFocus={() => {
            // Only scroll to bottom on focus if user is near bottom (for mobile keyboard)
            const scrollViewport = messagesEndRef.current?.parentElement?.parentElement;
            if (scrollViewport && scrollViewport.hasAttribute('data-radix-scroll-area-viewport')) {
              const isNearBottom = scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < 200;
              if (isNearBottom) {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                }, 300); // Delay to account for keyboard animation
              }
            }
          }}
          className="flex-1 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-600 rounded-full px-4 transition-all shadow-sm focus:shadow-md"
        />
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button 
            type="submit" 
            size="icon"
            className={`shadow-md hover:shadow-lg transition-all rounded-full ${
              editingMessage 
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
                : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            }`}
          >
            {editingMessage ? <Pencil className="size-5" /> : <Send className="size-5" />}
          </Button>
        </motion.div>
        {onAttachClick && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onAttachClick}
              className="hover:bg-gradient-to-br hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/40 dark:hover:to-orange-900/40 transition-all"
            >
              <Paperclip className="size-5" />
            </Button>
          </motion.div>
        )}
      </form>
    </div>
  );
}