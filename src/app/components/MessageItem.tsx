import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Reply, Pencil, Trash2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  text?: string;
  content?: string;
  timestamp: string;
  edited?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isAI: boolean;
  chatType: 'friend' | 'group' | 'news' | 'channel' | 'ai';
  getSenderName: (id: string) => string;
  getSenderEmoji: (id: string) => string;
  getSenderIsVerified: (id: string) => boolean;
  getSenderTag: (id: string) => string;
  getSenderIsAdmin: (data: any) => boolean;
  getSenderTagColor: (id: string) => string;
  renderVerifiedBadge: () => JSX.Element;
  renderTagBadge: (tag: string, isAdmin: boolean, color: string) => JSX.Element | null;
  onReply: (message: Message) => void;
  onEdit: (message: Message, content: string) => void;
  onDelete: (messageId: string) => void;
}

export function MessageItem({
  message,
  isOwn,
  isAI,
  chatType,
  getSenderName,
  getSenderEmoji,
  getSenderIsVerified,
  getSenderTag,
  getSenderIsAdmin,
  getSenderTagColor,
  renderVerifiedBadge,
  renderTagBadge,
  onReply,
  onEdit,
  onDelete
}: MessageItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const messageContent = message.content || message.text || '';
  
  // Check if message is only a sticker (single emoji)
  const isOnlySticker = (text: string) => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
    return emojiRegex.test(text.trim());
  };
  
  const isStickerMessage = isOnlySticker(messageContent);

  return (
    <>
      {isStickerMessage ? (
        // Sticker message - BIG and without background
        <motion.div
          className="flex flex-col items-center gap-1"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {!isOwn && (chatType === 'group' || chatType === 'news' || chatType === 'ai') && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              {isAI ? (
                <>
                  <div className="flex items-center justify-center w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
                    <Sparkles className="size-2.5 text-white" />
                  </div>
                  <span className="font-semibold">AI Assistant</span>
                </>
              ) : (
                <>
                  {getSenderEmoji(message.senderId) && (
                    <span key="emoji" className="text-sm">{getSenderEmoji(message.senderId)}</span>
                  )}
                  <span key="name">{getSenderName(message.senderId)}</span>
                  {getSenderIsVerified(message.senderId) && <span key="verified">{renderVerifiedBadge()}</span>}
                  {renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId)) && <span key="tag">{renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId))}</span>}
                </>
              )}
            </div>
          )}
          <div className="text-7xl md:text-8xl leading-none animate-bounce-subtle">
            {messageContent}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </motion.div>
      ) : (
        // Regular message with bubble
        <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative group`}>
          {!isOwn && (chatType === 'group' || chatType === 'news' || chatType === 'ai') && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1 px-3 flex-wrap">
              {isAI ? (
                <>
                  <div className="flex items-center justify-center w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
                    <Sparkles className="size-2.5 text-white" />
                  </div>
                  <span className="font-semibold">AI Assistant</span>
                </>
              ) : (
                <>
                  {getSenderEmoji(message.senderId) && (
                    <span key="emoji" className="text-sm">{getSenderEmoji(message.senderId)}</span>
                  )}
                  <span key="name">{getSenderName(message.senderId)}</span>
                  {getSenderIsVerified(message.senderId) && <span key="verified">{renderVerifiedBadge()}</span>}
                  {renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId)) && <span key="tag">{renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId))}</span>}
                </>
              )}
            </div>
          )}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => !isAI && setMenuOpen(!menuOpen)}
            className={`px-4 py-2 rounded-2xl shadow-md transition-all ${!isAI ? 'cursor-pointer' : ''} ${
              isOwn
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm hover:shadow-lg'
                : 'bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-white rounded-bl-sm hover:shadow-lg'
            }`}
          >
            {/* Reply preview */}
            {message.replyTo && (
              <div className={`mb-2 pb-2 border-l-2 pl-2 text-xs opacity-75 ${isOwn ? 'border-blue-300' : 'border-gray-400 dark:border-gray-500'}`}>
                <div className="font-semibold">{message.replyTo.senderName}</div>
                <div className="truncate">{message.replyTo.content}</div>
              </div>
            )}
            <div className="break-words">
              {isAI && !messageContent ? (
                <span className="animate-shimmer font-semibold">Generating response...</span>
              ) : isAI ? (
                // Format markdown for AI responses
                messageContent.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                  } else if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={i}>{part.slice(1, -1)}</em>;
                  }
                  return <span key={i}>{part}</span>;
                })
              ) : (
                messageContent
              )}
            </div>
          </motion.div>
          
          {/* Message context menu */}
          {menuOpen && !isAI && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute top-full mt-1 ${isOwn ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-10 min-w-[120px]`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                  setMenuOpen(false);
                }}
              >
                <Reply className="size-4" />
                Reply
              </Button>
              {isOwn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(message, messageContent);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(message.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </>
              )}
            </motion.div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-3">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {message.edited && <span className="ml-1 italic opacity-75">(edited)</span>}
          </div>
        </div>
      )}
    </>
  );
}