import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Reply, Pencil, Trash2, Sparkles, User, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

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

interface UserProfile {
  id: string;
  name: string;
  username: string;
  emoji?: string;
  verified?: boolean;
  tag?: string;
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
  getSenderSubscription: (id: string) => { tier: 'boost' | 'ultra' | null, customGradient?: string, tagGradient?: string, expiresAt?: string } | null;
  renderVerifiedBadge: () => JSX.Element;
  renderTagBadge: (tag: string, isAdmin: boolean, color: string, subscription?: { tier: 'boost' | 'ultra' | null, customGradient?: string, tagGradient?: string, expiresAt?: string }) => JSX.Element | null;
  onReply: (message: Message) => void;
  onEdit: (message: Message, content: string) => void;
  onDelete: (messageId: string) => void;
  isRead?: boolean;
  availableUsers?: UserProfile[];
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
  getSenderSubscription,
  renderVerifiedBadge,
  renderTagBadge,
  onReply,
  onEdit,
  onDelete,
  isRead = false,
  availableUsers = []
}: MessageItemProps) {
  const getNameStyle = (senderId: string) => {
    const subscription = getSenderSubscription(senderId);
    if (!subscription?.tier) return {};

    if (subscription.tier === 'ultra' && subscription.customGradient) {
      return { backgroundImage: subscription.customGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
    } else if (subscription.tier === 'ultra') {
      return { backgroundImage: 'linear-gradient(to right, #ec4899, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
    } else if (subscription.tier === 'boost') {
      return { backgroundImage: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
    }
    return {};
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [stickerMenuOpen, setStickerMenuOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const stickerMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const messageContent = message.content || message.text || '';

  const handleUserTagClick = (username: string) => {
    const user = availableUsers.find(u => u.username === username);
    if (user) {
      setSelectedUserProfile(user);
      setUserProfileOpen(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stickerMenuRef.current && !stickerMenuRef.current.contains(event.target as Node)) {
        setStickerMenuOpen(false);
      }
    };

    if (stickerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [stickerMenuOpen]);

  // Check if message is only a sticker (single emoji)
  const isOnlySticker = (text: string) => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
    return emojiRegex.test(text.trim());
  };

  // Check if message is an image URL
  const isImageUrl = (text: string) => {
    try {
      const url = new URL(text.trim());
      return /\.(png|jpg|jpeg|gif|webp)$/i.test(url.pathname) || url.hostname.includes('tenor.com') || url.hostname.includes('giphy.com');
    } catch {
      return false;
    }
  };

  const isStickerMessage = isOnlySticker(messageContent);
  const isImageMessage = isImageUrl(messageContent);

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
                    <span className="text-sm">{getSenderEmoji(message.senderId)}</span>
                  )}
                  <span style={getNameStyle(message.senderId)} className="font-semibold">{getSenderName(message.senderId)}</span>
                  {getSenderIsVerified(message.senderId) && renderVerifiedBadge()}
                  {renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId), getSenderSubscription(message.senderId) || undefined)}
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
      ) : isImageMessage ? (
        // Image/GIF message
        <motion.div
          className="flex flex-col items-center gap-1"
          whileHover={{ scale: 1.02 }}
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
                    <span className="text-sm">{getSenderEmoji(message.senderId)}</span>
                  )}
                  <span style={getNameStyle(message.senderId)} className="font-semibold">{getSenderName(message.senderId)}</span>
                  {getSenderIsVerified(message.senderId) && renderVerifiedBadge()}
                  {renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId), getSenderSubscription(message.senderId) || undefined)}
                </>
              )}
            </div>
          )}
          <div className="relative">
            <div
              className="rounded-lg overflow-hidden max-w-xs sm:max-w-sm cursor-pointer"
              onClick={() => setStickerMenuOpen(!stickerMenuOpen)}
            >
              <img
                src={messageContent}
                alt="Sticker"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>

            {stickerMenuOpen && (
              <motion.div
                ref={stickerMenuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-10 min-w-[150px]"
              >
                {isOwn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDelete(message.id);
                      setStickerMenuOpen(false);
                    }}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="size-4 mr-2" />
                    {t('sticker.delete')}
                  </Button>
                )}
              </motion.div>
            )}
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
        <div className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Profile emoji avatar for group/channel/news messages */}
          {!isOwn && (chatType === 'group' || chatType === 'news' || chatType === 'channel') && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-lg shadow-sm">
              {isAI ? (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
                  <Sparkles className="size-4 text-white" />
                </div>
              ) : (
                <span>{getSenderEmoji(message.senderId) || '👤'}</span>
              )}
            </div>
          )}

          <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative group`}>
            {!isOwn && (chatType === 'group' || chatType === 'news' || chatType === 'channel' || chatType === 'ai') && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1 px-3 flex-wrap">
                {isAI ? (
                  <span className="font-semibold">AI Assistant</span>
                ) : (
                  <>
                    <span style={getNameStyle(message.senderId)} className="font-semibold">{getSenderName(message.senderId)}</span>
                    {getSenderIsVerified(message.senderId) && renderVerifiedBadge()}
                    {renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId), getSenderSubscription(message.senderId) || undefined)}
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
            <div className="break-words whitespace-pre-wrap">
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
                // Format user tags
                messageContent.split(/(@\w+)/g).map((part, i) => {
                  if (part.startsWith('@')) {
                    const username = part.slice(1);
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserTagClick(username);
                        }}
                      >
                        @{username}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })
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
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-3 flex items-center gap-1.5">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
            {message.edited && <span className="ml-1 italic opacity-75">({t('message.edited')})</span>}
          </div>
          </div>
        </div>
      )}

      {/* User Profile Dialog */}
      <Dialog open={userProfileOpen} onOpenChange={setUserProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('tag.viewProfile')}</DialogTitle>
          </DialogHeader>
          {selectedUserProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-3xl shadow-lg">
                  {selectedUserProfile.emoji ? <span>{selectedUserProfile.emoji}</span> : <User className="size-8" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold dark:text-white">{selectedUserProfile.name}</h3>
                    {selectedUserProfile.verified && renderVerifiedBadge()}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{selectedUserProfile.username}</p>
                  {selectedUserProfile.tag && (
                    <div className="mt-1">
                      {renderTagBadge(selectedUserProfile.tag, false, '#3B82F6')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    navigate(`/u/${selectedUserProfile.username}`);
                    setUserProfileOpen(false);
                  }}
                >
                  <User className="size-4 mr-2" />
                  {t('tag.viewProfile')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Navigate to DM with this user
                    setUserProfileOpen(false);
                  }}
                >
                  <MessageCircle className="size-4 mr-2" />
                  {t('tag.sendMessage')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}