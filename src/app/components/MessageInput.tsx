import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Reply, Pencil, X, Smile, Send, Paperclip, Film, User } from 'lucide-react';
import { RefObject, useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  senderId: string;
  text?: string;
  content?: string;
  timestamp: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  emoji?: string;
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
  onGifClick?: () => void;
  onAttachClick?: () => void;
  getSenderName: (id: string) => string;
  messageInputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>;
  messagesEndRef: RefObject<HTMLDivElement>;
  availableUsers?: User[];
}

interface Command {
  name: string;
  description: string;
  icon: string;
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
  onGifClick,
  onAttachClick,
  getSenderName,
  messageInputRef,
  messagesEndRef,
  availableUsers = []
}: MessageInputProps) {
  const { t, language } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'users' | 'commands'>('users');
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [commandSuggestions, setCommandSuggestions] = useState<Command[]>([]);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const availableCommands: Command[] = [
    { name: 'weather', description: language === 'ru' ? 'Погода в городе' : 'Weather in city', icon: '🌤️' },
    { name: 'time', description: language === 'ru' ? 'Время в часовом поясе' : 'Time in timezone', icon: '🕐' },
    { name: 'calc', description: language === 'ru' ? 'Вычислить выражение' : 'Calculate expression', icon: '🧮' },
    { name: 'help', description: language === 'ru' ? 'Показать все команды' : 'Show all commands', icon: '❓' },
  ];

  // Detect @mentions and / commands and show suggestions
  useEffect(() => {
    const cursorPos = messageInputRef.current?.selectionStart || 0;
    const textBeforeCursor = messageText.slice(0, cursorPos);

    // Check for / commands
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    if (lastSlashIndex !== -1 && (lastSlashIndex === 0 || textBeforeCursor[lastSlashIndex - 1] === ' ')) {
      const textAfterSlash = textBeforeCursor.slice(lastSlashIndex + 1);
      if (!textAfterSlash.includes(' ')) {
        const query = textAfterSlash.toLowerCase();
        const filtered = query === '' ? availableCommands : availableCommands.filter(cmd =>
          cmd.name.toLowerCase().includes(query)
        );

        setCommandSuggestions(filtered);
        setMentionStartPos(lastSlashIndex);
        setSuggestionType('commands');
        setShowSuggestions(true);
        return;
      }
    }

    // Check for @mentions
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ')) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        const query = textAfterAt.toLowerCase();
        const filtered = query === '' ? availableUsers.slice(0, 5) : availableUsers.filter(user =>
          user.username.toLowerCase().includes(query) ||
          user.name.toLowerCase().includes(query)
        ).slice(0, 5);

        setUserSuggestions(filtered);
        setMentionStartPos(lastAtIndex);
        setSuggestionType('users');
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
  }, [messageText, availableUsers, language]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const selectUser = (user: User) => {
    if (mentionStartPos === null) return;

    const beforeMention = messageText.slice(0, mentionStartPos);
    const afterCursor = messageText.slice(messageInputRef.current?.selectionStart || messageText.length);
    const newText = `${beforeMention}@${user.username} ${afterCursor}`;

    setMessageText(newText);
    if (editingMessage) {
      setEditMessageText(newText);
    }
    setShowSuggestions(false);
    messageInputRef.current?.focus();
  };

  const selectCommand = (command: Command) => {
    if (mentionStartPos === null) return;

    const beforeCommand = messageText.slice(0, mentionStartPos);
    const afterCursor = messageText.slice(messageInputRef.current?.selectionStart || messageText.length);
    const newText = `${beforeCommand}/${command.name} ${afterCursor}`;

    setMessageText(newText);
    if (editingMessage) {
      setEditMessageText(newText);
    }
    setShowSuggestions(false);
    messageInputRef.current?.focus();
  };

  const resetTextareaHeight = () => {
    if (messageInputRef.current) {
      (messageInputRef.current as HTMLTextAreaElement).style.height = 'auto';
      (messageInputRef.current as HTMLTextAreaElement).style.height = '42px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        onEdit();
      } else {
        onSubmit(e as any);
      }
      // Reset textarea height after sending
      setTimeout(resetTextareaHeight, 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMessage) {
      onEdit();
    } else {
      onSubmit(e);
    }
    // Reset textarea height after sending
    setTimeout(resetTextareaHeight, 0);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditMessageText("");
    setMessageText("");
  };

  return (
    <div className="space-y-2 relative">
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <motion.div
          ref={suggestionsRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50"
        >
          <div className="p-2 space-y-1">
            {suggestionType === 'users' ? (
              userSuggestions.length > 0 ? (
                userSuggestions.map(user => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-lg shadow-sm">
                      {user.emoji ? <span>{user.emoji}</span> : <User className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium dark:text-white truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('tag.noUsersFound')}
                </div>
              )
            ) : (
              commandSuggestions.length > 0 ? (
                commandSuggestions.map(cmd => (
                  <button
                    key={cmd.name}
                    onClick={() => selectCommand(cmd)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                  >
                    <div className="text-2xl">{cmd.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium dark:text-white">/{cmd.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{cmd.description}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ru' ? 'Команды не найдены' : 'No commands found'}
                </div>
              )
            )}
          </div>
        </motion.div>
      )}

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
        {onGifClick && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onGifClick}
              className="hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 transition-all"
            >
              <Film className="size-5" />
            </Button>
          </motion.div>
        )}
        <textarea
          ref={messageInputRef as any}
          placeholder={editingMessage ? t('message.editMessage') : t('message.typeMessage')}
          value={messageText}
          rows={1}
          onChange={(e) => {
            setMessageText(e.target.value);
            // Also update editMessageText when editing
            if (editingMessage) {
              setEditMessageText(e.target.value);
            }
            // Auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
          }}
          onKeyDown={handleKeyDown}
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
          className="flex-1 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-600 rounded-2xl px-4 py-2 transition-all shadow-sm focus:shadow-md resize-none overflow-y-auto dark:bg-gray-800 dark:text-white"
          style={{ minHeight: '42px', maxHeight: '150px' }}
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