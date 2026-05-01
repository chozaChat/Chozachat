import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Button } from "../components/ui/button";
import confetti from "canvas-confetti";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { ProfilePanel } from "../components/ProfilePanel";
import { MessageCircle, Users, UserPlus, LogOut, Send, Plus, UserMinus, Check, X, Bell, ArrowLeft, Settings, Shield, Newspaper, MoreVertical, Edit, Trash, Trash2, Moon, Sun, Menu, Search, Hash, Smile, Bot, Sparkles, Reply, Pencil, Globe, User, Palette } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";
import { useBlur } from "../contexts/BlurContext";
import { useLanguage } from "../contexts/LanguageContext";
import { CustomPrompt, CustomConfirm } from "../components/CustomPrompt";
import { StickerPicker } from "../components/StickerPicker";
import { MessageItem } from "../components/MessageItem";
import { MessageInput } from "../components/MessageInput";
import { PollCreator, PollData } from "../components/PollCreator";
import { PollMessage } from "../components/PollMessage";
import { AnnouncementBanner } from "../components/AnnouncementBanner";
import { motion, AnimatePresence } from "motion/react";

const SERVER_ID = 'make-server-a1c86d03';

function BestLanguageOfMonth({ navigate, setSettingsOpen }: { navigate: any; setSettingsOpen: (open: boolean) => void }) {
  const [bestLang, setBestLang] = useState<{ key: string; displayName: string } | null>(null);
  const { t, setLanguage } = useLanguage();

  useEffect(() => {
    loadBestLanguage();
  }, []);

  const loadBestLanguage = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/best-language-of-month`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setBestLang(data.value);
        }
      }
    } catch (error) {
      console.error("Failed to load best language:", error);
    }
  };

  const saveLanguage = (langKey: string, displayName: string) => {
    const saved = JSON.parse(localStorage.getItem('savedLanguages') || '[]');
    if (!saved.find((l: any) => l.key === langKey)) {
      saved.push({ key: langKey, displayName });
      localStorage.setItem('savedLanguages', JSON.stringify(saved));
      toast.success(`${displayName} saved!`);
    } else {
      toast.info(`${displayName} already saved`);
    }
  };

  if (!bestLang) return null;

  return (
    <div className="pt-3 border-t dark:border-gray-700">
      <Label className="text-purple-600 dark:text-purple-400">⭐ {t('settings.bestLanguage')}</Label>
      <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium dark:text-white flex-1">{bestLang.displayName}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveLanguage(bestLang.key, bestLang.displayName)}
            >
              {t('common.save')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setLanguage(bestLang.key);
                toast.success(`Language set to ${bestLang.displayName}`);
                setSettingsOpen(false);
              }}
            >
              {t('settings.use')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedLanguages() {
  const [savedLangs, setSavedLangs] = useState<Array<{ key: string; displayName: string }>>([]);
  const { t, setLanguage, language } = useLanguage();

  useEffect(() => {
    loadSavedLanguages();
  }, []);

  const loadSavedLanguages = () => {
    const saved = JSON.parse(localStorage.getItem('savedLanguages') || '[]');
    setSavedLangs(saved);
  };

  const removeSavedLanguage = (langKey: string) => {
    const saved = JSON.parse(localStorage.getItem('savedLanguages') || '[]');
    const filtered = saved.filter((l: any) => l.key !== langKey);
    localStorage.setItem('savedLanguages', JSON.stringify(filtered));
    setSavedLangs(filtered);
    toast.success(t('settings.languageRemoved'));
  };

  if (savedLangs.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('settings.noSavedLanguages')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {savedLangs.map(lang => (
        <div key={lang.key} className="flex items-center justify-between p-2 border rounded-lg dark:border-gray-700">
          <span className="text-sm dark:text-white">{lang.displayName}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={language === lang.key ? 'default' : 'outline'}
              onClick={() => setLanguage(lang.key)}
            >
              {language === lang.key ? t('settings.active') : t('settings.use')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeSavedLanguage(lang.key)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "���", "🙃",
  "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
  "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
  "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
  "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
  "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓",
  "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺",
  "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣",
  "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈",
  "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾",
  "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯",
  "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆",
  "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋",
  "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎",
  "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟",
  "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧",
  "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄",
  "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮",
  "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝",
  "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔", "🌸", "💐",
  "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🌲", "🌳", "🌴",
  "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🍄", "🌰",
  "🦀", "🍇", "🍈", "🍉", "🍊", "🍋", "🍌", "🍍", "🥭", "🍎",
  "🍏", "🍐", "🍑", "🍒", "🍓", "🥝", "🍅", "🥥", "🥑", "🍆",
  "🥔", "🥕", "🌽", "🌶️", "🥒", "🥬", "🥦", "🧄", "🧅", "🍄",
  "🥜", "🌰", "🍞", "🥐", "🥖", "🥨", "🥯", "🥞", "🧇", "🧀",
  "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮",
  "🌯", "🥙", "🧆", "🥚", "���", "🥘", "🍲", "🥣", "🥗", "🍿",
  "🧈", "🧂", "🥫", "🍱", "🍘", "���", "🍚", "🍛", "🍜", "🍝",
  "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡",
  "🦀", "🦞", "🦐", "🦑", "🦪", "🍦", "🍧", "🍨", "🍩", "🍪",
  "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯", "🍼",
  "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺",
  "🍻", "🥂", "🥃", "🥤", "🧃", "🧉", "🧊", "🥢", "🍽️", "🍴",
  "🥄", "🔪", "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
  "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅",
  "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼",
  "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸",
  "🤺", "⛹️", "🤾", "🏌️", "🏇", "🧘", "🏊", "🤽", "🚣", "🧗",
  "🚴", "🚵", "🎖️", "🏆", "🏅", "🥇", "🥈", "🥉", "🎗️", "🎫",
  "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", "🎬", "🎤", "🎧", "���",
  "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯",
  "🎳", "🎮", "🎰", "🧩", "📱", "🪫", "🔋"
];

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  tag?: string;
  tagColor?: string;
  verified?: boolean;
  moderator?: boolean;
  isModerator?: boolean;
  isScammer?: boolean;
  passwordCompromised?: boolean;
  lastActive?: string;
  tags?: string[];
  emoji?: string;
}

interface Friend extends User {}

interface FriendRequest {
  requesterId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  requester: User;
}

interface Group {
  id: string;
  name: string;
  members: string[];
  creatorId: string;
  emoji?: string;
}

interface Channel {
  id: string;
  name: string;
  username?: string;
  creatorId?: string;
  emoji?: string;
  members?: string[];
  admins?: string[];
  type?: string;
  verified?: boolean;
}

interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  text?: string;
  content?: string;
  timestamp: string;
  edited?: boolean;
  readBy?: string[];
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  poll?: PollData & {
    votes?: Array<{
      userId: string;
      optionIds: string[];
      userName: string;
    }>;
    stopped?: boolean;
    expiresAt?: string;
    createdAt?: string;
  };
}

export default function ChatMain() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { blurStrength, setBlurStrength } = useBlur();
  const { language, setLanguage, t, availableLanguages, loadCustomLanguages } = useLanguage();
  
  // Helper to generate blur classes
  const getBlurClasses = (lightBg: string, darkBg: string) => {
    if (blurStrength === 0) {
      return `${lightBg} ${darkBg}`;
    }
    return `${lightBg}/60 ${darkBg}/60 backdrop-blur-[${blurStrength}px]`;
  };
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ type: 'friend' | 'group' | 'news' | 'channel', id: string, name: string, friendData?: Friend, admins?: string[], verified?: boolean } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [pollCreatorOpen, setPollCreatorOpen] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [editingPollData, setEditingPollData] = useState<PollData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<(User | Channel)[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("");
  const [channelName, setChannelName] = useState("");
  const [channelUsername, setChannelUsername] = useState("");
  const [channelEmoji, setChannelEmoji] = useState("");
  const [showCreateGroupEmojiPicker, setShowCreateGroupEmojiPicker] = useState(false);
  const [showCreateChannelEmojiPicker, setShowCreateChannelEmojiPicker] = useState(false);
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiTypingText, setAiTypingText] = useState("");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupEmoji, setEditGroupEmoji] = useState("");
  const [showGroupEmojiPicker, setShowGroupEmojiPicker] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelUsername, setEditChannelUsername] = useState("");
  const [editChannelEmoji, setEditChannelEmoji] = useState("");
  const [showEditChannelEmojiPicker, setShowEditChannelEmojiPicker] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [friendRequestsOpen, setFriendRequestsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [addMembersGroup, setAddMembersGroup] = useState<Group | null>(null);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profilePanelData, setProfilePanelData] = useState<{ type: 'user' | 'group' | 'channel', data: any } | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [adminTab, setAdminTab] = useState<'users' | 'settings' | 'troll' | 'announcements' | 'channels'>('users');
  const [selectedChannelsForDelete, setSelectedChannelsForDelete] = useState<string[]>([]);
  const [allChannelsForAdmin, setAllChannelsForAdmin] = useState<Channel[]>([]);
  const [channelSearchQuery, setChannelSearchQuery] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementDescription, setAnnouncementDescription] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);
  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(false);
  const [moderatorPanelOpen, setModeratorPanelOpen] = useState(false);
  const [moderatorSearchQuery, setModeratorSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [moderatorSearchResults, setModeratorSearchResults] = useState<User[]>([]);
  const [selectedUserForMod, setSelectedUserForMod] = useState<User | null>(null);
  const [friendEmail, setFriendEmail] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [trollChannelConnected, setTrollChannelConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [showNotificationsWhenActive, setShowNotificationsWhenActive] = useState(() => {
    return localStorage.getItem('showNotificationsWhenActive') === 'true';
  });
  const globalNotificationChannelRef = useRef<any>(null);
  const [chatMembersData, setChatMembersData] = useState<Record<string, User>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, { content: string, timestamp: string }>>({});

  // Custom prompts
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptConfig, setPromptConfig] = useState<{
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    type?: 'text' | 'password';
    multiline?: boolean;
    onConfirm: (value: string) => void;
  }>({
    title: '',
    onConfirm: () => {}
  });
  
  // Sticker picker
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  
  // Message actions (edit, reply, delete)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);

  // Confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default'
  });

  const showConfirm = (title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'default') => {
    setConfirmDialogConfig({ title, description, onConfirm, variant });
    setConfirmDialogOpen(true);
  };

  // Initial loading state
  const [initialLoading, setInitialLoading] = useState(true);

  // Generate floating logos once using useMemo
  const floatingLogos = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      // Random starting position
      const startX = Math.random() * 90 + 5; // 5-95%
      const startY = Math.random() * 90 + 5; // 5-95%
      
      // Random ending position (anywhere on screen)
      const endX = Math.random() * 90 + 5; // 5-95%
      const endY = Math.random() * 90 + 5; // 5-95%
      
      const scale = 0.5 + Math.random() * 1.5;
      const duration = 15 + Math.random() * 10;
      const delay = Math.random() * 5; // Random start delay
      
      return { id: `logo-${i}`, startX, startY, endX, endY, scale, duration, delay };
    });
  }, []); // Empty dependency array means this only runs once

  // Refs for Realtime channels
  const messageChannelRef = useRef<any>(null);
  const trollChannelRef = useRef<any>(null);

  // CLIENT-ONLY MODE - Bypass server entirely
  const CLIENT_ONLY_MODE = false;
  
  // SERVER ID
  const SERVER_ID = 'make-server-a1c86d03';
  
  // FRONTEND VERSION FOR DEBUGGING
  const FRONTEND_VERSION = '2024-04-08-v33-POLL-MANAGEMENT';
  
  // Helper function to check if a message is just a sticker (emoji only, no other text)
  const isOnlySticker = (text: string) => {
    if (!text) return false;
    // Remove all emoji characters and check if anything is left
    const withoutEmojis = text.replace(/[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}]/gu, '').trim();
    // Count emojis (roughly)
    const emojiCount = (text.match(/[\p{Emoji}\p{Emoji_Presentation}]/gu) || []).length;
    // It's a sticker if: only emojis, no other text, and 1-3 emojis
    return withoutEmojis === '' && emojiCount >= 1 && emojiCount <= 3;
  };
  
  // Helper function to check if user is admin
  const isUserAdmin = (user?: User | null) => {
    return user?.email === 'mikhail02323@gmail.com';
  };

  // Helper function to render tag badge
  const renderTagBadge = (tag?: string, isAdmin?: boolean, tagColor?: string) => {
    if (!tag) return null;
    
    const isScam = tag === 'SCAM';
    const isMod = tag === 'MOD';
    
    // Use custom tagColor if provided, otherwise fall back to defaults
    if (tagColor && !isScam && !isAdmin) {
      return (
        <span 
          className="text-xs px-2 py-0.5 rounded font-semibold text-white"
          style={{ backgroundColor: tagColor }}
        >
          {tag}
        </span>
      );
    }
    
    return (
      <span 
        className={`text-xs px-2 py-0.5 rounded font-semibold ${
          isScam 
            ? 'bg-red-500 dark:bg-red-800 text-white' 
            : isAdmin
            ? 'bg-blue-500 dark:bg-blue-800 text-white'
            : isMod
            ? 'bg-yellow-500 dark:bg-yellow-700 text-white'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}
      >
        {tag}
      </span>
    );
  };
  
  // Helper function to render verified checkmark with background
  const renderVerifiedBadge = () => {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white text-xs rounded-full" title="Verified">
        ✓
      </span>
    );
  };
  
  // Direct KV store access (simulated with fetch to server, but without auth)
  const kvGet = async (key: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/${key}`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.value;
      }
      return null;
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  };

  const kvGetByPrefix = async (prefix: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/prefix/${prefix}`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data.values || [];
      }
      return [];
    } catch (error) {
      console.error('KV getByPrefix error:', error);
      return [];
    }
  };

  const kvSet = async (key: string, value: any) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/${key}`,
        {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error('KV set error:', error);
      return false;
    }
  };

  const kvDel = async (key: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/${key}`,
        {
          method: 'DELETE',
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.error('KV del error:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('🎯��🎯 CHATMAIN MOUNTED - FRONTEND VERSION:', FRONTEND_VERSION);
    console.log('🎯 SERVER_ID:', SERVER_ID);
    console.log('🎯 projectId:', projectId);
    console.log('🎯 publicAnonKey length:', publicAnonKey?.length || 'MISSING');
    console.log('🎯 CLIENT_ONLY_MODE:', CLIENT_ONLY_MODE);
    
    const checkSession = async () => {
      // Check if we have a saved session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Restore from Supabase session
        setUserId(session.user.id);
        localStorage.setItem("userId", session.user.id);
        localStorage.setItem("accessToken", session.access_token);
      } else {
        // Fallback to localStorage
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          navigate("/");
        }
      }
    };
    
    checkSession();
  }, [navigate]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Clear message input when switching chats
    setMessageText("");
    setReplyingTo(null);

    // Check server version
    const checkServerVersion = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a1c86d03/health`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            }
          }
        );
        
        if (!response.ok) {
          console.warn("Server health check failed with status:", response.status);
          return;
        }
        
        const data = await response.json();
        console.log("=== SERVER VERSION CHECK ===");
        console.log("Server version:", data.version);
        console.log("Server timestamp:", data.timestamp);
        console.log("Expected version: 2024-04-08-v33-POLL-MANAGEMENT");
        
        if (!data.version) {
          console.warn("⚠️ WARNING: Server did not return version info. Server may not be deployed.");
          console.warn("Response data:", data);
        } else if (data.version !== "2024-04-08-v33-POLL-MANAGEMENT") {
          console.warn("⚠️ WARNING: Server version mismatch! Old code might be running.");
          console.warn("⚠️ Current version:", data.version);
          toast.error(`Server version mismatch! Expected 2024-04-08-v33-POLL-MANAGEMENT, got ${data.version}`, { duration: 10000 });
        } else {
          console.log("✓ Server version is correct!");
          // Success toast removed - only show errors
        }
      } catch (err) {
        console.error("Failed to check server version:", err);
        console.error("This usually means the server is not deployed or unreachable.");
      }
    };
    
    checkServerVersion();
    
    // Load initial data - finish when data loads or after 3 seconds max
    const loadInitialData = async () => {
      const startTime = Date.now();
      const maxLoadTime = 3000; // 3 seconds max
      
      // Load all data in parallel
      await Promise.all([
        loadCurrentUser(),
        loadFriends(),
        loadChannels(),
        loadFriendRequests(),
        loadStats(),
        updateLastActive(),
        loadAllUsers()
      ]);
      
      // Calculate remaining time to reach minimum of 3 seconds if needed
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, Math.min(500, maxLoadTime - elapsed));
      
      // Wait for remaining time then hide loading screen
      setTimeout(() => {
        setInitialLoading(false);
      }, remainingTime);
    };
    
    loadInitialData();
    
    // Check notification permission on mount
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      }
    }

    // Set up Supabase Realtime for messages
    if (selectedChat) {
      // Unsubscribe from previous channel if it exists
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }

      const channelName = `chat-${selectedChat.type}-${selectedChat.id}`;
      messageChannelRef.current = supabase.channel(channelName);
      
      // Subscribe to new messages
      messageChannelRef.current
        .on('broadcast', { event: 'new-message' }, (payload: any) => {
          console.log('Received new message:', payload);
          // Show notification if not from current user
          if (payload && payload.payload) {
            const messageData = payload.payload;
            
            // If message data is included in the payload, add it directly
            if (messageData.message) {
              console.log('📊 Adding message from broadcast with poll:', messageData.message);
              setMessages(prev => {
                // Check if message already exists
                const exists = prev.some(m => m.id === messageData.message.id);
                if (!exists) {
                  const enrichedNewMessages = enrichPollVotesWithUserNames([messageData.message]);
                  return [...prev, enrichedNewMessages[0]];
                }
                return prev;
              });
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

              // Update last message
              const chatKey = `${selectedChat.type}-${selectedChat.id}`;
              setLastMessages(prev => ({
                ...prev,
                [chatKey]: {
                  content: messageData.message.content || messageData.message.text || '',
                  timestamp: messageData.message.timestamp
                }
              }));
            } else {
              // Fallback: reload messages from server
              loadMessages(selectedChat.type, selectedChat.id);
            }
            
            if (messageData.senderId !== userId) {
              // Get sender info
              const sender = friends.find(f => f.id === messageData.senderId) || 
                            { name: 'Someone', emoji: '👤' };
              showMessageNotification(sender.name, messageData.text, sender.emoji);
            }
          }
        })
        .on('broadcast', { event: 'message-edited' }, (payload: any) => {
          console.log('Received message edit:', payload);
          // Reload messages when a message is edited
          if (payload && payload.payload) {
            loadMessages(selectedChat.type, selectedChat.id);
          }
        })
        .on('broadcast', { event: 'message-deleted' }, (payload: any) => {
          console.log('Received message delete:', payload);
          // Reload messages when a message is deleted
          if (payload && payload.payload) {
            loadMessages(selectedChat.type, selectedChat.id);
          }
        })
        .subscribe((status: string) => {
          console.log('Message channel status:', status);
        });
    }

    // Update stats and activity periodically (still needed for online status)
    const statsInterval = setInterval(() => {
      loadFriendRequests();
      loadStats();
      updateLastActive();
      checkUnreadMessages();
    }, 10000); // Check every 10 seconds

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
      clearInterval(statsInterval);
    };
  }, [userId, selectedChat]);

  // Clear unread messages and update last read timestamp when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      const chatKey = `${selectedChat.type}-${selectedChat.id}`;

      // Clear unread count
      setUnreadMessages(prev => {
        const newUnread = { ...prev };
        delete newUnread[chatKey];
        return newUnread;
      });

      // Update last read timestamp
      const lastReadKey = `lastRead-${selectedChat.type}-${selectedChat.id}`;
      localStorage.setItem(lastReadKey, new Date().toISOString());

      // Clear previous chat members data
      setChatMembersData({});
    }
  }, [selectedChat]);

  // Update last read and mark messages as read when new messages arrive in the current chat
  useEffect(() => {
    if (selectedChat && messages.length > 0) {
      const lastReadKey = `lastRead-${selectedChat.type}-${selectedChat.id}`;
      localStorage.setItem(lastReadKey, new Date().toISOString());

      // Mark all messages in this chat as read
      markMessagesAsRead(selectedChat.type, selectedChat.id);
    }
  }, [messages, selectedChat]);

  // Global notification listener for ALL chats (works even when user is not viewing a specific chat)
  useEffect(() => {
    if (!userId || !notificationsEnabled) return;

    console.log('[Notifications] Setting up global notification listener for user:', userId);

    // Create a user-specific notification channel
    const notifChannelName = `user-notifications-${userId}`;
    globalNotificationChannelRef.current = supabase.channel(notifChannelName, {
      config: {
        broadcast: {
          self: false, // Don't receive own messages
        },
      },
    });

    globalNotificationChannelRef.current
      .on('broadcast', { event: 'new-message-notification' }, async (payload: any) => {
        console.log('[Notifications] Received notification:', payload);
        if (!payload || !payload.payload) return;

        const data = payload.payload;
        const { senderId, senderName, senderEmoji, messageText, chatType, chatId, chatName } = data;

        // Don't notify for own messages
        if (senderId === userId) return;

        // Don't notify if currently viewing this chat
        if (selectedChat && selectedChat.type === chatType && selectedChat.id === chatId) {
          // User is currently viewing this chat, skip notification
          return;
        }

        // Show notification
        showMessageNotification(
          senderName || t('message.someone'),
          messageText || (language === 'ru' ? 'Новое сообщение' : 'New message'),
          senderEmoji,
          { type: chatType, id: chatId, name: chatName }
        );

        // Update unread count
        setUnreadMessages((prev) => ({
          ...prev,
          [`${chatType}-${chatId}`]: (prev[`${chatType}-${chatId}`] || 0) + 1,
        }));
      })
      .subscribe((status: string) => {
        console.log('[Notifications] Global notification channel status:', status);
      });

    return () => {
      if (globalNotificationChannelRef.current) {
        console.log('[Notifications] Cleaning up global notification listener');
        supabase.removeChannel(globalNotificationChannelRef.current);
        globalNotificationChannelRef.current = null;
      }
    };
  }, [userId, notificationsEnabled, selectedChat]);

  // Listen for troll zone effects via Supabase Realtime
  useEffect(() => {
    if (!userId) return;

    console.log('[Troll] Setting up troll channel listener for user:', userId);
    
    // Create a unique channel instance for this user with self: true to receive own messages
    trollChannelRef.current = supabase.channel('troll-zone-global', {
      config: {
        broadcast: {
          self: true, // Allow receiving own broadcasts (for testing)
        },
      },
    });
    
    trollChannelRef.current
      .on('broadcast', { event: 'troll-action' }, (payload: any) => {
        console.log('[Troll] Received troll action:', payload);
        const command = payload.payload;
        
        // Execute command based on type
        switch (command.action) {
          case 'broadcast':
            toast.info(command.message, {
              duration: 5000,
              style: {
                background: '#8b5cf6',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }
            });
            break;

          case 'shake':
            const appElement = document.body;
            appElement.style.animation = 'shake 0.5s';
            appElement.style.animationIterationCount = '4';
            setTimeout(() => {
              appElement.style.animation = '';
            }, 2000);
            break;

          case 'confetti':
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

            function randomInRange(min: number, max: number) {
              return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                return clearInterval(interval);
              }

              const particleCount = 50 * (timeLeft / duration);
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
              });
              confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
              });
            }, 250);
            break;

          case 'update':
            toast.error('⚠️ CRITICAL UPDATE REQUIRED! Please restart your application immediately!', {
              duration: 10000,
              style: {
                background: '#dc2626',
                color: 'white',
                fontSize: '#16px',
                fontWeight: 'bold'
              }
            });
            break;

          case 'emojiRain':
            const emojis = ['😂', '❤️', '🎉', '🔥', '✨', '💯', '👻', '🦄', '🌈', '⚡'];
            const emojiContainer = document.createElement('div');
            emojiContainer.style.position = 'fixed';
            emojiContainer.style.top = '0';
            emojiContainer.style.left = '0';
            emojiContainer.style.width = '100%';
            emojiContainer.style.height = '100%';
            emojiContainer.style.pointerEvents = 'none';
            emojiContainer.style.zIndex = '99998';
            document.body.appendChild(emojiContainer);

            for (let i = 0; i < 30; i++) {
              setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.position = 'absolute';
                emoji.style.left = Math.random() * 100 + '%';
                emoji.style.top = '-50px';
                emoji.style.fontSize = (Math.random() * 30 + 20) + 'px';
                emoji.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
                emojiContainer.appendChild(emoji);

                setTimeout(() => emoji.remove(), 5000);
              }, i * 100);
            }

            setTimeout(() => emojiContainer.remove(), 6000);
            break;

          case 'glitchEffect':
            // Create full-screen glitch overlay
            const glitchOverlay = document.createElement('div');
            glitchOverlay.style.position = 'fixed';
            glitchOverlay.style.top = '0';
            glitchOverlay.style.left = '0';
            glitchOverlay.style.width = '100%';
            glitchOverlay.style.height = '100%';
            glitchOverlay.style.pointerEvents = 'none';
            glitchOverlay.style.zIndex = '99999';
            glitchOverlay.style.mixBlendMode = 'difference';
            glitchOverlay.style.animation = 'glitch 0.2s infinite';
            document.body.appendChild(glitchOverlay);

            // Add random glitch bars
            const glitchInterval = setInterval(() => {
              const bar = document.createElement('div');
              bar.style.position = 'fixed';
              bar.style.left = '0';
              bar.style.width = '100%';
              bar.style.height = Math.random() * 50 + 10 + 'px';
              bar.style.top = Math.random() * window.innerHeight + 'px';
              bar.style.background = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
              bar.style.zIndex = '99998';
              bar.style.pointerEvents = 'none';
              glitchOverlay.appendChild(bar);
              setTimeout(() => bar.remove(), 100);
            }, 50);

            // Apply glitch to body
            document.body.style.animation = 'glitch 0.15s infinite';
            
            setTimeout(() => {
              clearInterval(glitchInterval);
              glitchOverlay.remove();
              document.body.style.animation = '';
            }, 4000);
            
            toast.error('⚠️ SYSTEM ERROR: MATRIX CORRUPTED', {
              duration: 3000,
              style: {
                background: '#000',
                color: '#00ff00',
                fontFamily: 'monospace',
                fontSize: '16px',
                border: '2px solid #00ff00'
              }
            });
            break;

          case 'discoMode':
            // Create disco overlay
            const discoOverlay = document.createElement('div');
            discoOverlay.style.position = 'fixed';
            discoOverlay.style.top = '0';
            discoOverlay.style.left = '0';
            discoOverlay.style.width = '100%';
            discoOverlay.style.height = '100%';
            discoOverlay.style.pointerEvents = 'none';
            discoOverlay.style.zIndex = '99997';
            discoOverlay.style.transition = 'background-color 0.1s';
            document.body.appendChild(discoOverlay);

            // Flash colors rapidly
            const disco = setInterval(() => {
              const randomColor = `hsla(${Math.random() * 360}, 100%, 50%, 0.3)`;
              discoOverlay.style.backgroundColor = randomColor;
            }, 150);

            // Add disco ball emoji
            const discoBall = document.createElement('div');
            discoBall.style.position = 'fixed';
            discoBall.style.top = '20px';
            discoBall.style.left = '50%';
            discoBall.style.transform = 'translateX(-50%)';
            discoBall.style.fontSize = '80px';
            discoBall.style.zIndex = '99999';
            discoBall.style.animation = 'bounce 0.5s infinite, spin 2s linear infinite';
            discoBall.textContent = '🪩';
            document.body.appendChild(discoBall);

            toast('🪩 DISCO PARTY MODE ACTIVATED! 🪩', {
              duration: 5000,
              style: {
                background: 'linear-gradient(45deg, #ff0080, #00ff80, #0080ff)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold'
              }
            });

            setTimeout(() => {
              clearInterval(disco);
              discoOverlay.remove();
              discoBall.remove();
            }, 5000);
            break;

          case 'flipScreen':
            document.body.style.transform = 'rotate(180deg)';
            setTimeout(() => {
              document.body.style.transform = '';
            }, 5000);
            break;

          case 'rickRoll':
            toast('🎵 Never gonna give you up, never gonna let you down! 🎵', {
              duration: 8000,
              style: {
                background: 'linear-gradient(45deg, #ff0080, #ff8c00)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center'
              }
            });
            // Show dancing emoji animation
            const rickContainer = document.createElement('div');
            rickContainer.style.position = 'fixed';
            rickContainer.style.top = '50%';
            rickContainer.style.left = '50%';
            rickContainer.style.transform = 'translate(-50%, -50%)';
            rickContainer.style.fontSize = '100px';
            rickContainer.style.zIndex = '99999';
            rickContainer.style.animation = 'bounce 0.5s infinite';
            rickContainer.textContent = '🕺💃';
            document.body.appendChild(rickContainer);
            setTimeout(() => rickContainer.remove(), 8000);
            break;

          case 'zaWarudo':
            // ZA WARUDO! - Time Stop
            // Flash white screen
            const zaWarudoFlash = document.createElement('div');
            zaWarudoFlash.style.position = 'fixed';
            zaWarudoFlash.style.top = '0';
            zaWarudoFlash.style.left = '0';
            zaWarudoFlash.style.width = '100%';
            zaWarudoFlash.style.height = '100%';
            zaWarudoFlash.style.backgroundColor = 'white';
            zaWarudoFlash.style.zIndex = '100000';
            zaWarudoFlash.style.opacity = '1';
            zaWarudoFlash.style.transition = 'opacity 0.2s';
            document.body.appendChild(zaWarudoFlash);

            // ZA WARUDO text
            const zaWarudoText = document.createElement('div');
            zaWarudoText.style.position = 'fixed';
            zaWarudoText.style.top = '50%';
            zaWarudoText.style.left = '50%';
            zaWarudoText.style.transform = 'translate(-50%, -50%) scale(0)';
            zaWarudoText.style.fontSize = window.innerWidth < 768 ? '48px' : '120px';
            zaWarudoText.style.fontWeight = 'bold';
            zaWarudoText.style.color = '#FFD700';
            zaWarudoText.style.fontFamily = 'serif';
            zaWarudoText.style.zIndex = '100001';
            zaWarudoText.style.textShadow = window.innerWidth < 768 ? '3px 3px 6px rgba(0,0,0,1), 0 0 15px #FFD700' : '6px 6px 12px rgba(0,0,0,1), 0 0 30px #FFD700';
            zaWarudoText.style.transition = 'transform 0.3s ease-out';
            zaWarudoText.style.webkitTextStroke = window.innerWidth < 768 ? '2px #000000' : '3px #000000';
            zaWarudoText.style.whiteSpace = 'nowrap';
            zaWarudoText.textContent = 'ZA WARUDO!';
            document.body.appendChild(zaWarudoText);

            // Toast for audio effect
            toast('⏰ ZA WARUDO! TOKI WO TOMARE!', {
              duration: 4000,
              style: {
                background: '#000',
                color: '#FFD700',
                fontSize: '20px',
                fontWeight: 'bold',
                fontFamily: 'serif',
                border: '3px solid #FFD700'
              }
            });

            // Animate ZA WARUDO text
            setTimeout(() => {
              zaWarudoFlash.style.opacity = '0';
              zaWarudoText.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);

            // Clock ticking effect
            const clockEmoji = document.createElement('div');
            clockEmoji.style.position = 'fixed';
            clockEmoji.style.top = '20px';
            clockEmoji.style.left = '50%';
            clockEmoji.style.transform = 'translateX(-50%)';
            clockEmoji.style.fontSize = '80px';
            clockEmoji.style.zIndex = '100001';
            clockEmoji.style.animation = 'pulse 0.5s ease-in-out infinite';
            clockEmoji.textContent = '⏱️';
            document.body.appendChild(clockEmoji);

            // Remove everything after 4 seconds
            setTimeout(() => {
              zaWarudoFlash.remove();
              zaWarudoText.remove();
              clockEmoji.remove();
            }, 4000);
            break;

          case 'toBeContinued':
            // To Be Continued - Episode Ending
            // Create sepia freeze frame overlay
            const jojoOverlay = document.createElement('div');
            jojoOverlay.style.position = 'fixed';
            jojoOverlay.style.top = '0';
            jojoOverlay.style.left = '0';
            jojoOverlay.style.width = '100%';
            jojoOverlay.style.height = '100%';
            jojoOverlay.style.backgroundColor = 'rgba(112, 66, 20, 0.4)';
            jojoOverlay.style.zIndex = '99998';
            jojoOverlay.style.pointerEvents = 'none';
            jojoOverlay.style.filter = 'sepia(1)';
            document.body.appendChild(jojoOverlay);

            // Create "To Be Continued" arrow
            const jojoArrow = document.createElement('div');
            jojoArrow.style.position = 'fixed';
            jojoArrow.style.bottom = window.innerWidth < 768 ? '50px' : '100px';
            jojoArrow.style.right = window.innerWidth < 768 ? '-400px' : '-500px';
            jojoArrow.style.fontSize = window.innerWidth < 768 ? '28px' : '60px';
            jojoArrow.style.fontWeight = 'bold';
            jojoArrow.style.color = '#ffffff';
            jojoArrow.style.fontFamily = 'serif';
            jojoArrow.style.zIndex = '99999';
            jojoArrow.style.textShadow = '4px 4px 8px rgba(0,0,0,0.8)';
            jojoArrow.style.transform = 'rotate(-5deg)';
            jojoArrow.style.transition = 'right 1.5s ease-out';
            jojoArrow.style.whiteSpace = 'nowrap';
            jojoArrow.innerHTML = window.innerWidth < 768 
              ? '<span style="font-size: 36px;">⬅</span> To Be Continued'
              : '<span style="font-size: 80px;">⬅</span> To Be Continued';
            document.body.appendChild(jojoArrow);

            // Slide in the arrow
            setTimeout(() => {
              jojoArrow.style.right = window.innerWidth < 768 ? '20px' : '50px';
            }, 100);

            // Add menacing symbols (ゴゴゴゴ)
            const menacingSymbols = ['ゴ', 'ゴ', 'ゴ', 'ゴ', 'ゴ', 'ゴ', 'ゴ', 'ゴ'];
            const menacingElements: HTMLDivElement[] = [];
            
            menacingSymbols.forEach((symbol, i) => {
              const menacing = document.createElement('div');
              menacing.textContent = symbol;
              menacing.style.position = 'fixed';
              menacing.style.fontSize = '48px';
              menacing.style.fontWeight = 'bold';
              menacing.style.color = '#ffffff';
              menacing.style.zIndex = '99999';
              menacing.style.opacity = '0';
              menacing.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
              menacing.style.transition = 'opacity 0.5s';
              menacing.style.animation = 'menacing-float 2s ease-in-out infinite';
              
              // Position randomly
              menacing.style.top = (Math.random() * 60 + 10) + '%';
              menacing.style.left = (Math.random() * 80 + 10) + '%';
              
              document.body.appendChild(menacing);
              menacingElements.push(menacing);
              
              // Fade in with delay
              setTimeout(() => {
                menacing.style.opacity = '0.8';
              }, i * 150);
            });

            // Play sound effect (visual representation)
            toast('⬅️ TO BE CONTINUED...', {
              duration: 6000,
              style: {
                background: '#8B4513',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: 'serif',
                border: '4px solid #654321',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }
            });

            // Remove everything after 6 seconds
            setTimeout(() => {
              jojoOverlay.remove();
              jojoArrow.remove();
              menacingElements.forEach(el => el.remove());
            }, 6000);
            break;
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Troll] ✓ Successfully subscribed to troll channel');
          setTrollChannelConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          // Silently handle channel errors - this is normal with Supabase Realtime
          setTrollChannelConnected(false);
        } else if (status === 'TIMED_OUT') {
          // Silently handle timeout - this is normal with Supabase Realtime
          setTrollChannelConnected(false);
        } else if (status === 'CLOSED') {
          // Silently handle closed state - this is normal during cleanup
          setTrollChannelConnected(false);
        }
      });

    return () => {
      if (trollChannelRef.current) {
        console.log('[Troll] Cleaning up troll channel');
        setTrollChannelConnected(false);
        supabase.removeChannel(trollChannelRef.current);
        trollChannelRef.current = null;
      }
    };
  }, [userId]);

  // Check for active announcements
  useEffect(() => {
    if (!userId) return;

    const checkAnnouncement = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/announcement`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId || '',
            },
          }
        );
        const data = await response.json();
        
        if (data.announcement) {
          setCurrentAnnouncement(data.announcement);
          setShowAnnouncementBanner(true);
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      }
    };

    checkAnnouncement();
  }, [userId]);

  // Enrich poll votes with user names when users/friends data is loaded
  useEffect(() => {
    if (allUsers.length > 0 || friends.length > 0) {
      setMessages(prev => enrichPollVotesWithUserNames(prev));
    }
  }, [allUsers, friends]);

  // Fetch current announcement for admin panel
  useEffect(() => {
    if (!userId || !adminPanelOpen) return;

    const fetchAdminAnnouncement = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/announcement`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId || '',
            },
          }
        );
        const data = await response.json();
        
        if (data.announcement) {
          setCurrentAnnouncement(data.announcement);
        }
      } catch (error) {
        console.error('Failed to fetch admin announcement:', error);
      }
    };

    fetchAdminAnnouncement();
  }, [userId, adminPanelOpen]);

  // Auto-scroll to bottom when messages change (important for mobile)
  useEffect(() => {
    if (messages.length > 0) {
      // Find the ScrollArea viewport (Radix UI specific)
      const scrollViewport = messagesEndRef.current?.parentElement?.parentElement;
      if (scrollViewport && scrollViewport.hasAttribute('data-radix-scroll-area-viewport')) {
        const isNearBottom = scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < 150;
        
        if (isNearBottom) {
          // Use requestAnimationFrame to ensure DOM is updated before scrolling
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ 
              behavior: "smooth",
              block: "end"
            });
          });
        }
      }
    }
  }, [messages]);

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || ''
          },
        }
      );
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
        
        // Auto-verify admin if not already verified
        if (data.user.email === 'mikhail02323@gmail.com' && !data.user.verified) {
          const verifiedUser = { ...data.user, verified: true };
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/set`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                key: `user:${userId}`,
                value: verifiedUser
              }),
            }
          );
          setCurrentUser(verifiedUser);
        }
        
        // Load all users if user is admin or moderator
        if (data.user.email === 'mikhail02323@gmail.com' || data.user.moderator || data.user.isModerator) {
          loadAllUsers();
        }
      }
    } catch (error) {
      console.error("Failed to connect to CFS, failed to load user: ConnectEID", error);
    }
  };

  const fetchGroupById = async (groupId: string): Promise<Group | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || ''
          },
        }
      );
      if (!response.ok) {
        console.error("Failed to fetch group:", response.status);
        return null;
      }
      const data = await response.json();
      return data.group || null;
    } catch (error) {
      console.error("Error fetching group:", error);
      return null;
    }
  };

  const loadFriends = async () => {
    if (!userId) {
      console.log("Skipping loadFriends - no userId");
      return;
    }
    
    try {
      console.log("=== LOAD FRIENDS ===");
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );
      
      console.log("Friends response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to connect to CFS, failed to load friends: ConnectEID ", response.status);
        console.error("Error details:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Parsed error:", errorJson);
        } catch (e) {
          // Not JSON
        }
        return;
      }
      
      const data = await response.json();
      console.log("Friends loaded:", data.friends?.length);
      if (data.friends) {
        setFriends(data.friends);
      }
    } catch (error) {
      console.error("Failed to connect to CFS, failed to load friends: ConnectEID ", error);
    }
  };

  const loadChannels = async () => {
    if (!userId) {
      console.log("Skipping loadChannels - no userId");
      return;
    }
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );
      
      if (!response.ok) {
        console.error("Failed to connect to CFS, failed to load channels: ConnectEID ", response.status);
        return;
      }
      
      const data = await response.json();
      console.log(`🔍 [loadChannels] Received ${data.channels?.length || 0} channels from server:`, data.channels);
      if (data.channels) {
        setChannels(data.channels);
        // Log how many of each type
        const channelTypes = data.channels.reduce((acc: any, ch: any) => {
          acc[ch.type || 'unknown'] = (acc[ch.type || 'unknown'] || 0) + 1;
          return acc;
        }, {});
        console.log(`📊 [loadChannels] Channel types breakdown:`, channelTypes);
      }
    } catch (error) {
      console.error("Failed to connect to CFS, failed to load channels: ConnectEID ", error);
    }
  };

  // Helper function to enrich poll votes with user names
  const enrichPollVotesWithUserNames = (messages: Message[]): Message[] => {
    return messages.map(msg => {
      if (msg.poll && msg.poll.votes) {
        const enrichedVotes = msg.poll.votes.map(vote => {
          // If userName is already present, keep it
          if (vote.userName) return vote;
          
          // Look up user name from allUsers or friends
          const user = [...allUsers, ...friends, { id: userId, name: currentUser?.name }].find(u => u.id === vote.userId);
          
          return {
            ...vote,
            userName: user?.name || 'Unknown User'
          };
        });
        
        return {
          ...msg,
          poll: {
            ...msg.poll,
            votes: enrichedVotes
          }
        };
      }
      return msg;
    });
  };

  const loadMessages = async (chatType: 'friend' | 'group' | 'news' | 'channel', chatId: string) => {
    if (!userId) {
      console.log("Skipping loadMessages - no userId");
      return;
    }

    console.log(`🔍 [loadMessages] Loading messages for chatType: ${chatType}, chatId: ${chatId}`);

    try {
      // If it's news channel, use special news endpoint
      if (chatType === 'news') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/news`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to connect to CFS, failed to load news: ConnectEID", response.status);
          return;
        }

        const data = await response.json();
        if (data.messages) {
          console.log(`✅ [loadMessages] Loaded ${data.messages.length} news messages`);
          const enrichedMessages = enrichPollVotesWithUserNames(data.messages);
          setMessages(enrichedMessages);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages/${chatId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to connect to Chozachat Framework Serives: ConnectEID", response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log(`✅ [loadMessages] Loaded ${data.messages?.length || 0} messages for ${chatType}:${chatId}`);
      console.log('📝 [loadMessages] Last message:', JSON.stringify(data.messages?.[data.messages.length - 1]));
      console.log('📝 [loadMessages] First 3 messages content:', data.messages?.slice(0, 3).map((m: any) => ({id: m.id, content: m.content, text: m.text, edited: m.edited, poll: m.poll})));
      if (data.messages) {
        // Log any messages with poll data for debugging
        const pollMessages = data.messages.filter((m: any) => m.poll);
        if (pollMessages.length > 0) {
          console.log('📊 [loadMessages] Found poll messages:', pollMessages.map((m: any) => ({id: m.id, poll: m.poll})));
        }
        const enrichedMessages = enrichPollVotesWithUserNames(data.messages);
        setMessages(enrichedMessages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

        // Store last message for this chat
        if (enrichedMessages.length > 0) {
          const lastMsg = enrichedMessages[enrichedMessages.length - 1];
          const chatKey = `${chatType}-${chatId}`;
          setLastMessages(prev => ({
            ...prev,
            [chatKey]: {
              content: lastMsg.content || lastMsg.text || '',
              timestamp: lastMsg.timestamp
            }
          }));
        }

        // For group or channel chats, fetch member data
        if (chatType === 'group' || chatType === 'channel') {
          loadChatMembersData(chatType, chatId);
        }
      }
    } catch (error) {
      console.error("Failed to connect to Chozachat Framework Serives: ConnectEID", error);
    }
  };

  const loadChatMembersData = async (chatType: 'group' | 'channel', chatId: string) => {
    try {
      // Get the group/channel to find all members
      const itemResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${chatId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || ''
          },
        }
      );

      if (!itemResponse.ok) {
        console.error("Failed to fetch group/channel data");
        return;
      }

      const itemData = await itemResponse.json();
      const memberIds = itemData.group?.members || [];

      // Fetch user data for all members
      const memberDataPromises = memberIds.map(async (memberId: string) => {
        try {
          const userResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                'X-User-Id': memberId
              },
            }
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            return userData.user;
          }
        } catch (error) {
          console.error(`Failed to fetch user ${memberId}:`, error);
        }
        return null;
      });

      const membersData = await Promise.all(memberDataPromises);
      const membersMap: Record<string, User> = {};

      membersData.forEach((user) => {
        if (user) {
          membersMap[user.id] = user;
        }
      });

      setChatMembersData(membersMap);
    } catch (error) {
      console.error("Failed to load chat members data:", error);
    }
  };

  const markMessagesAsRead = async (chatType: 'friend' | 'group' | 'news' | 'channel', chatId: string) => {
    if (!userId) return;

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages/read-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
          body: JSON.stringify({ chatId, chatType }),
        }
      );
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const loadFriendRequests = async () => {
    if (!userId) {
      console.log("Skipping loadFriendRequests - no userId");
      return;
    }
    
    if (CLIENT_ONLY_MODE) {
      // In client-only mode, just use empty array
      setFriendRequests([]);
      return;
    }
    
    console.log("=== Loading Friend Requests ===");
    console.log("Making request to /friends/requests...");
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/requests`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        // Silently handle friend requests load failure
        return;
      }
      
      const data = await response.json();
      if (data.requests) {
        setFriendRequests(data.requests);
      }
    } catch (error) {
      // Silently handle network errors - friend requests are not critical
    }
  };

  const checkUnreadMessages = async () => {
    if (!userId) return;
    
    try {
      const newUnread: Record<string, number> = {};
      
      // Check friends
      for (const friend of friends) {
        const chatId = [userId, friend.id].sort().join(":");
        const lastRead = localStorage.getItem(`lastRead-friend-${chatId}`);
        
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages/${chatId}`,
            {
              headers: { 
                Authorization: `Bearer ${publicAnonKey}`,
                'X-User-Id': userId
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const messages = data.messages || [];
            
            if (lastRead && messages.length > 0) {
              const unreadCount = messages.filter((m: any) => 
                new Date(m.timestamp) > new Date(lastRead) && m.senderId !== userId
              ).length;
              
              if (unreadCount > 0) {
                newUnread[`friend-${chatId}`] = unreadCount;
              }
            }
          }
        } catch (error) {
          // Silently skip errors for individual chats
        }
      }
      
      // Check groups
      for (const group of channels.filter(c => c.type === 'group')) {
        const lastRead = localStorage.getItem(`lastRead-group-${group.id}`);
        
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages/${group.id}`,
            {
              headers: { 
                Authorization: `Bearer ${publicAnonKey}`,
                'X-User-Id': userId
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const messages = data.messages || [];
            
            if (lastRead && messages.length > 0) {
              const unreadCount = messages.filter((m: any) => 
                new Date(m.timestamp) > new Date(lastRead) && m.senderId !== userId
              ).length;
              
              if (unreadCount > 0) {
                newUnread[`group-${group.id}`] = unreadCount;
              }
            }
          }
        } catch (error) {
          // Silently skip errors
        }
      }
      
      // Check channels
      for (const channel of channels.filter(c => c.type === 'channel')) {
        const lastRead = localStorage.getItem(`lastRead-channel-${channel.id}`);
        
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages/${channel.id}`,
            {
              headers: { 
                Authorization: `Bearer ${publicAnonKey}`,
                'X-User-Id': userId
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const messages = data.messages || [];
            
            if (lastRead && messages.length > 0) {
              const unreadCount = messages.filter((m: any) => 
                new Date(m.timestamp) > new Date(lastRead) && m.senderId !== userId
              ).length;
              
              if (unreadCount > 0) {
                newUnread[`channel-${channel.id}`] = unreadCount;
              }
            }
          }
        } catch (error) {
          // Silently skip errors
        }
      }
      
      // Check news
      const lastReadNews = localStorage.getItem('lastRead-news');
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/news`,
          {
            headers: { 
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];
          
          if (lastReadNews && messages.length > 0) {
            const unreadCount = messages.filter((m: any) => 
              new Date(m.timestamp) > new Date(lastReadNews)
            ).length;
            
            if (unreadCount > 0) {
              newUnread['news'] = unreadCount;
            }
          }
        }
      } catch (error) {
        // Silently skip errors
      }
      
      setUnreadMessages(newUnread);
    } catch (error) {
      console.error("Error checking unread messages:", error);
    }
  };

  const loadStats = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/stats`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );
      
      if (!response.ok) {
        // Silently handle stats load failure
        return;
      }
      
      const data = await response.json();
      if (data.totalUsers !== undefined) {
        setTotalUsers(data.totalUsers);
      }
      if (data.onlineUsers !== undefined) {
        setOnlineUsers(data.onlineUsers);
      }
    } catch (error) {
      // Silently handle network errors - stats are not critical
    }
  };

  const updateLastActive = async () => {
    if (!userId) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/activity`,
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );
    } catch (error) {
      // Silently fail - this is not critical
      console.log("Failed to update last active:", error);
    }
  };

  const loadAllUsers = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId,
          },
        }
      );

      if (!response.ok) {
        // Silently return if not authorized (expected for non-admin users)
        if (response.status === 403) {
          return;
        }
        const errorText = await response.text();
        console.error("Failed to load all users:", response.status, response.statusText, errorText);
        return;
      }

      const data = await response.json();
      console.log("Loaded users:", data.users?.length || 0);
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (error) {
      console.error("Load all users error:", error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotificationsEnabled(true);
      toast.success(t('notif.notificationsEnabled'));

      // Show a test notification to confirm it works
      try {
        const testNotification = new Notification("✓ ChozaChat Notifications", {
          body: language === 'ru'
            ? "Вы теперь будете получать уведомления о новых сообщениях"
            : "You will now receive notifications for new messages",
          icon: "/favicon.ico",
          tag: "test-notification",
        });
        setTimeout(() => testNotification.close(), 3000);
      } catch (error) {
        console.error('Failed to show test notification:', error);
      }
    } else if (permission === "denied") {
      toast.error("Notification permission denied. Please try again.");
    }
  };

  // Show notification for new message
  const showMessageNotification = (senderName: string, message: string, senderEmoji?: string, chatData?: { type: string; id: string; name: string }) => {
    if (!notificationsEnabled || notificationPermission !== "granted") return;

    // Check if we should show notifications when active
    if (!showNotificationsWhenActive && document.hasFocus()) return;

    // Check if page is visible - this works even if tab is in background
    const isPageHidden = document.hidden || document.visibilityState === 'hidden';

    // Only show notification if page is hidden OR user enabled notifications when active
    if (!isPageHidden && !showNotificationsWhenActive) return;

    try {
      const notification = new Notification(`${senderEmoji || "💬"} ${senderName}`, {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: chatData ? `chat-${chatData.type}-${chatData.id}` : "chat-message",
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        // Switch to the chat if chatData is provided
        if (chatData) {
          setSelectedChat(chatData);
        }
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/request`;
      console.log('🔵 [ADD FRIEND] ===== STARTING =====');
      console.log('🔵 [ADD FRIEND] URL:', url);
      console.log('🔵 [ADD FRIEND] SERVER_ID:', SERVER_ID);
      console.log('🔵 [ADD FRIEND] friendEmail:', friendEmail);
      console.log('🔵 [ADD FRIEND] userId:', userId);
      console.log('🔵 [ADD FRIEND] projectId:', projectId);
      console.log('🔵 [ADD FRIEND] publicAnonKey:', publicAnonKey ? 'Present (length: ' + publicAnonKey.length + ')' : 'MISSING');
      
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ friendEmail }),
        }
      );
      
      console.log('🔵 [ADD FRIEND] Response status:', response.status);
      console.log('🔵 [ADD FRIEND] Response OK:', response.ok);
      console.log('🔵 [ADD FRIEND] Response statusText:', response.statusText);
      console.log('🔵 [ADD FRIEND] Response URL:', response.url);
      console.log('🔵 [ADD FRIEND] Response type:', response.type);

      let data;
      try {
        const text = await response.text();
        console.log("=== FRIEND REQUEST RESPONSE DEBUG ===");
        console.log("Raw response text:", JSON.stringify(text));
        console.log("Response text first 100 chars:", text.substring(0, 100));
        console.log("Response text last 100 chars:", text.substring(text.length - 100));
        console.log("Response text length:", text.length);
        console.log("Response headers:", Object.fromEntries(response.headers.entries()));
        console.log("Content-Type header:", response.headers.get('content-type'));
        console.log("=== CHECKING FOR 'Route not found' ===");
        console.log("Text includes 'Route not found':", text.includes('Route not found'));
        console.log("Text includes 'route not found' (lowercase):", text.toLowerCase().includes('route not found'));
        console.log("=== END DEBUG ===");
        data = JSON.parse(text);
        console.log("Parsed data:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        toast.error("Check console for response details");
        return;
      }
      
      console.log("Add friend response:", response.status, data);
      
      if (!response.ok) {
        toast.error(data.error || "Failed to add friend");
        return;
      }

      toast.success("Friend request sent successfully!");
      setFriendEmail("");
      setAddFriendOpen(false);
      loadFriends();
    } catch (error) {
      console.error("Add friend error:", error);
      toast.error("Failed to add friend");
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ name: groupName, memberIds: selectedFriendsForGroup, emoji: groupEmoji }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to create group");
        return;
      }

      toast.success("Group created successfully!");
      setGroupName("");
      setGroupEmoji("");
      setShowCreateGroupEmojiPicker(false);
      setSelectedFriendsForGroup([]);
      setCreateGroupOpen(false);
      loadChannels();
    } catch (error) {
      console.error("Create group error:", error);
      toast.error("Failed to create group");
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMembersGroup) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${addMembersGroup.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ memberIds: selectedMembersToAdd }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to add members");
        return;
      }

      toast.success("Members added successfully!");
      setSelectedMembersToAdd([]);
      setAddMembersGroup(null);
      loadChannels();
    } catch (error) {
      console.error("Add members error:", error);
      toast.error("Failed to add members");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${groupId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete group");
        return;
      }

      toast.success("Group deleted successfully!");
      
      // Clear selected chat if this group was selected
      if (selectedChat?.id === groupId) {
        setSelectedChat(null);
      }
      
      loadChannels();
    } catch (error) {
      console.error("Delete group error:", error);
      toast.error("Failed to delete group");
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${channelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete channel");
        return;
      }

      toast.success("Channel deleted successfully!");
      
      // Clear selected chat if this channel was selected
      if (selectedChat?.id === channelId) {
        setSelectedChat(null);
      }
      
      loadChannels();
    } catch (error) {
      console.error("Delete channel error:", error);
      toast.error("Failed to delete channel");
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${channelId}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to leave channel");
        return;
      }

      toast.success("Left channel successfully!");
      
      // Clear selected chat if this channel was selected
      if (selectedChat?.id === channelId) {
        setSelectedChat(null);
      }
      
      loadChannels();
    } catch (error) {
      console.error("Leave channel error:", error);
      toast.error("Failed to leave channel");
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ 
            name: channelName, 
            username: channelUsername,
            emoji: channelEmoji 
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to create channel";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Response is not JSON, use default error message
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      toast.success("Channel created successfully!");
      setChannelName("");
      setChannelUsername("");
      setChannelEmoji("");
      setShowCreateChannelEmojiPicker(false);
      setCreateChannelOpen(false);
      loadChannels();
    } catch (error) {
      console.error("Create channel error:", error);
      toast.error("Failed to create channel");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Backend returns { users, channels }
        // Filter out groups (type === 'group'), only show channels (type === 'channel')
        const filteredChannels = (data.channels || []).filter((ch: any) => ch.type === 'channel');
        const results = [...(data.users || []), ...filteredChannels];
        setSearchResults(results);
      } else {
        console.error("Search failed:", data);
        toast.error(data.error || "Failed to search");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search");
    }
  };

  const handleAddFriendFromSearch = async (friendEmail: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ friendEmail }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to add friend");
        return;
      }

      toast.success("Friend request sent!");
      loadFriends();
    } catch (error) {
      console.error("Add friend error:", error);
      toast.error("Failed to add friend");
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${channelId}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to join channel");
        return;
      }

      toast.success("Joined channel!");
      loadChannels();
    } catch (error) {
      console.error("Join channel error:", error);
      toast.error("Failed to join channel");
    }
  };

  // Handle message edit
  const handleEditMessage = async () => {
    if (!editingMessage || !editMessageText.trim()) {
      console.log('🔧 [CLIENT EDIT] Cancelled - no message or empty text');
      return;
    }

    console.log('🔧 [CLIENT EDIT] ========== STARTING EDIT ==========');
    console.log('🔧 [CLIENT EDIT] Message ID:', editingMessage.id);
    console.log('🔧 [CLIENT EDIT] Current content:', editingMessage.content || editingMessage.text);
    console.log('🔧 [CLIENT EDIT] New content:', editMessageText);
    console.log('🔧 [CLIENT EDIT] Chat:', selectedChat?.type, selectedChat?.id);

    try {
      const editUrl = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/message/${editingMessage.id}`;
      const requestBody = { 
        content: editMessageText,
        chatId: selectedChat?.id,
        chatType: selectedChat?.type
      };
      
      console.log('🔧 [CLIENT EDIT] URL:', editUrl);
      console.log('🔧 [CLIENT EDIT] Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(editUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-User-Id': userId || ''
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🔧 [CLIENT EDIT] Response status:', response.status);

      if (response.ok) {
        const updatedMessage = await response.json();
        console.log('🔧 [CLIENT EDIT] ✅ Server response:', JSON.stringify(updatedMessage, null, 2));
        console.log('🔧 [CLIENT EDIT] Updated content:', updatedMessage.message?.content);
        console.log('🔧 [CLIENT EDIT] Updated text:', updatedMessage.message?.text);
        
        // IMMEDIATELY update the message in the local state for instant UI update
        if (updatedMessage.message) {
          console.log('🔧 [CLIENT EDIT] Updating local state immediately...');
          setMessages(prev => prev.map(m => 
            m.id === editingMessage.id ? updatedMessage.message : m
          ));
          console.log('🔧 [CLIENT EDIT] �� Local state updated!');
        }
        
        // Also reload messages from server to ensure we have the latest data
        if (selectedChat) {
          console.log('🔧 [CLIENT EDIT] Reloading messages from server...');
          setTimeout(async () => {
            await loadMessages(selectedChat.type, selectedChat.id);
            console.log('🔧 [CLIENT EDIT] Messages reloaded from server');
          }, 100);
        }
        
        // Broadcast the edit so other users see it
        if (messageChannelRef.current && selectedChat) {
          await messageChannelRef.current.send({
            type: 'broadcast',
            event: 'message-edited',
            payload: { chatType: selectedChat.type, chatId: selectedChat.id, messageId: editingMessage.id }
          });
        }
        
        setEditingMessage(null);
        setEditMessageText("");
        setMessageText("");
        toast.success("Message updated");
        console.log('🔧 [CLIENT EDIT] ========== EDIT COMPLETE ==========');
      } else {
        const data = await response.json();
        console.log('🔧 [CLIENT EDIT] ❌ Error response:', JSON.stringify(data, null, 2));
        console.log('🔧 [CLIENT EDIT] Status:', response.status);
        toast.error(data.error || "Failed to edit message");
      }
    } catch (error) {
      console.error("🔧 [CLIENT EDIT] ❌ Exception:", error);
      toast.error("Failed to edit message");
    }
  };

  // Handle message delete
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/message/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || ''
          },
          body: JSON.stringify({
            chatId: selectedChat?.id,
            chatType: selectedChat?.type
          })
        }
      );

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        
        // Broadcast the deletion so other users see it
        if (messageChannelRef.current && selectedChat) {
          await messageChannelRef.current.send({
            type: 'broadcast',
            event: 'message-deleted',
            payload: { chatType: selectedChat.type, chatId: selectedChat.id, messageId }
          });
        }
        
        toast.success("Message deleted");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Delete message error:", error);
      toast.error("Failed to delete message");
    }
  };

  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    messageInputRef.current?.focus();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || !userId) return;

    const messageContent = messageText;
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message to UI immediately
    const optimisticMessage: Message = {
      id: tempId,
      senderId: userId,
      content: messageContent,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content || replyingTo.text || '',
        senderName: getSenderName(replyingTo.senderId)
      } : undefined
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setMessageText("");
    setReplyingTo(null);

    try {
      // If it's AI chat, call Gemini API
      if (selectedChat.type === 'ai') {
        // Get API key (user's personal key or admin's global key)
        const userApiKey = localStorage.getItem(`geminiApiKey_${userId}`);

        // Load global API key from Supabase settings (public endpoint)
        let globalApiKey = '';
        try {
          const settingsResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/settings/gemini-api-key`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                "X-User-Id": userId,
              },
            }
          );
          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            globalApiKey = settingsData.geminiApiKey || '';
          }
        } catch (error) {
          console.log('Could not load global API key from settings');
        }

        const apiKey = userApiKey || globalApiKey || '';
        
        if (!apiKey) {
          toast.error('No Gemini API key configured. Please set one in Settings.');
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setMessageText(messageContent);
          return;
        }

        // Replace temp message with actual user message first
        setMessages(prev => prev.map(m => m.id === tempId ? { ...optimisticMessage, id: tempId + '-user' } : m));

        // Add empty AI message to show "Generating response..." shimmer
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage: Message = {
          id: aiMessageId,
          senderId: 'ai-assistant',
          content: '',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: messageContent
                  }]
                }]
              })
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.error?.message || 'Failed to get AI response');
            setMessages(prev => prev.filter(m => m.id === aiMessageId || m.id === tempId + '-user'));
            setMessageText(messageContent);
            return;
          }

          const data = await response.json();
          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

          // Start typewriter effect
          setIsAiTyping(true);
          setAiTypingText("");

          // Typewriter effect
          let currentIndex = 0;
          const typingInterval = setInterval(() => {
            if (currentIndex < aiResponse.length) {
              const nextChar = aiResponse[currentIndex];
              setAiTypingText(prev => prev + nextChar);
              setMessages(prev => prev.map(m => 
                m.id === aiMessageId ? { ...m, content: aiResponse.substring(0, currentIndex + 1) } : m
              ));
              currentIndex++;
            } else {
              clearInterval(typingInterval);
              setIsAiTyping(false);
              setAiTypingText("");
            }
          }, 15); // 15ms per character for smooth typing
          
        } catch (error) {
          console.error('AI API error:', error);
          toast.error('Failed to connect to AI');
          setMessages(prev => prev.filter(m => m.id === aiMessageId || m.id === tempId + '-user'));
          setMessageText(messageContent);
        }
        return;
      }

      // If it's news channel, use news endpoint (admin only)
      if (selectedChat.type === 'news') {
        if (currentUser?.email !== 'mikhail02323@gmail.com') {
          toast.error("Only admin can post to news channel");
          // Remove optimistic message on error
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setMessageText(messageContent);
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/news`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId || '',
            },
            body: JSON.stringify({ content: messageContent }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          toast.error(data.error || "Failed to send news");
          // Remove optimistic message on error
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setMessageText(messageContent);
          return;
        }

        const data = await response.json();
        // Replace temp message with real message from server, preserving replyTo if server didn't include it
        setMessages(prev => prev.map(m => {
          if (m.id === tempId) {
            return {
              ...data.message,
              replyTo: data.message.replyTo || data.message.reply_to || m.replyTo
            };
          }
          return m;
        }));

        // Update last message for news
        setLastMessages(prev => ({
          ...prev,
          'news-news': {
            content: messageContent,
            timestamp: new Date().toISOString()
          }
        }));

        // Broadcast new news message via Realtime using existing channel
        if (messageChannelRef.current) {
          await messageChannelRef.current.send({
            type: 'broadcast',
            event: 'new-message',
            payload: { chatType: 'news', chatId: 'news', message: data.message, senderId: userId, text: messageContent }
          });
        }

        // Broadcast notification to all users (news is global)
        try {
          // Get all users to notify
          const allUsersResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                "X-User-Id": userId || "",
              },
            }
          );

          if (allUsersResponse.ok) {
            const usersData = await allUsersResponse.json();
            const allUserIds = (usersData.users || []).map((u: any) => u.id).filter((id: string) => id !== userId);

            // Broadcast to each user's notification channel
            for (const memberId of allUserIds) {
              const notifChannel = supabase.channel(`user-notifications-${memberId}`);
              await notifChannel.send({
                type: 'broadcast',
                event: 'new-message-notification',
                payload: {
                  senderId: userId,
                  senderName: currentUser?.name || 'Admin',
                  senderEmoji: currentUser?.emoji || '📰',
                  messageText: messageContent,
                  chatType: 'news',
                  chatId: 'news',
                  chatName: 'News Channel',
                }
              });
              await supabase.removeChannel(notifChannel);
            }
          }
        } catch (error) {
          console.error('[Notifications] Failed to broadcast news notifications:', error);
        }

        toast.success("News posted!");
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({
            chatId: selectedChat.id,
            content: messageContent,
            chatType: selectedChat.type,
            replyTo: replyingTo ? {
              id: replyingTo.id,
              content: replyingTo.content || replyingTo.text || '',
              senderName: getSenderName(replyingTo.senderId)
            } : undefined
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("Failed to send message:", response.status, errorData);
        toast.error(errorData.error || "Failed to send message");
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setMessageText(messageContent);
        return;
      }

      const data = await response.json();
      console.log("Message sent successfully");

      // Replace temp message with real message from server, preserving replyTo if server didn't include it
      setMessages(prev => prev.map(m => {
        if (m.id === tempId) {
          return {
            ...data.message,
            replyTo: data.message.replyTo || data.message.reply_to || m.replyTo
          };
        }
        return m;
      }));

      // Update last message
      const chatKey = `${selectedChat.type}-${selectedChat.id}`;
      setLastMessages(prev => ({
        ...prev,
        [chatKey]: {
          content: messageContent,
          timestamp: new Date().toISOString()
        }
      }));

      // Broadcast new message via Realtime using existing channel
      if (messageChannelRef.current) {
        await messageChannelRef.current.send({
          type: 'broadcast',
          event: 'new-message',
          payload: {
            chatType: selectedChat.type,
            chatId: selectedChat.id,
            message: data.message,
            senderId: userId,
            text: messageContent
          }
        });
      }

      // Broadcast notification to all chat members
      try {
        // Get list of members to notify
        let membersToNotify: string[] = [];

        if (selectedChat.type === 'friend') {
          // For DM, notify the other person
          membersToNotify = [selectedChat.id];
        } else if (selectedChat.type === 'group') {
          // For groups, notify all members except sender
          const group = await fetchGroupById(selectedChat.id);
          membersToNotify = (group?.members || []).filter(id => id !== userId);
        } else if (selectedChat.type === 'channel') {
          // For channels, notify all members except sender
          const channel = channels.find(c => c.id === selectedChat.id);
          membersToNotify = (channel?.members || []).filter(id => id !== userId);
        }

        // Broadcast to each member's notification channel
        for (const memberId of membersToNotify) {
          const notifChannel = supabase.channel(`user-notifications-${memberId}`);
          await notifChannel.send({
            type: 'broadcast',
            event: 'new-message-notification',
            payload: {
              senderId: userId,
              senderName: currentUser?.name || 'Someone',
              senderEmoji: currentUser?.emoji,
              messageText: messageContent,
              chatType: selectedChat.type,
              chatId: selectedChat.id,
              chatName: selectedChat.name,
            }
          });
          // Clean up the channel
          await supabase.removeChannel(notifChannel);
        }
      } catch (error) {
        console.error('[Notifications] Failed to broadcast notifications:', error);
        // Don't fail the message send if notifications fail
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageText(messageContent);
    }
  };

  const handleCreatePoll = async (pollData: PollData) => {
    if (!selectedChat || !userId) return;

    try {
      // Check if we're editing an existing poll
      if (editingPollId) {
        // Edit existing poll
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/polls/${editingPollId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId,
            },
            body: JSON.stringify({
              chatId: selectedChat.id,
              chatType: selectedChat.type,
              pollData
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          toast.error(errorData.error || "Failed to edit poll");
          return;
        }

        const data = await response.json();
        
        // Update poll in local state
        setMessages(prev => prev.map(msg => 
          msg.id === editingPollId ? data.message : msg
        ));

        // Reload messages to ensure sync
        if (selectedChat) {
          loadMessages(selectedChat.type, selectedChat.id);
        }

        toast.success("Poll updated!");
        
        // Clear editing state
        setEditingPollId(null);
        setEditingPollData(null);
      } else {
        // Create new poll
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
              'X-User-Id': userId,
            },
            body: JSON.stringify({
              chatId: selectedChat.id,
              content: `📊 Poll: ${pollData.question}`,
              chatType: selectedChat.type,
              poll: pollData
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          toast.error(errorData.error || "Failed to create poll");
          return;
        }

        const data = await response.json();
        
        console.log('📊 Poll created, server response:', data);
        console.log('📊 Message object from server:', data.message);
        console.log('📊 Poll data in message:', data.message?.poll);
        
        // Server now returns poll data, but ensure votes array exists
        if (data.message.poll && !data.message.poll.votes) {
          data.message.poll.votes = [];
        }
        
        // Add poll message to messages
        setMessages(prev => [...prev, data.message]);
        
        // Broadcast new message via Realtime
        if (messageChannelRef.current) {
          await messageChannelRef.current.send({
            type: 'broadcast',
            event: 'new-message',
            payload: { 
              chatType: selectedChat.type, 
              chatId: selectedChat.id,
              message: data.message
            }
          });
        }

        toast.success("Poll created!");
      }
    } catch (error) {
      console.error("Create/Edit poll error:", error);
      toast.error(editingPollId ? "Failed to edit poll" : "Failed to create poll");
    }
  };

  const handleVotePoll = async (pollId: string, optionIds: string[]) => {
    if (!userId || !currentUser) return;

    try {
      // Update poll votes in local state
      setMessages(prev => prev.map(msg => {
        if (msg.id === pollId && msg.poll) {
          const updatedVotes = msg.poll.votes || [];
          // Remove any existing vote from this user
          const filteredVotes = updatedVotes.filter(v => v.userId !== userId);
          // Add new vote
          return {
            ...msg,
            poll: {
              ...msg.poll,
              votes: [...filteredVotes, { userId, optionIds, userName: currentUser.name }]
            }
          };
        }
        return msg;
      }));

      // Send to server
      if (selectedChat) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/polls/${pollId}/vote`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
                'X-User-Id': userId,
              },
              body: JSON.stringify({
                optionIds,
                userName: currentUser.name,
                chatId: selectedChat.id,
                chatType: selectedChat.type
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("Server poll vote failed:", errorData);
            toast.error(errorData.error || "Failed to save vote to server");
          } else {
            console.log("✅ Poll vote saved to server");
          }
        } catch (error) {
          console.error("Server poll endpoint error:", error);
          toast.error("Failed to save vote to server");
        }
      }

      toast.success("Vote recorded!");
    } catch (error) {
      console.error("Vote poll error:", error);
      toast.error("Failed to vote");
    }
  };

  const handleRetractVote = async (pollId: string) => {
    if (!userId) return;

    try {
      // Remove vote from local state
      setMessages(prev => prev.map(msg => {
        if (msg.id === pollId && msg.poll) {
          const updatedVotes = (msg.poll.votes || []).filter(v => v.userId !== userId);
          return {
            ...msg,
            poll: {
              ...msg.poll,
              votes: updatedVotes
            }
          };
        }
        return msg;
      }));

      // Send to server
      if (selectedChat) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/polls/${pollId}/vote`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
                'X-User-Id': userId,
              },
              body: JSON.stringify({
                chatId: selectedChat.id,
                chatType: selectedChat.type
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("Server poll retract failed:", errorData);
            toast.error(errorData.error || "Failed to retract vote on server");
          } else {
            console.log("✅ Poll vote retracted on server");
          }
        } catch (error) {
          console.error("Server poll endpoint error:", error);
          toast.error("Failed to retract vote on server");
        }
      }

      toast.success("Vote retracted!");
    } catch (error) {
      console.error("Retract vote error:", error);
      toast.error("Failed to retract vote");
    }
  };

  const handleEditPoll = async (pollId: string) => {
    if (!userId || !selectedChat) return;

    // Find the poll message
    const pollMessage = messages.find(m => m.id === pollId);
    if (!pollMessage || !pollMessage.poll) {
      toast.error("Poll not found");
      return;
    }

    // Check if anyone has voted
    const hasVotes = (pollMessage.poll.votes || []).length > 0;
    if (hasVotes) {
      toast.error("Cannot edit poll after people have voted");
      return;
    }

    // Set editing state and open poll creator with existing data
    setEditingPollId(pollId);
    setEditingPollData(pollMessage.poll);
    setPollCreatorOpen(true);
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!userId || !selectedChat) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/polls/${pollId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId,
          },
          body: JSON.stringify({
            chatId: selectedChat.id,
            chatType: selectedChat.type
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(errorData.error || "Failed to delete poll");
        return;
      }

      // Remove poll from local state
      setMessages(prev => prev.filter(m => m.id !== pollId));

      // Broadcast deletion via Realtime
      if (messageChannelRef.current) {
        await messageChannelRef.current.send({
          type: 'broadcast',
          event: 'message-deleted',
          payload: { messageId: pollId, chatType: selectedChat.type, chatId: selectedChat.id }
        });
      }

      toast.success("Poll deleted!");
    } catch (error) {
      console.error("Delete poll error:", error);
      toast.error("Failed to delete poll");
    }
  };

  const handleStopVoting = async (pollId: string) => {
    if (!userId || !selectedChat) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/polls/${pollId}/stop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId,
          },
          body: JSON.stringify({
            chatId: selectedChat.id,
            chatType: selectedChat.type
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(errorData.error || "Failed to stop voting");
        return;
      }

      // Update poll in local state
      setMessages(prev => prev.map(msg => {
        if (msg.id === pollId && msg.poll) {
          return {
            ...msg,
            poll: {
              ...msg.poll,
              stopped: true
            }
          };
        }
        return msg;
      }));

      // Reload messages to ensure everyone sees the updated state
      if (selectedChat) {
        loadMessages(selectedChat.type, selectedChat.id);
      }

      toast.success("Voting stopped!");
    } catch (error) {
      console.error("Stop voting error:", error);
      toast.error("Failed to stop voting");
    }
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    
    // Sign out from Supabase (clears session)
    await supabase.auth.signOut();
    
    // Clear all localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("refreshToken");
    
    console.log("Logout complete, redirecting to login...");
    navigate("/");
  };

  const selectFriendChat = (friend: Friend) => {
    const chatId = [userId, friend.id].sort().join(":");
    console.log("Selecting friend chat:", friend.name, "chatId:", chatId);
    
    // Clear messages immediately when switching chats
    setMessages([]);
    
    // Set the selected chat with friend info
    setSelectedChat({ type: 'friend', id: chatId, name: friend.name, friendData: friend });
    
    // Clear unread messages for this chat
    setUnreadMessages(prev => {
      const newUnread = { ...prev };
      delete newUnread[`friend-${chatId}`];
      return newUnread;
    });
    
    // Store last read timestamp
    localStorage.setItem(`lastRead-friend-${chatId}`, new Date().toISOString());
    
    // Load messages for this chat
    loadMessages('friend', chatId);
  };

  const selectGroupChat = (group: Group) => {
    console.log("Selecting group chat:", group.name, "groupId:", group.id);
    
    // Clear messages immediately when switching chats
    setMessages([]);
    
    // Set the selected chat
    setSelectedChat({ type: 'group', id: group.id, name: group.name });
    
    // Clear unread messages for this chat
    setUnreadMessages(prev => {
      const newUnread = { ...prev };
      delete newUnread[`group-${group.id}`];
      return newUnread;
    });
    
    // Store last read timestamp
    localStorage.setItem(`lastRead-group-${group.id}`, new Date().toISOString());
    
    // Load messages for this chat
    loadMessages('group', group.id);
  };

  const selectChannelChat = (channel: Channel) => {
    console.log("Selecting channel chat:", channel.name, "channelId:", channel.id);
    
    // Clear messages immediately when switching chats
    setMessages([]);
    
    // Set the selected chat - include admins and verified status
    setSelectedChat({ 
      type: 'channel', 
      id: channel.id, 
      name: channel.name,
      admins: channel.admins || [],
      verified: channel.verified || false
    });
    
    // Clear unread messages for this chat
    setUnreadMessages(prev => {
      const newUnread = { ...prev };
      delete newUnread[`channel-${channel.id}`];
      return newUnread;
    });
    
    // Store last read timestamp
    localStorage.setItem(`lastRead-channel-${channel.id}`, new Date().toISOString());
    
    // Load messages for this chat
    loadMessages('channel', channel.id);
  };

  const loadChannelDetails = async (channelId: string) => {
    if (!userId) return null;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${channelId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId,
          },
        }
      );
      
      if (!response.ok) {
        console.error('Failed to load channel details:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('📋 Loaded channel details:', data.channel);
      return data.channel;
    } catch (error) {
      console.error('Error loading channel details:', error);
      return null;
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === userId) return t('message.you');
    const friend = friends.find(f => f.id === senderId);
    if (friend) return friend.name;
    const chatMember = chatMembersData[senderId];
    if (chatMember) return chatMember.name;
    const user = allUsers.find(u => u.id === senderId);
    if (user) return user.name;
    return t('message.unknown');
  };

  const getSenderEmoji = (senderId: string) => {
    if (senderId === userId) return currentUser?.emoji;
    const friend = friends.find(f => f.id === senderId);
    if (friend) return friend?.emoji;
    const chatMember = chatMembersData[senderId];
    if (chatMember) return chatMember.emoji;
    const user = allUsers.find(u => u.id === senderId);
    return user?.emoji;
  };

  const getSenderTag = (senderId: string) => {
    if (senderId === userId) return currentUser?.tag;
    const friend = friends.find(f => f.id === senderId);
    if (friend) return friend?.tag;
    const chatMember = chatMembersData[senderId];
    if (chatMember) return chatMember.tag;
    const user = allUsers.find(u => u.id === senderId);
    return user?.tag;
  };

  const getSenderTagColor = (senderId: string) => {
    if (senderId === userId) return currentUser?.tagColor;
    const friend = friends.find(f => f.id === senderId);
    if (friend) return friend?.tagColor;
    const chatMember = chatMembersData[senderId];
    if (chatMember) return chatMember.tagColor;
    const user = allUsers.find(u => u.id === senderId);
    return user?.tagColor;
  };

  const getSenderIsAdmin = (senderId: string) => {
    if (senderId === userId) return isUserAdmin(currentUser);
    const friend = friends.find(f => f.id === senderId);
    if (friend) return isUserAdmin(friend);
    const chatMember = chatMembersData[senderId];
    if (chatMember) return isUserAdmin(chatMember);
    const user = allUsers.find(u => u.id === senderId);
    return isUserAdmin(user);
  };

  const getSenderIsVerified = (senderId: string) => {
    if (senderId === userId) return currentUser?.verified;
    const friend = friends.find(f => f.id === senderId);
    if (friend) return friend?.verified;
    const chatMember = chatMembersData[senderId];
    if (chatMember) return chatMember.verified;
    const user = allUsers.find(u => u.id === senderId);
    return user?.verified;
  };

  const toggleFriendForGroup = (friendId: string) => {
    setSelectedFriendsForGroup(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAcceptFriendRequest = async (requesterId: string) => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/accept`;
      console.log('🔵 [ACCEPT FRIEND] ===== STARTING =====');
      console.log('🔵 [ACCEPT FRIEND] URL:', url);
      console.log('🔵 [ACCEPT FRIEND] SERVER_ID:', SERVER_ID);
      console.log('🔵 [ACCEPT FRIEND] requesterId:', requesterId);
      console.log('🔵 [ACCEPT FRIEND] userId:', userId);
      
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ requesterId }),
        }
      );

      console.log('🔵 [ACCEPT FRIEND] Response status:', response.status);
      console.log('🔵 [ACCEPT FRIEND] Response OK:', response.ok);
      
      const data = await response.json();
      console.log('🔵 [ACCEPT FRIEND] Response data:', data);
      
      if (!response.ok) {
        console.error('🔴 [ACCEPT FRIEND] ERROR:', data.error);
        toast.error(data.error || "Failed to accept friend request");
        return;
      }

      console.log('🟢 [ACCEPT FRIEND] SUCCESS!');
      toast.success("Friend request accepted!");
      loadFriendRequests();
      loadFriends();
    } catch (error) {
      console.error("🔴 [ACCEPT FRIEND] EXCEPTION:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/reject`;
      console.log('🔵 [REJECT FRIEND] ===== STARTING =====');
      console.log('🔵 [REJECT FRIEND] URL:', url);
      console.log('🔵 [REJECT FRIEND] SERVER_ID:', SERVER_ID);
      console.log('🔵 [REJECT FRIEND] requesterId:', requesterId);
      console.log('🔵 [REJECT FRIEND] userId:', userId);
      
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ requesterId }),
        }
      );

      console.log('🔵 [REJECT FRIEND] Response status:', response.status);
      console.log('🔵 [REJECT FRIEND] Response OK:', response.ok);
      
      const data = await response.json();
      console.log('🔵 [REJECT FRIEND] Response data:', data);
      
      if (!response.ok) {
        console.error('🔴 [REJECT FRIEND] ERROR:', data.error);
        toast.error(data.error || "Failed to decline friend request");
        return;
      }

      console.log('🟢 [REJECT FRIEND] SUCCESS!');
      toast.success("Friend request declined!");
      loadFriendRequests();
    } catch (error) {
      console.error("🔴 [REJECT FRIEND] EXCEPTION:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/remove`;
      console.log('🔵 [REMOVE FRIEND] ===== STARTING =====');
      console.log('🔵 [REMOVE FRIEND] URL:', url);
      console.log('🔵 [REMOVE FRIEND] SERVER_ID:', SERVER_ID);
      console.log('🔵 [REMOVE FRIEND] friendId:', friendId);
      console.log('🔵 [REMOVE FRIEND] userId:', userId);
      
      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ friendId }),
        }
      );

      console.log('🔵 [REMOVE FRIEND] Response status:', response.status);
      console.log('🔵 [REMOVE FRIEND] Response OK:', response.ok);
      
      const data = await response.json();
      console.log('🔵 [REMOVE FRIEND] Response data:', data);
      
      if (!response.ok) {
        console.error('🔴 [REMOVE FRIEND] ERROR:', data.error);
        toast.error(data.error || "Failed to remove friend");
        return;
      }

      console.log('🟢 [REMOVE FRIEND] SUCCESS!');
      toast.success("Friend removed!");
      loadFriends();
      if (selectedChat?.type === 'friend' && selectedChat.id.includes(friendId)) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error("🔴 [REMOVE FRIEND] EXCEPTION:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save Gemini API key to localStorage (personal setting)
      if (geminiApiKey) {
        localStorage.setItem(`geminiApiKey_${userId}`, geminiApiKey);
      } else {
        localStorage.removeItem(`geminiApiKey_${userId}`);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ name: editName, username: editUsername, tag: editTag, tagColor: editTagColor, emoji: editEmoji }),
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        toast.error("Server error - invalid response format");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");
      setSettingsOpen(false);
      loadCurrentUser();
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleAdminPanelOpen = () => {
    navigate("/admin");
  };

  const handleAdminPanelClose = () => {
    setAdminPanelOpen(false);
    setSelectedUserForAdmin(null);
    setNewPassword("");
  };

  const handleSelectUserForAdmin = (user: User) => {
    setSelectedUserForAdmin(user);
  };

  const handleResetPassword = async () => {
    if (!selectedUserForAdmin || !newPassword) {
      toast.error("User not selected or password not provided");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ userId: selectedUserForAdmin.id, newPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully!");
      handleAdminPanelClose();
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password");
    }
  };

  const handleChangePassword = async (targetUserId: string, newPassword: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${targetUserId}/password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully!");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Failed to change password");
    }
  };

  // Show loading screen while initial data loads
  if (initialLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-gray-950 relative overflow-hidden">
        {/* Animated floating logos in background */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingLogos.map((logo) => (
            <motion.div
              key={logo.id}
              className="absolute text-blue-500/10 dark:text-blue-400/5"
              animate={{
                left: [`${logo.startX}%`, `${logo.endX}%`, `${logo.startX}%`],
                top: [`${logo.startY}%`, `${logo.endY}%`, `${logo.startY}%`],
                scale: logo.scale,
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: logo.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: logo.delay
              }}
            >
              <MessageCircle className="w-24 h-24" />
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 relative z-10"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 mx-auto"
          >
            <MessageCircle className="w-full h-full text-blue-600 dark:text-blue-400 drop-shadow-lg" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              ChozaChat
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your conversations...</p>
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <motion.div
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-3 h-3 bg-purple-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
            />
            <motion.div
              className="w-3 h-3 bg-pink-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div 
        className={`w-full md:w-80 ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} border-r border-gray-200 dark:border-gray-800 flex flex-col h-full ${selectedChat ? 'hidden md:flex' : 'flex'}`}
        style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={sideMenuOpen} onOpenChange={setSideMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className={`w-80 ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} dark:border-gray-800`}
                style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
              >
                <SheetHeader>
                  <SheetTitle className="dark:text-white">Menu</SheetTitle>
                  <SheetDescription className="dark:text-gray-400">Access settings and options</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Theme Toggle */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start dark:border-gray-700 dark:hover:bg-gray-800"
                      onClick={toggleTheme}
                    >
                      {theme === 'light' ? <Moon className="size-5 mr-2" /> : <Sun className="size-5 mr-2" />}
                      {theme === 'light' ? t('settings.darkMode') : t('settings.lightMode')}
                    </Button>
                  </motion.div>

                  {/* Settings Button */}
                  <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start dark:border-gray-700 dark:hover:bg-gray-800"
                        onClick={() => {
                          setEditName(currentUser?.name || "");
                          setEditUsername(currentUser?.username || "");
                          setEditTag(currentUser?.tag || "");
                          setEditTagColor(currentUser?.tagColor || "");
                          setEditEmoji(currentUser?.emoji || "");
                          setShowEmojiPicker(false);
                          // Load user's personal Gemini API key
                          const userGeminiKey = localStorage.getItem(`geminiApiKey_${userId}`);
                          if (userGeminiKey) {
                            setGeminiApiKey(userGeminiKey);
                          } else {
                            setGeminiApiKey("");
                          }
                          // Load custom languages
                          loadCustomLanguages();
                        }}
                      >
                        <Settings className="size-5 mr-2" />
                        {t('settings.settings')}
                      </Button>
                    </DialogTrigger>
              <DialogContent
                className={`${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} max-w-2xl`}
                style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
              >
                <DialogHeader>
                  <DialogTitle>{t('settings.title')}</DialogTitle>
                  <DialogDescription>{t('settings.updateProfile')}</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile" className="flex items-center justify-center gap-2">
                      <User className="size-4" />
                      <span className="hidden sm:inline">{t('settings.profile')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center justify-center gap-2">
                      <Palette className="size-4" />
                      <span className="hidden sm:inline">{t('settings.appearance')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center justify-center gap-2">
                      <Bell className="size-4" />
                      <span className="hidden sm:inline">{t('settings.notifications')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="extras" className="flex items-center justify-center gap-2">
                      <Settings className="size-4" />
                      <span className="hidden sm:inline">{t('settings.extras')}</span>
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleUpdateProfile}>
                    <TabsContent value="profile" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                      <Label htmlFor="editName">{t('auth.name')}</Label>
                      <Input
                        id="editName"
                        type="text"
                        placeholder="Your name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editUsername">{t('auth.username')}</Label>
                      <Input
                        id="editUsername"
                        type="text"
                        placeholder="username"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="editTag">{t('settings.tag')}</Label>
                      <Input
                        id="editTag"
                        type="text"
                        placeholder={t('settings.tagPlaceholder')}
                        value={editTag}
                        onChange={(e) => setEditTag(e.target.value)}
                      />
                      {(currentUser?.moderator || currentUser?.isModerator) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Leave empty to use default "MOD" tag
                        </p>
                      )}
                      {currentUser?.tag === 'SCAM' && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          You can edit or clear your SCAM tag here
                        </p>
                      )}
                    </div>
                    {(currentUser?.moderator || currentUser?.isModerator) && (
                      <div>
                        <Label>Tag Color (Moderator)</Label>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              editTagColor === '#eab308' ? 'border-white scale-110' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: '#eab308' }}
                            onClick={() => setEditTagColor('#eab308')}
                            title="Yellow"
                          />
                          <button
                            type="button"
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              editTagColor === '#3b82f6' ? 'border-white scale-110' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: '#3b82f6' }}
                            onClick={() => setEditTagColor('#3b82f6')}
                            title="Blue"
                          />
                          <button
                            type="button"
                            className={`w-12 h-12 rounded-lg border-2 transition-all ${
                              editTagColor === '#a855f7' ? 'border-white scale-110' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: '#a855f7' }}
                            onClick={() => setEditTagColor('#a855f7')}
                            title="Purple"
                          />
                        </div>
                        {editTagColor && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Preview: </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold ml-2"
                              style={{
                                backgroundColor: editTagColor,
                                color: '#ffffff',
                              }}
                            >
                              {editTag || 'MOD'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <Label>{t('settings.profileEmoji')}</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="text-4xl">{editEmoji || "😀"}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            {showEmojiPicker ? t('settings.hideEmoji') : t('settings.chooseEmoji')}
                          </Button>
                          {editEmoji && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditEmoji("")}
                            >
                              {t('settings.clear')}
                            </Button>
                          )}
                        </div>
                        {showEmojiPicker && (
                          <ScrollArea className="h-48 border rounded-md p-2">
                            <div className="grid grid-cols-8 gap-1">
                              {COMMON_EMOJIS.map((emoji, idx) => (
                                <motion.button
                                  key={idx}
                                  type="button"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-2xl hover:bg-gray-100 rounded p-1 cursor-pointer"
                                  onClick={() => {
                                    setEditEmoji(emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </motion.button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                          <span className="text-sm">{t('settings.theme')}</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={toggleTheme}
                        >
                          {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                        </Button>
                      </div>

                      {/* Blur Effects Strength */}
                      <div className="p-3 border rounded-lg dark:border-gray-700 space-y-3">
                        <div className="flex flex-col">
                          <Label htmlFor="blurStrength">{t('settings.blurStrength')}</Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('settings.blurDesc')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            id="blurStrength"
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={blurStrength}
                            onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              value={blurStrength}
                              onChange={(e) => setBlurStrength(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                              className="w-16 text-center"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">px</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Bell className="size-4 text-gray-500" />
                            <span className="text-sm">{t('settings.browserNotifications')}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={notificationsEnabled ? "default" : "outline"}
                            onClick={() => {
                              if (!notificationsEnabled) {
                                requestNotificationPermission();
                              } else {
                                setNotificationsEnabled(false);
                                toast.info(t('notif.notificationsDisabled'));
                              }
                            }}
                          >
                            {notificationsEnabled ? t('settings.enabled') : t('settings.enable')}
                          </Button>
                        </div>
                        {notificationPermission === "denied" && (
                          <p className="text-xs text-red-500">
                            {t('notif.notificationsBlocked')}
                          </p>
                        )}

                        {/* Additional notification options when enabled */}
                        {notificationsEnabled && (
                          <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                            <div>
                              <span className="text-sm">{t('settings.notifyWhenActive')}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('settings.notifyWhenActiveDesc')}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant={showNotificationsWhenActive ? "default" : "outline"}
                              onClick={() => {
                                const newValue = !showNotificationsWhenActive;
                                setShowNotificationsWhenActive(newValue);
                                localStorage.setItem('showNotificationsWhenActive', String(newValue));
                                toast.info(newValue ? t('notif.willNotifyActive') : t('notif.wontNotifyActive'));
                              }}
                            >
                              {showNotificationsWhenActive ? t('settings.on') : t('settings.off')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="extras" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div className="space-y-3">
                        <div>
                          <Label>{t('settings.language')}</Label>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={language === 'en' ? 'default' : 'outline'}
                              onClick={() => setLanguage('en')}
                            >
                              🇬🇧 English
                            </Button>
                            <Button
                              type="button"
                              variant={language === 'ru' ? 'default' : 'outline'}
                              onClick={() => setLanguage('ru')}
                            >
                              🇷🇺 Русский
                            </Button>
                          </div>
                        </div>

                        {/* Best Language of the Month */}
                        <BestLanguageOfMonth navigate={navigate} setSettingsOpen={setSettingsOpen} />

                        {/* Saved Custom Languages */}
                        <div className="pt-3 border-t dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <Label>{t('settings.savedLanguages')}</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigate('/lang');
                                setSettingsOpen(false);
                              }}
                            >
                              <Globe className="size-4 mr-1" />
                              {t('settings.createLanguage')}
                            </Button>
                          </div>
                          <SavedLanguages />
                        </div>

                        {/* Gemini API Key */}
                        <div className="pt-3 border-t dark:border-gray-700">
                          <Label htmlFor="geminiApiKey">{t('settings.geminiApiKey')}</Label>
                          <Input
                            id="geminiApiKey"
                            type="password"
                            placeholder="Your personal Gemini API key"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            className="mt-2"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('settings.geminiApiKeyDesc')}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <DialogFooter className="mt-4">
                      <Button type="submit">{t('settings.saveChanges')}</Button>
                    </DialogFooter>
                  </form>
                </Tabs>
              </DialogContent>
            </Dialog>

            {/* Create Group Button */}
            <Dialog open={createGroupOpen} onOpenChange={(open) => {
              setCreateGroupOpen(open);
              if (!open) {
                setGroupEmoji("");
                setShowCreateGroupEmojiPicker(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start dark:border-gray-700 dark:hover:bg-gray-800">
                  <Users className="size-5 mr-2" />
                  {t('groups.createGroup')}
                </Button>
              </DialogTrigger>
              <DialogContent
                className={`${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'}`}
                style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
              >
                <DialogHeader>
                  <DialogTitle className="dark:text-white">{t('groups.createGroup')}</DialogTitle>
                  <DialogDescription>{t('groups.createGroupDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateGroup}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        type="text"
                        placeholder="My Group"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Group Emoji</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="text-4xl">{groupEmoji || "👥"}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateGroupEmojiPicker(!showCreateGroupEmojiPicker)}
                          >
                            {showCreateGroupEmojiPicker ? "Hide" : "Choose Emoji"}
                          </Button>
                          {groupEmoji && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setGroupEmoji("")}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        {showCreateGroupEmojiPicker && (
                          <ScrollArea className="h-48 border rounded-lg p-2">
                            <div className="grid grid-cols-8 gap-1">
                              {COMMON_EMOJIS.map((emoji, idx) => (
                                <motion.button
                                  key={idx}
                                  type="button"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 cursor-pointer"
                                  onClick={() => {
                                    setGroupEmoji(emoji);
                                    setShowCreateGroupEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </motion.button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Select Members</Label>
                      <ScrollArea className="h-48 border rounded-lg p-2 mt-2">
                        {friends.length === 0 ? (
                          <div className="text-center text-gray-500 text-sm py-4">
                            No friends to add
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {friends.map((friend) => (
                              <label key={friend.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedFriendsForGroup.includes(friend.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFriendsForGroup([...selectedFriendsForGroup, friend.id]);
                                    } else {
                                      setSelectedFriendsForGroup(selectedFriendsForGroup.filter(id => id !== friend.id));
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="dark:text-white">{friend.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit">Create Group</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Create Channel Button */}
            <Dialog open={createChannelOpen} onOpenChange={(open) => {
              setCreateChannelOpen(open);
              if (!open) {
                setChannelEmoji("");
                setShowCreateChannelEmojiPicker(false);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start dark:border-gray-700 dark:hover:bg-gray-800">
                  <Hash className="size-5 mr-2" />
                  {t('channels.createChannel')}
                </Button>
              </DialogTrigger>
              <DialogContent
                className={`${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'}`}
                style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
              >
                <DialogHeader>
                  <DialogTitle className="dark:text-white">{t('channels.createChannel')}</DialogTitle>
                  <DialogDescription>{t('channels.createChannelDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateChannel}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="channelName">Channel Name</Label>
                      <Input
                        id="channelName"
                        type="text"
                        placeholder="My Channel"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="channelUsername">Channel Username</Label>
                      <Input
                        id="channelUsername"
                        type="text"
                        placeholder="mychannel"
                        value={channelUsername}
                        onChange={(e) => setChannelUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Users can find your channel by this username
                      </p>
                    </div>
                    <div>
                      <Label>Channel Emoji</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="text-4xl">{channelEmoji || "📢"}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateChannelEmojiPicker(!showCreateChannelEmojiPicker)}
                          >
                            {showCreateChannelEmojiPicker ? "Hide" : "Choose Emoji"}
                          </Button>
                          {channelEmoji && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setChannelEmoji("")}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        {showCreateChannelEmojiPicker && (
                          <ScrollArea className="h-48 border rounded-lg p-2">
                            <div className="grid grid-cols-8 gap-1">
                              {COMMON_EMOJIS.map((emoji, idx) => (
                                <motion.button
                                  key={idx}
                                  type="button"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 cursor-pointer"
                                  onClick={() => {
                                    setChannelEmoji(emoji);
                                    setShowCreateChannelEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </motion.button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit">Create Channel</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Logout Button */}
            <Button variant="outline" className="w-full justify-start text-red-600 dark:border-gray-700 dark:hover:bg-gray-800" onClick={handleLogout}>
              <LogOut className="size-5 mr-2" />
              {t('settings.logout')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-blue-600 text-white">
            {currentUser?.emoji ? (
              <span className="text-2xl">{currentUser.emoji}</span>
            ) : (
              currentUser?.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1.5">
            <span key="name" className="font-semibold dark:text-white">{currentUser?.name}</span>
            {currentUser?.verified && <span key="verified">{renderVerifiedBadge()}</span>}
            {renderTagBadge(currentUser?.tag, isUserAdmin(currentUser), currentUser?.tagColor) && <span key="tag">{renderTagBadge(currentUser?.tag, isUserAdmin(currentUser), currentUser?.tagColor)}</span>}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">@{currentUser?.username}</div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {currentUser?.email === 'mikhail02323@gmail.com' && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleAdminPanelOpen}
          title="Admin Panel"
        >
          <Shield className="size-5 text-red-600" />
        </Button>
      )}
      {(currentUser?.moderator || currentUser?.isModerator) && (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setModeratorPanelOpen(true)}
          title="Moderator Panel"
        >
          <Shield className="size-5 text-yellow-600" />
        </Button>
      )}
    </div>
  </div>

  <div className="flex-1 flex flex-col min-h-0">
    {/* Search Section */}
    <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t('friends.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="pl-10 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      {searchResults.length > 0 && (
        <ScrollArea className="mt-2 max-h-64 border rounded-lg dark:border-gray-700">
          <div className="p-2 space-y-1">
            {searchResults.map((result: any) => (
              <div key={result.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className={result.type === 'channel' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}>
                    {result.emoji ? (
                      <span className="text-xl">{result.emoji}</span>
                    ) : result.type === 'channel' ? (
                      <Hash className="size-4" />
                    ) : (
                      result.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium dark:text-white truncate">{result.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{result.username || result.email?.split('@')[0]}
                  </div>
                </div>
                {result.type === 'channel' ? (
                  <Button size="sm" onClick={() => handleJoinChannel(result.id)}>
                    Join
                  </Button>
                ) : result.email ? (
                  <Button size="sm" onClick={() => handleAddFriendFromSearch(result.email)}>
                    <UserPlus className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>

    <div className="p-2 space-y-2 flex-shrink-0">
      <Dialog open={friendRequestsOpen} onOpenChange={setFriendRequestsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline" onClick={() => setFriendRequestsOpen(true)}>
            <Bell className="size-4 mr-2" />
            {t('friends.friendRequests')}
            {friendRequests.length > 0 && (
              <Badge className="ml-auto" variant="destructive">
                {friendRequests.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('friends.friendRequests')}</DialogTitle>
            <DialogDescription>
              {friendRequests.length === 0 ? t('friends.noPendingRequests') : `${friendRequests.length} ${friendRequests.length > 1 ? t('friends.pendingRequests') : t('friends.pendingRequest')}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {friendRequests.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {t('friends.noFriendRequests')}
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.requesterId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white">
                        {request.requester.emoji ? (
                          <span className="text-2xl">{request.requester.emoji}</span>
                        ) : (
                          request.requester.name?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{request.requester.name}</div>
                      <div className="text-xs text-gray-500">{request.requester.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => handleAcceptFriendRequest(request.requesterId)}
                      >
                        <Check className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeclineFriendRequest(request.requesterId)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>

    <ScrollArea className="flex-1 px-2 min-h-0">
      {/* News Channel - Small and less noticeable */}
      <motion.button
        whileHover={{ scale: 1.01, x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setMessages([]);
          setSelectedChat({ type: 'news', id: 'news', name: t('main.newsChannel') });
          // Clear unread messages for news
          setUnreadMessages(prev => {
            const newUnread = { ...prev };
            delete newUnread['news'];
            return newUnread;
          });
          localStorage.setItem('lastRead-news', new Date().toISOString());
          loadMessages('news', 'news');
        }}
        className={`w-full p-2 rounded-md flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition mb-3 border-b border-gray-100 dark:border-gray-700 relative ${
          selectedChat?.type === 'news' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
        }`}
      >
        <div className="text-xl">📰</div>
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('main.newsChannel')}</div>
        </div>
        {unreadMessages['news'] > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-[20px] rounded-full">
              {unreadMessages['news']}
            </Badge>
          </motion.div>
        )}
      </motion.button>

      {/* AI Assistant */}
      <motion.button
        whileHover={{ scale: 1.01, x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedChat({ type: 'ai', id: 'ai-assistant', name: t('main.aiAssistant') });
          // Show welcome message
          setMessages([{
            id: 'ai-welcome',
            senderId: 'ai-assistant',
            content: language === 'ru'
              ? 'Здравствуйте! Я ваш ИИ-помощник на базе Gemini 2.5 Flash. Чем могу помочь?'
              : 'Hello! I\'m your AI Assistant powered by Gemini 2.5 Flash. How can I help you today?',
            timestamp: new Date().toISOString()
          }]);
        }}
        className={`w-full p-2 rounded-md flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition mb-3 border-b border-gray-100 dark:border-gray-700 relative ${
          selectedChat?.type === 'ai' ? 'bg-purple-50 dark:bg-purple-900/20' : ''
        }`}
      >
        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('main.aiAssistant')}</div>
        </div>
      </motion.button>

      {friends.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          {t('main.noFriends')}
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
          {friends.map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer ${
                selectedChat?.type === 'friend' && selectedChat.id.includes(friend.id)
                  ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border-l-4 border-blue-500'
                  : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700'
              }`}
            >
              <button
                onClick={() => selectFriendChat(friend)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className="bg-gray-300 dark:bg-gray-700">
                    {friend.emoji ? (
                      <span className="text-2xl">{friend.emoji}</span>
                    ) : (
                      friend.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium dark:text-white truncate">{friend.name}</span>
                    {friend.verified && <span className="flex-shrink-0">{renderVerifiedBadge()}</span>}
                    {(() => {
                      const badge = renderTagBadge(friend.tag, isUserAdmin(friend), friend.tagColor);
                      return badge ? <span className="flex-shrink-0">{badge}</span> : null;
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {(() => {
                      const chatId = [userId, friend.id].sort().join(":");
                      const chatKey = `friend-${chatId}`;
                      const lastMsg = lastMessages[chatKey];
                      return lastMsg ? lastMsg.content : t('message.noMessages');
                    })()}
                  </div>
                </div>
              </button>
              {(() => {
                const chatId = [userId, friend.id].sort().join(":");
                const unreadCount = unreadMessages[`friend-${chatId}`];
                return unreadCount > 0 ? (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-[20px] rounded-full flex-shrink-0">
                    {unreadCount}
                  </Badge>
                ) : null;
              })()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      showConfirm(
                        `${t('friends.removeFriend')} ${friend.name}?`,
                        `${t('friends.confirmRemove')} ${friend.name}?`,
                        () => handleRemoveFriend(friend.id),
                        'destructive'
                      );
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    {t('friends.removeFriend')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}

      {/* Groups Section */}
      <div className="mt-4 mb-2 px-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('main.groups')}</h3>
      </div>
      {channels.filter(c => c.id !== 'news' && c.type !== 'channel').length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-4 px-2">
          {t('main.noGroups')}
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
          {channels.filter(c => c.id !== 'news' && c.type !== 'channel').map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer ${
                selectedChat?.id === group.id ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-l-4 border-purple-500' : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700'
              }`}
            >
              <button
                onClick={() => selectGroupChat(group)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className="bg-purple-600 text-white">
                    {group.emoji ? (
                      <span className="text-2xl">{group.emoji}</span>
                    ) : (
                      <Users className="size-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <span className="font-medium dark:text-white truncate block">{group.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                    {(() => {
                      const chatKey = `group-${group.id}`;
                      const lastMsg = lastMessages[chatKey];
                      return lastMsg ? lastMsg.content : t('message.noMessages');
                    })()}
                  </span>
                </div>
              </button>
              {(() => {
                const unreadCount = unreadMessages[`group-${group.id}`];
                return unreadCount > 0 ? (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-[20px] rounded-full flex-shrink-0">
                    {unreadCount}
                  </Badge>
                ) : null;
              })()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setEditGroupName(group.name);
                      setEditGroupEmoji(group.emoji || "");
                    }}
                  >
                    <Edit className="size-4 mr-2" />
                    {t('groups.editGroup')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddMembersGroup(group);
                    }}
                  >
                    <UserPlus className="size-4 mr-2" />
                    {t('groups.addMembers')}
                  </DropdownMenuItem>
                  {group.creatorId === userId && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm(
                          `${t('groups.deleteGroup')} "${group.name}"?`,
                          t('groups.confirmDelete'),
                          () => handleDeleteGroup(group.id),
                          'destructive'
                        );
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      {t('groups.deleteGroup')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}

      {/* Channels Section */}
      <div className="mt-4 mb-2 px-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('main.channels')}</h3>
      </div>
      {channels.filter(c => c.type === 'channel').length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-4 px-2">
          {t('main.noChannels')}
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
          {channels.filter(c => c.type === 'channel').map((channel, index) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer ${
                selectedChat?.id === channel.id ? 'bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/40 dark:to-teal-900/40 border-l-4 border-green-500' : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700'
              }`}
            >
              <button
                onClick={() => selectChannelChat(channel)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className="bg-green-600 text-white">
                    {channel.emoji ? (
                      <span className="text-2xl">{channel.emoji}</span>
                    ) : (
                      <Hash className="size-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium dark:text-white truncate">{channel.name}</span>
                    {channel.verified && <span className="flex-shrink-0">{renderVerifiedBadge()}</span>}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                    {(() => {
                      const chatKey = `channel-${channel.id}`;
                      const lastMsg = lastMessages[chatKey];
                      return lastMsg ? lastMsg.content : t('message.noMessages');
                    })()}
                  </span>
                </div>
              </button>
              {(() => {
                const unreadCount = unreadMessages[`channel-${channel.id}`];
                return unreadCount > 0 ? (
                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 h-5 min-w-[20px] rounded-full flex-shrink-0">
                    {unreadCount}
                  </Badge>
                ) : null;
              })()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {channel.creatorId === userId && (
                    <>
                      <DropdownMenuItem
                        onClick={async (e) => {
                          e.stopPropagation();
                          // Load detailed channel info and open ProfilePanel
                          const detailedChannel = await loadChannelDetails(channel.id);
                          if (detailedChannel) {
                            setProfilePanelData({ type: 'channel', data: detailedChannel });
                            setProfilePanelOpen(true);
                          }
                        }}
                      >
                        <Edit className="size-4 mr-2" />
                        {t('channels.manageChannel')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          showConfirm(
                            `${t('channels.deleteChannel')} "${channel.name}"?`,
                            t('channels.confirmDelete'),
                            () => handleDeleteChannel(channel.id),
                            'destructive'
                          );
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        {t('channels.deleteChannel')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {channel.creatorId !== userId && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm(
                          `${t('channels.leaveChannel')} "${channel.name}"?`,
                          t('channels.confirmLeave'),
                          () => handleLeaveChannel(channel.id),
                          'default'
                        );
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      {t('channels.leaveChannel')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </ScrollArea>
  </div>
</div>

      {/* Chat Area - Full width on mobile when chat is selected */}
      <div className={`flex-1 flex flex-col h-full ${!selectedChat ? 'hidden md:flex' : 'flex w-full'}`}>
        {selectedChat ? (
          <motion.div
            key={`${selectedChat.type}-${selectedChat.id}`}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col h-full"
          >
            {/* Chat Header with Back Button on Mobile */}
            <div 
              className={`h-16 ${blurStrength > 0 ? 'bg-gradient-to-r from-blue-50/60 via-purple-50/60 to-pink-50/60 dark:from-gray-900/60 dark:via-gray-800/60 dark:to-gray-900/60' : 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'} border-b-2 border-blue-200 dark:border-blue-900 flex items-center px-4 md:px-6 flex-shrink-0 shadow-md`}
              style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
            >
              {/* Back button - Only visible on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="md:hidden mr-2"
              >
                <ArrowLeft className="size-5" />
              </Button>
              
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 -ml-2 transition-colors"
                onClick={async () => {
                  if (selectedChat.type === 'news' || selectedChat.type === 'ai') return; // Don't show profile for news or AI
                  
                  if (selectedChat.type === 'friend' && selectedChat.friendData) {
                    setProfilePanelData({ type: 'user', data: selectedChat.friendData });
                    setProfilePanelOpen(true);
                  } else if (selectedChat.type === 'group') {
                    const groupData = channels.find(g => g.id === selectedChat.id);
                    if (groupData) {
                      setProfilePanelData({ type: 'group', data: groupData });
                      setProfilePanelOpen(true);
                    }
                  } else if (selectedChat.type === 'channel') {
                    // Load detailed channel info with members
                    const detailedChannel = await loadChannelDetails(selectedChat.id);
                    if (detailedChannel) {
                      setProfilePanelData({ type: 'channel', data: detailedChannel });
                      setProfilePanelOpen(true);
                    }
                  }
                }}
              >
                <Avatar>
                  <AvatarFallback className={selectedChat.type === 'group' ? 'bg-purple-600 text-white' : selectedChat.type === 'news' ? 'bg-yellow-100 dark:bg-yellow-900' : selectedChat.type === 'ai' ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white' : 'bg-gray-300 dark:bg-gray-700'}>
                    {selectedChat.type === 'news' ? (
                      <span className="text-2xl">📰</span>
                    ) : selectedChat.type === 'ai' ? (
                      <Sparkles className="size-5" />
                    ) : selectedChat.type === 'group' ? (
                      channels.find(g => g.id === selectedChat.id)?.emoji ? (
                        <span className="text-2xl">{channels.find(g => g.id === selectedChat.id)?.emoji}</span>
                      ) : (
                        <Users className="size-5" />
                      )
                    ) : (
                      selectedChat.friendData?.emoji ? (
                        <span className="text-2xl">{selectedChat.friendData.emoji}</span>
                      ) : (
                        selectedChat.name?.charAt(0)?.toUpperCase() || '?'
                      )
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold dark:text-white">{selectedChat.name}</span>
                    {selectedChat.type === 'friend' && selectedChat.friendData?.verified && renderVerifiedBadge()}
                    {selectedChat.type === 'channel' && selectedChat.verified && renderVerifiedBadge()}
                    {selectedChat.type === 'friend' && renderTagBadge(selectedChat.friendData?.tag, isUserAdmin(selectedChat.friendData), selectedChat.friendData?.tagColor)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedChat.type === 'group' ? t('main.groupChat') : selectedChat.type === 'news' ? t('main.newsChannel') : selectedChat.type === 'ai' ? 'Gemini 2.5 Flash' : selectedChat.type === 'channel' ? t('main.channel') : t('main.directMessage')}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="p-2 sm:p-4 md:p-6 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === userId;
                    const isAI = message.senderId === 'ai-assistant';
                    
                    // Debug log for poll messages
                    if (message.poll) {
                      console.log('🎯 Rendering poll message:', {
                        id: message.id,
                        hasPoll: !!message.poll,
                        pollQuestion: message.poll?.question,
                        pollOptions: message.poll?.options?.length
                      });
                    }
                    
                    // Check if this looks like a poll message but poll data is missing
                    const looksLikePoll = !message.poll && message.content?.startsWith('📊 Poll:');
                    if (looksLikePoll) {
                      console.warn('⚠️ Poll message missing poll data:', message.id, message.content);
                    }
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ 
                          duration: 0.3,
                          delay: index * 0.02,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.poll ? (
                          <div className="w-[85%] max-w-[85%] sm:w-full sm:max-w-2xl">
                            <PollMessage
                              poll={message.poll}
                              pollId={message.id}
                              votes={message.poll.votes || []}
                              currentUserId={userId || ''}
                              onVote={handleVotePoll}
                              onRetractVote={handleRetractVote}
                              isOwnPoll={isOwn}
                              totalChatMembers={
                                selectedChat.type === 'friend' 
                                  ? 1 
                                  : selectedChat.type === 'group'
                                  ? (channels.find(c => c.id === selectedChat.id && c.type === 'group')?.memberCount || 1) - 1
                                  : selectedChat.type === 'channel'
                                  ? (channels.find(c => c.id === selectedChat.id && c.type === 'channel')?.memberCount || 1) - 1
                                  : undefined
                              }
                              onRefreshPoll={() => {
                                if (selectedChat) {
                                  loadMessages(selectedChat.type, selectedChat.id);
                                }
                              }}
                              onEditPoll={handleEditPoll}
                              onDeletePoll={handleDeletePoll}
                              onStopVoting={handleStopVoting}
                              senderId={message.senderId}
                            />
                          </div>
                        ) : looksLikePoll ? (
                          <div className="max-w-md p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700">
                            <div className="flex items-start gap-2">
                              <span className="text-2xl">⚠️</span>
                              <div className="flex-1">
                                <div className="font-semibold text-yellow-800 dark:text-yellow-200">Poll Data Missing</div>
                                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                  This poll's data is not available. The backend needs to return poll data in the message response.
                                </div>
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-mono">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <MessageItem
                            message={message}
                            isOwn={isOwn}
                            isAI={isAI}
                            chatType={selectedChat.type as 'friend' | 'group' | 'news' | 'channel' | 'ai'}
                            getSenderName={getSenderName}
                            getSenderEmoji={getSenderEmoji}
                            getSenderIsVerified={getSenderIsVerified}
                            getSenderTag={getSenderTag}
                            getSenderIsAdmin={getSenderIsAdmin}
                            getSenderTagColor={getSenderTagColor}
                            renderVerifiedBadge={renderVerifiedBadge}
                            renderTagBadge={renderTagBadge}
                            onReply={handleReplyToMessage}
                            onEdit={(msg, content) => {
                              setEditingMessage(msg);
                              setEditMessageText(content);
                              setMessageText(content);
                            }}
                            onDelete={handleDeleteMessage}
                            isRead={(() => {
                              // Only show read status for DM (friend) chats
                              if (selectedChat.type !== 'friend' || !isOwn) return false;
                              // Check if the other user (not sender) has read this message
                              const readBy = message.readBy || [];
                              return readBy.some(id => id !== message.senderId);
                            })()}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />

                {/* Read/Sent indicator for DMs */}
                {selectedChat.type === 'friend' && messages.length > 0 && (() => {
                  // Get the last message sent by current user
                  const myMessages = messages.filter(m => m.senderId === userId);
                  if (myMessages.length === 0) return null;

                  const lastMyMessage = myMessages[myMessages.length - 1];
                  const readBy = lastMyMessage.readBy || [];
                  const isRead = readBy.some(id => id !== userId);

                  return (
                    <div className="text-center py-3">
                      <span className="text-base font-semibold text-gray-600 dark:text-gray-300">
                        {isRead ? t('message.read') : t('message.sent')}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div 
              className={`p-3 md:p-4 ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} border-t border-gray-200 dark:border-gray-800 flex-shrink-0`}
              style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
            >
              {/* Hide input for news channel if not admin */}
              {selectedChat.type === 'news' && currentUser?.email !== 'mikhail02323@gmail.com' ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                  {t('message.newsReadOnly')}
                </div>
              ) : selectedChat.type === 'channel' && !selectedChat.admins?.includes(userId || '') ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                  {t('message.channelAdminOnly')}
                </div>
              ) : (
                <MessageInput
                  messageText={messageText}
                  setMessageText={setMessageText}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  editingMessage={editingMessage}
                  setEditingMessage={setEditingMessage}
                  setEditMessageText={setEditMessageText}
                  onSubmit={handleSendMessage}
                  onEdit={handleEditMessage}
                  onStickerClick={() => setStickerPickerOpen(true)}
                  onAttachClick={() => setPollCreatorOpen(true)}
                  getSenderName={getSenderName}
                  messageInputRef={messageInputRef}
                  messagesEndRef={messagesEndRef}
                />
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-center text-gray-500 dark:text-gray-400 px-4">
              <MessageCircle className="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">{t('main.selectChat')}</p>
              <p className="text-sm mt-2">{t('main.selectChatDesc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Panel */}
      <Dialog open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
        <DialogContent 
          className={`max-w-2xl ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'}`}
          style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
        >
          <DialogHeader>
            <DialogTitle>Admin Panel</DialogTitle>
            <DialogDescription>Manage users, view stats, and fun global functions</DialogDescription>
          </DialogHeader>
          
          <Tabs value={adminTab} onValueChange={(value) => {
            setAdminTab(value as 'users' | 'settings' | 'troll' | 'announcements' | 'channels');
            // Clear selections when switching tabs
            if (value === 'channels') {
              setSelectedChannelsForDelete([]);
              setChannelSearchQuery('');
            }
          }}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="troll">Troll Zone</TabsTrigger>
            </TabsList>
            
            {/* Users Tab */}
            <TabsContent value="users">
              <ScrollArea className="max-h-96">
            <div className="space-y-3 pr-4">
              {allUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No users to manage
                </div>
              ) : (
                <>
                {allUsers.map((user) => (
                  <div key={user.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-600 text-white">
                          {user.emoji ? (
                            <span className="text-2xl">{user.emoji}</span>
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || '?'
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    {user.id !== userId && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            showConfirm(
                              `Delete user ${user.name}?`,
                              `Are you sure you want to permanently delete this user?`,
                              async () => {
                                try {
                                  const response = await fetch(
                                    `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${publicAnonKey}`,
                                      'X-User-Id': userId || '',
                                    },
                                  }
                                );
                                const data = await response.json();
                                if (!response.ok) {
                                  toast.error(data.error || "Failed to delete user");
                                  return;
                                }
                                toast.success("User deleted!");
                                handleAdminPanelOpen();
                              } catch (error) {
                                console.error("Delete user error:", error);
                                toast.error("Failed to delete user");
                              }
                            },
                            'destructive'
                          );
                        }}
                        >
                          Delete User
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setPromptConfig({
                              title: 'Change Password',
                              description: `Enter new password for ${user.name}`,
                              placeholder: 'New password',
                              type: 'password',
                              onConfirm: (value) => {
                                if (value) {
                                  handleChangePassword(user.id, value);
                                }
                              }
                            });
                            setPromptOpen(true);
                          }}
                        >
                          Change Password
                        </Button>
                      </div>
                    )}
                    {user.id !== userId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          showConfirm(
                            `Mark password as compromised?`,
                            `Mark ${user.name}'s password as compromised?`,
                            async () => {
                            try {
                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/mark-compromised`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${publicAnonKey}`,
                                    'X-User-Id': userId || '',
                                  },
                                }
                              );
                              const data = await response.json();
                              if (!response.ok) {
                                toast.error(data.error || "Failed to mark password as compromised");
                                return;
                              }
                              toast.success(`${user.name}'s password marked as compromised. They will be prompted to change it on next login.`);
                            } catch (error) {
                              console.error("Mark password compromised error:", error);
                              toast.error("Failed to mark password as compromised");
                            }
                          },
                          'default'
                        );
                      }}
                      >
                        Mark Password as Compromised
                      </Button>
                    )}
                    {user.id !== userId && (
                      <Button
                        size="sm"
                        variant={user.verified ? "default" : "outline"}
                        className="w-full"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/verify`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${publicAnonKey}`,
                                  'X-User-Id': userId || '',
                                },
                                body: JSON.stringify({ verified: !user.verified }),
                              }
                            );
                            const data = await response.json();
                            if (!response.ok) {
                              toast.error(data.error || "Failed to toggle verification");
                              return;
                            }
                            toast.success(`${user.name} ${!user.verified ? 'verified' : 'unverified'}!`);
                            handleAdminPanelOpen(); // Refresh user list
                          } catch (error) {
                            console.error("Toggle verification error:", error);
                            toast.error("Failed to toggle verification");
                          }
                        }}
                      >
                        {user.verified ? '✓ Verified' : 'Verify User'}
                      </Button>
                    )}
                    {user.id !== userId && user.tag !== 'SCAM' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          showConfirm(
                            `Mark as SCAM?`,
                            `Mark ${user.name} as SCAM? This will set their tag to "SCAM" with a red background.`,
                            async () => {
                            try {
                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/mark-scam`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${publicAnonKey}`,
                                    'X-User-Id': userId || '',
                                  },
                                }
                              );
                              const data = await response.json();
                              if (!response.ok) {
                                toast.error(data.error || "Failed to mark as scam");
                                return;
                              }
                              toast.success(`${user.name} marked as SCAM!`);
                              handleAdminPanelOpen(); // Refresh user list
                            } catch (error) {
                              console.error("Mark as scam error:", error);
                              toast.error("Failed to mark as scam");
                            }
                          },
                          'destructive'
                        );
                      }}
                      >
                        ⚠️ Mark as SCAM
                      </Button>
                    )}
                    {user.id !== userId && user.tag === 'SCAM' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                        onClick={() => {
                          showConfirm(
                            `Remove SCAM tag?`,
                            `Remove SCAM tag from ${user.name}? This will clear their tag.`,
                            async () => {
                            try {
                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/remove-scam`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${publicAnonKey}`,
                                    'X-User-Id': userId || '',
                                  },
                                }
                              );
                              const data = await response.json();
                              if (!response.ok) {
                                toast.error(data.error || "Failed to remove SCAM tag");
                                return;
                              }
                              toast.success(`SCAM tag removed from ${user.name}!`);
                              handleAdminPanelOpen(); // Refresh user list
                            } catch (error) {
                              console.error("Remove SCAM tag error:", error);
                              toast.error("Failed to remove SCAM tag");
                            }
                          },
                          'default'
                        );
                      }}
                      >
                        ✓ Remove SCAM Tag
                      </Button>
                    )}
                  </div>
                ))}
                </>
              )}
            </div>
          </ScrollArea>
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-4">
                {/* Stats Container */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Server Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="size-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-center">{totalUsers}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">Total Users</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                      <div className="flex items-center justify-center mb-2">
                        <div className="relative">
                          <Users className="size-6 text-green-600 dark:text-green-400" />
                          <div className="absolute -top-0.5 -right-0.5 size-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 text-center">{onlineUsers}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">Online Now</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📢 Global Announcement Banner</h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Create a banner that will be shown to all users on the site. Users will see it once (tracked via localStorage).
                  </p>
                </div>

                {currentAnnouncement && currentAnnouncement.enabled && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">✅ Active Announcement</h4>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">Currently visible to users who haven't dismissed it</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/announcement/disable`,
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${publicAnonKey}`,
                                  'X-User-Id': userId || '',
                                },
                              }
                            );
                            if (response.ok) {
                              toast.success('Announcement disabled!');
                              setCurrentAnnouncement({ ...currentAnnouncement, enabled: false });
                            }
                          } catch (error) {
                            toast.error('Failed to disable announcement');
                          }
                        }}
                      >
                        Disable
                      </Button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-200 dark:border-green-700">
                      <div className="font-semibold text-sm mb-1">{currentAnnouncement.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{currentAnnouncement.description}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="announcement-title">Title</Label>
                    <Input
                      id="announcement-title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Important Update!"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="announcement-desc">Description</Label>
                    <Input
                      id="announcement-desc"
                      value={announcementDescription}
                      onChange={(e) => setAnnouncementDescription(e.target.value)}
                      placeholder="We've added amazing new features..."
                      className="mt-1"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      if (!announcementTitle || !announcementDescription) {
                        toast.error('Please fill in both title and description');
                        return;
                      }

                      try {
                        const response = await fetch(
                          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/announcement`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${publicAnonKey}`,
                              'X-User-Id': userId || '',
                            },
                            body: JSON.stringify({
                              title: announcementTitle,
                              description: announcementDescription,
                              enabled: true,
                            }),
                          }
                        );

                        const data = await response.json();
                        if (response.ok) {
                          toast.success('Announcement created and enabled!');
                          setCurrentAnnouncement(data.announcement);
                          setAnnouncementTitle('');
                          setAnnouncementDescription('');
                        } else {
                          toast.error(data.error || 'Failed to create announcement');
                        }
                      } catch (error) {
                        console.error('Create announcement error:', error);
                        toast.error('Failed to create announcement');
                      }
                    }}
                  >
                    📢 Create & Enable Announcement
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Troll Zone Tab */}
            <TabsContent value="troll">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fun global functions that affect all active users! 🎉
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${trollChannelConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {trollChannelConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <Button
                  className="w-full"
                  onClick={async () => {
                    setPromptConfig({
                      title: 'Global Broadcast',
                      description: 'Enter a message to broadcast to all users',
                      placeholder: 'Your message...',
                      multiline: true,
                      onConfirm: async (message) => {
                        if (message) {
                          try {
                            if (trollChannelRef.current) {
                              console.log('[Troll] Sending broadcast:', message);
                              const result = await trollChannelRef.current.send({
                                type: 'broadcast',
                                event: 'troll-action',
                                payload: { action: 'broadcast', message }
                              });
                              console.log('[Troll] Broadcast send result:', result);
                              toast.success("Broadcast sent to all users!");
                            } else {
                              console.error('[Troll] Channel not ready');
                              toast.error("Troll channel not ready");
                            }
                          } catch (error) {
                            console.error("[Troll] Broadcast error:", error);
                            toast.error("Failed to send broadcast");
                          }
                        }
                      }
                    });
                    setPromptOpen(true);
                  }}
                >
                  📢 Global Broadcast
                </Button>
                
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      if (trollChannelRef.current) {
                        console.log('[Troll] Sending shake action');
                        const result = await trollChannelRef.current.send({
                          type: 'broadcast',
                          event: 'troll-action',
                          payload: { action: 'shake' }
                        });
                        console.log('[Troll] Shake send result:', result);
                        toast.success("Screen shake activated for all users!");
                      } else {
                        console.error('[Troll] Channel not ready');
                        toast.error("Troll channel not ready");
                      }
                    } catch (error) {
                      console.error("[Troll] Shake error:", error);
                      toast.error("Failed to activate shake");
                    }
                  }}
                >
                  📳 Screen Shake
                </Button>
                
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      if (trollChannelRef.current) {
                        console.log('[Troll] Sending confetti action');
                        const result = await trollChannelRef.current.send({
                          type: 'broadcast',
                          event: 'troll-action',
                          payload: { action: 'confetti' }
                        });
                        console.log('[Troll] Confetti send result:', result);
                        toast.success("Confetti explosion activated!");
                      } else {
                        console.error('[Troll] Channel not ready');
                        toast.error("Troll channel not ready");
                      }
                    } catch (error) {
                      console.error("[Troll] Confetti error:", error);
                      toast.error("Failed to activate confetti");
                    }
                  }}
                >
                  🎉 Confetti Explosion
                </Button>
                
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      if (trollChannelRef.current) {
                        console.log('[Troll] Sending fake update action');
                        const result = await trollChannelRef.current.send({
                          type: 'broadcast',
                          event: 'troll-action',
                          payload: { action: 'update' }
                        });
                        console.log('[Troll] Update send result:', result);
                        toast.success("Fake update alert sent!");
                      } else {
                        console.error('[Troll] Channel not ready');
                        toast.error("Troll channel not ready");
                      }
                    } catch (error) {
                      console.error("[Troll] Fake update error:", error);
                      toast.error("Failed to send fake update");
                    }
                  }}
                >
                  ⚠️ Fake Update Alert
                </Button>
                
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      if (trollChannelRef.current) {
                        console.log('[Troll] Sending emoji rain action');
                        const result = await trollChannelRef.current.send({
                          type: 'broadcast',
                          event: 'troll-action',
                          payload: { action: 'emojiRain' }
                        });
                        console.log('[Troll] Emoji rain send result:', result);
                        toast.success("Emoji rain activated!");
                      } else {
                        console.error('[Troll] Channel not ready');
                        toast.error("Troll channel not ready");
                      }
                    } catch (error) {
                      console.error("[Troll] Emoji rain error:", error);
                      toast.error("Failed to activate emoji rain");
                    }
                  }}
                >
                  😄 Emoji Rain
                </Button>
              </div>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search channels by name or username..."
                    value={channelSearchQuery}
                    onChange={(e) => setChannelSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {channelSearchQuery ? 
                      `Found ${channels.filter(c => 
                        c.name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
                        c.username?.toLowerCase().includes(channelSearchQuery.toLowerCase())
                      ).length} channels` 
                      : `Manage all channels (${channels.length} total)`
                    }
                    {selectedChannelsForDelete.length > 0 && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                        • {selectedChannelsForDelete.length} selected
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const filteredChannels = channels.filter(c => 
                          c.name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
                          c.username?.toLowerCase().includes(channelSearchQuery.toLowerCase())
                        );
                        if (selectedChannelsForDelete.length === filteredChannels.length) {
                          setSelectedChannelsForDelete([]);
                        } else {
                          setSelectedChannelsForDelete(filteredChannels.map(c => c.id));
                        }
                      }}
                    >
                      {selectedChannelsForDelete.length === channels.filter(c => 
                        c.name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
                        c.username?.toLowerCase().includes(channelSearchQuery.toLowerCase())
                      ).length && channels.filter(c => 
                        c.name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
                        c.username?.toLowerCase().includes(channelSearchQuery.toLowerCase())
                      ).length > 0 ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedChannelsForDelete.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          showConfirm(
                            `Delete ${selectedChannelsForDelete.length} channels?`,
                            `Are you sure you want to delete ${selectedChannelsForDelete.length} channels? This cannot be undone.`,
                            async () => {

                          try {
                            let successCount = 0;
                            let failCount = 0;

                            for (const channelId of selectedChannelsForDelete) {
                              try {
                                const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels/${channelId}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${publicAnonKey}`,
                                      "X-User-Id": userId || '',
                                    },
                                  }
                                );

                                if (response.ok) {
                                  successCount++;
                                } else {
                                  failCount++;
                                  const errorData = await response.json();
                                  console.error(`Failed to delete channel ${channelId}:`, errorData);
                                }
                              } catch (error) {
                                failCount++;
                                console.error(`Error deleting channel ${channelId}:`, error);
                              }
                            }

                            if (successCount > 0) {
                              toast.success(`Deleted ${successCount} channel(s)`);
                              setSelectedChannelsForDelete([]);
                              loadChannels();
                            }
                            if (failCount > 0) {
                              toast.error(`Failed to delete ${failCount} channel(s)`);
                            }
                          } catch (error) {
                            console.error("Bulk delete error:", error);
                            toast.error("Failed to delete channels");
                          }
                        },
                        'destructive'
                      );
                    }}
                      >
                        Delete Selected ({selectedChannelsForDelete.length})
                      </Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {channels.filter(c => 
                      c.name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
                      c.username?.toLowerCase().includes(channelSearchQuery.toLowerCase())
                    ).length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        {channelSearchQuery ? 'No channels match your search' : 'No channels found'}
                      </p>
                    ) : (
                      channels
                        .filter(c => 
                          c.name?.toLowerCase().includes(channelSearchQuery.toLowerCase()) || 
                          c.username?.toLowerCase().includes(channelSearchQuery.toLowerCase())
                        )
                        .map((channel) => (
                        <div
                          key={channel.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChannelsForDelete.includes(channel.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChannelsForDelete([...selectedChannelsForDelete, channel.id]);
                              } else {
                                setSelectedChannelsForDelete(selectedChannelsForDelete.filter(id => id !== channel.id));
                              }
                            }}
                            className="rounded"
                          />
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-purple-600 text-white">
                              {channel.emoji || channel.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {channel.name}
                              </p>
                              {channel.verified && <Shield className="size-3 text-blue-500" />}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              @{channel.username} • Created by {allUsers.find(u => u.id === channel.creatorId)?.name || 'Unknown'}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              showConfirm(
                                `Delete "${channel.name}"?`,
                                `Are you sure you want to delete this channel?`,
                                async () => {
                                  try {
                                    const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels/${channel.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${publicAnonKey}`,
                                      "X-User-Id": userId || '',
                                    },
                                  }
                                );

                                if (response.ok) {
                                  toast.success("Channel deleted");
                                  loadChannels();
                                } else {
                                  const errorData = await response.json();
                                  console.error("Delete channel failed:", errorData);
                                  toast.error(errorData.error || "Failed to delete channel");
                                }
                              } catch (error) {
                                console.error("Delete channel error:", error);
                                toast.error("Failed to delete channel");
                              }
                            },
                            'destructive'
                          );
                        }}
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Moderator Panel */}
      <Dialog open={moderatorPanelOpen} onOpenChange={setModeratorPanelOpen}>
        <DialogContent 
          className={`max-w-2xl ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'}`}
          style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
        >
          <DialogHeader>
            <DialogTitle>Moderator Panel</DialogTitle>
            <DialogDescription>Search and manage users</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="modSearch">Search Users</Label>
              <Input
                id="modSearch"
                placeholder="Search by name or username..."
                value={moderatorSearchQuery}
                onChange={async (e) => {
                  const query = e.target.value;
                  setModeratorSearchQuery(query);
                  
                  if (query.trim().length >= 1) {
                    // Search in allUsers
                    const results = allUsers.filter(u => 
                      u.name?.toLowerCase().includes(query.toLowerCase()) ||
                      u.username?.toLowerCase().includes(query.toLowerCase())
                    );
                    setModeratorSearchResults(results);
                  } else {
                    setModeratorSearchResults([]);
                  }
                }}
              />
            </div>
            
            {/* User List - Show search results OR all users */}
            <ScrollArea className="max-h-96 border rounded-lg p-2">
              <div className="space-y-2">
                {moderatorSearchQuery ? (
                  // Show search results
                  moderatorSearchResults.length > 0 ? (
                    moderatorSearchResults.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          setSelectedUserForMod(user);
                          setModeratorSearchQuery("");
                          setModeratorSearchResults([]);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-600 text-white">
                              {user.emoji ? (
                                <span className="text-2xl">{user.emoji}</span>
                              ) : (
                                user.name?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No users found</div>
                  )
                ) : (
                  // Show all users by default
                  allUsers.length > 0 ? (
                    allUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => {
                          setSelectedUserForMod(user);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-600 text-white">
                              {user.emoji ? (
                                <span className="text-2xl">{user.emoji}</span>
                              ) : (
                                user.name?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              <span key="name">{user.name}</span>
                              {user.verified && <span key="verified">{renderVerifiedBadge()}</span>}
                              {renderTagBadge(user.tag, user.email === 'mikhail02323@gmail.com', user.tagColor) && <span key="tag">{renderTagBadge(user.tag, user.email === 'mikhail02323@gmail.com', user.tagColor)}</span>}
                            </div>
                            <div className="text-xs text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">No users available</div>
                  )
                )}
              </div>
            </ScrollArea>
            
            {/* Selected User Actions */}
            {selectedUserForMod && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedUserForMod.emoji ? (
                        <span className="text-2xl">{selectedUserForMod.emoji}</span>
                      ) : (
                        selectedUserForMod.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{selectedUserForMod.name}</div>
                    <div className="text-xs text-gray-500">@{selectedUserForMod.username}</div>
                    <div className="text-xs text-gray-400">{selectedUserForMod.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUserForMod(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPromptConfig({
                      title: 'Change Password',
                      description: `Enter new password for ${selectedUserForMod.name}`,
                      placeholder: 'New password',
                      type: 'password',
                      onConfirm: (value) => {
                        if (value) {
                          handleChangePassword(selectedUserForMod.id, value);
                        }
                      }
                    });
                    setPromptOpen(true);
                  }}
                >
                  Change Password
                </Button>
                
                <Button
                  size="sm"
                  variant={selectedUserForMod.verified ? "default" : "outline"}
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${selectedUserForMod.id}/verify`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${publicAnonKey}`,
                            'X-User-Id': userId || '',
                          },
                          body: JSON.stringify({ verified: !selectedUserForMod.verified }),
                        }
                      );
                      const data = await response.json();
                      if (!response.ok) {
                        toast.error(data.error || "Failed to update verification status");
                        return;
                      }
                      toast.success(
                        selectedUserForMod.verified
                          ? `${selectedUserForMod.name} unverified!`
                          : `${selectedUserForMod.name} verified!`
                      );
                      // Update local state
                      setSelectedUserForMod({
                        ...selectedUserForMod,
                        verified: !selectedUserForMod.verified
                      });
                      loadAllUsers(); // Refresh the list
                    } catch (error) {
                      console.error("Verify user error:", error);
                      toast.error("Failed to update verification status");
                    }
                  }}
                >
                  {selectedUserForMod.verified ? "✓ Verified - Click to Unverify" : "Verify Email"}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    showConfirm(
                      `Mark password as compromised?`,
                      `Mark ${selectedUserForMod.name}'s password as compromised?`,
                      async () => {
                      try {
                        const response = await fetch(
                          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${selectedUserForMod.id}/password-compromised`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${publicAnonKey}`,
                              'X-User-Id': userId || '',
                            },
                            body: JSON.stringify({ compromised: true }),
                          }
                        );
                        const data = await response.json();
                        if (!response.ok) {
                          toast.error(data.error || "Failed to mark password as compromised");
                          return;
                        }
                        toast.success(`${selectedUserForMod.name}'s password marked as compromised!`);
                      } catch (error) {
                        console.error("Mark password compromised error:", error);
                        toast.error("Failed to mark password as compromised");
                      }
                    },
                    'default'
                  );
                }}
                >
                  Mark Password as Compromised
                </Button>
                
                {selectedUserForMod.tag !== 'SCAM' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      showConfirm(
                        `Mark as SCAM?`,
                        `Mark ${selectedUserForMod.name} as SCAM?`,
                        async () => {
                        try {
                          const response = await fetch(
                            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${selectedUserForMod.id}/tag`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${publicAnonKey}`,
                                'X-User-Id': userId || '',
                              },
                              body: JSON.stringify({ tag: 'SCAM', tagColor: '#dc2626' }),
                            }
                          );
                          const data = await response.json();
                          if (!response.ok) {
                            toast.error(data.error || "Failed to mark as scam");
                            return;
                          }
                          toast.success(`${selectedUserForMod.name} marked as SCAM!`);
                          setSelectedUserForMod(null);
                        } catch (error) {
                          console.error("Mark as scam error:", error);
                          toast.error("Failed to mark as scam");
                        }
                      },
                      'destructive'
                    );
                  }}
                  >
                    ⚠️ Mark as SCAM
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                    onClick={() => {
                      showConfirm(
                        `Remove SCAM tag?`,
                        `Remove SCAM tag from ${selectedUserForMod.name}?`,
                        async () => {
                        try {
                          const response = await fetch(
                            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${selectedUserForMod.id}/tag`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${publicAnonKey}`,
                                'X-User-Id': userId || '',
                              },
                              body: JSON.stringify({ tag: '', tagColor: '' }),
                            }
                          );
                          const data = await response.json();
                          if (!response.ok) {
                            toast.error(data.error || "Failed to remove SCAM tag");
                            return;
                          }
                          toast.success(`SCAM tag removed from ${selectedUserForMod.name}!`);
                          setSelectedUserForMod(null);
                        } catch (error) {
                          console.error("Remove SCAM tag error:", error);
                          toast.error("Failed to remove SCAM tag");
                        }
                      },
                      'default'
                    );
                  }}
                  >
                    ✓ Remove SCAM Tag
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group name and emoji</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!editingGroup) return;
            
            try {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${editingGroup.id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${publicAnonKey}`,
                    'X-User-Id': userId || '',
                  },
                  body: JSON.stringify({ name: editGroupName, emoji: editGroupEmoji }),
                }
              );

              const data = await response.json();
              if (!response.ok) {
                toast.error(data.error || "Failed to update group");
                return;
              }

              toast.success("Group updated!");
              setEditingGroup(null);
              loadChannels();
              
              // Update selected chat if this group is currently selected
              if (selectedChat?.id === editingGroup.id) {
                setSelectedChat({ ...selectedChat, name: editGroupName });
              }
            } catch (error) {
              console.error("Update group error:", error);
              toast.error("Failed to update group");
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editGroupName">Group Name</Label>
                <Input
                  id="editGroupName"
                  type="text"
                  placeholder="Group name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Group Emoji</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-4xl">{editGroupEmoji || "👥"}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGroupEmojiPicker(!showGroupEmojiPicker)}
                    >
                      {showGroupEmojiPicker ? "Hide" : "Choose Emoji"}
                    </Button>
                    {editGroupEmoji && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditGroupEmoji("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {showGroupEmojiPicker && (
                    <ScrollArea className="h-48 border rounded-md p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {COMMON_EMOJIS.map((emoji, idx) => (
                          <motion.button
                            key={idx}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-900 rounded p-1 cursor-pointer"
                            onClick={() => {
                              setEditGroupEmoji(emoji);
                              setShowGroupEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                Cancel
              </Button>
              <Button type="submit">{t('settings.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Channel Dialog */}
      <Dialog open={!!editingChannel} onOpenChange={(open) => !open && setEditingChannel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
            <DialogDescription>Update channel name, username, and emoji</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!editingChannel) return;
            
            try {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${editingChannel.id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${publicAnonKey}`,
                    'X-User-Id': userId || '',
                  },
                  body: JSON.stringify({ name: editChannelName, username: editChannelUsername, emoji: editChannelEmoji }),
                }
              );

              const data = await response.json();
              if (!response.ok) {
                toast.error(data.error || "Failed to update channel");
                return;
              }

              toast.success("Channel updated!");
              setEditingChannel(null);
              setEditChannelName("");
              setEditChannelUsername("");
              setEditChannelEmoji("");
              setShowEditChannelEmojiPicker(false);
              loadChannels();
              
              // Update selected chat if this channel is currently selected
              if (selectedChat?.id === editingChannel.id) {
                setSelectedChat({ ...selectedChat, name: editChannelName });
              }
            } catch (error) {
              console.error("Update channel error:", error);
              toast.error("Failed to update channel");
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editChannelName">Channel Name</Label>
                <Input
                  id="editChannelName"
                  type="text"
                  placeholder="Channel name"
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="editChannelUsername">Channel Username</Label>
                <Input
                  id="editChannelUsername"
                  type="text"
                  placeholder="channelname"
                  value={editChannelUsername}
                  onChange={(e) => setEditChannelUsername(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only English letters, numbers, underscores (_) and dots (.)
                </p>
              </div>

              <div>
                <Label>Channel Emoji</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-4xl">{editChannelEmoji || "#"}</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditChannelEmojiPicker(!showEditChannelEmojiPicker)}
                    >
                      {showEditChannelEmojiPicker ? "Hide" : "Choose Emoji"}
                    </Button>
                    {editChannelEmoji && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditChannelEmoji("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {showEditChannelEmojiPicker && (
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      <div className="grid grid-cols-8 gap-1">
                        {COMMON_EMOJIS.map((emoji, idx) => (
                          <motion.button
                            key={idx}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-900 rounded p-1 cursor-pointer"
                            onClick={() => {
                              setEditChannelEmoji(emoji);
                              setShowEditChannelEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>

              {/* Channel Admin Management */}
              <div className="border-t pt-4 mt-4 dark:border-gray-700">
                <Label className="text-base font-semibold mb-3 block">
                  Channel Members ({editingChannel?.members?.length || 0})
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Only admins can post messages in this channel. Members can only read.
                </p>
                <ScrollArea className="h-48 border rounded-lg p-2 dark:border-gray-700">
                  <div className="space-y-2">
                    {editingChannel?.members?.map((memberId: string) => {
                      const member = [...friends, ...allUsers].find((u: any) => u.id === memberId);
                      const isAdmin = editingChannel?.admins?.includes(memberId);
                      const isCreator = editingChannel?.creatorId === memberId;
                      
                      return (
                        <div key={memberId} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                          <Avatar className="flex-shrink-0 size-8">
                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-sm">
                              {member?.emoji ? (
                                <span className="text-lg">{member.emoji}</span>
                              ) : (
                                member?.name?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium dark:text-white truncate">
                              {member?.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {isCreator ? 'Creator' : isAdmin ? 'Admin' : 'Member'}
                            </div>
                          </div>
                          {!isCreator && (
                            <Button
                              type="button"
                              size="sm"
                              variant={isAdmin ? "destructive" : "default"}
                              onClick={async () => {
                                try {
                                  const response = await fetch(
                                    `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${editingChannel.id}/admins`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${publicAnonKey}`,
                                        'X-User-Id': userId || '',
                                      },
                                      body: JSON.stringify({ 
                                        memberId, 
                                        action: isAdmin ? 'remove' : 'add' 
                                      }),
                                    }
                                  );

                                  const data = await response.json();
                                  if (!response.ok) {
                                    toast.error(data.error || "Failed to update admin");
                                    return;
                                  }

                                  toast.success(isAdmin ? "Admin removed" : "Admin added");
                                  // Update the editingChannel state
                                  setEditingChannel(data.channel);
                                  loadChannels();
                                } catch (error) {
                                  console.error("Update admin error:", error);
                                  toast.error("Failed to update admin");
                                }
                              }}
                            >
                              {isAdmin ? 'Remove Admin' : 'Set as Admin'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingChannel(null)}>
                Cancel
              </Button>
              <Button type="submit">{t('settings.saveChanges')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={!!addMembersGroup} onOpenChange={(open) => !open && setAddMembersGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Members to {addMembersGroup?.name}</DialogTitle>
            <DialogDescription>Select friends to add to this group</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMembers}>
            <div className="space-y-4">
              <ScrollArea className="h-64 border rounded-md p-2">
                {friends.filter(f => !addMembersGroup?.members.includes(f.id)).length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                    All your friends are already in this group
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends
                      .filter(f => !addMembersGroup?.members.includes(f.id))
                      .map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => {
                            if (selectedMembersToAdd.includes(friend.id)) {
                              setSelectedMembersToAdd(selectedMembersToAdd.filter(id => id !== friend.id));
                            } else {
                              setSelectedMembersToAdd([...selectedMembersToAdd, friend.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembersToAdd.includes(friend.id)}
                            onChange={() => {}}
                            className="cursor-pointer"
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gray-300 dark:bg-gray-700 text-sm">
                              {friend.emoji ? (
                                <span className="text-lg">{friend.emoji}</span>
                              ) : (
                                friend.name?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span key="name" className="font-medium dark:text-white">{friend.name}</span>
                              {friend.verified && <span key="verified">{renderVerifiedBadge()}</span>}
                              {renderTagBadge(friend.tag, isUserAdmin(friend), friend.tagColor) && <span key="tag">{renderTagBadge(friend.tag, isUserAdmin(friend), friend.tagColor)}</span>}
                            </div>
                            <div className="text-xs text-gray-500">@{friend.username}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAddMembersGroup(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={selectedMembersToAdd.length === 0}>
                Add {selectedMembersToAdd.length > 0 ? `(${selectedMembersToAdd.length})` : ''}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Prompt Dialog */}
      <CustomPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        onConfirm={promptConfig.onConfirm}
        title={promptConfig.title}
        description={promptConfig.description}
        placeholder={promptConfig.placeholder}
        defaultValue={promptConfig.defaultValue}
        type={promptConfig.type}
        multiline={promptConfig.multiline}
      />

      {/* Sticker Picker */}
      <StickerPicker
        open={stickerPickerOpen}
        onClose={() => setStickerPickerOpen(false)}
        onSelectSticker={async (sticker) => {
          // Send sticker immediately instead of adding to input
          if (!selectedChat) return;
          
          try {
            // If it's news channel, use news endpoint (admin only)
            if (selectedChat.type === 'news') {
              if (currentUser?.email !== 'mikhail02323@gmail.com') {
                toast.error("Only admin can post to news channel");
                return;
              }

              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/news`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${publicAnonKey}`,
                    'X-User-Id': userId || '',
                  },
                  body: JSON.stringify({ content: sticker }),
                }
              );

              if (!response.ok) {
                const data = await response.json();
                toast.error(data.error || "Failed to send sticker");
                return;
              }

              loadMessages('news', 'news');
              
              // Broadcast new news message via Realtime
              if (messageChannelRef.current) {
                await messageChannelRef.current.send({
                  type: 'broadcast',
                  event: 'new-message',
                  payload: { chatType: 'news', chatId: 'news' }
                });
              }
              
              return;
            }

            // Regular message
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${publicAnonKey}`,
                  'X-User-Id': userId || '',
                },
                body: JSON.stringify({
                  chatId: selectedChat.id,
                  content: sticker,
                  chatType: selectedChat.type,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              toast.error(errorData.error || "Failed to send sticker");
              return;
            }

            loadMessages(selectedChat.type, selectedChat.id);
            
            // Broadcast new message via Realtime
            if (messageChannelRef.current) {
              await messageChannelRef.current.send({
                type: 'broadcast',
                event: 'new-message',
                payload: { chatType: selectedChat.type, chatId: selectedChat.id }
              });
            }
          } catch (error) {
            console.error("Send sticker error:", error);
            toast.error("Failed to send sticker");
          }
        }}
      />

      {/* Poll Creator */}
      <PollCreator
        open={pollCreatorOpen}
        onOpenChange={(open) => {
          setPollCreatorOpen(open);
          if (!open) {
            // Clear editing state when closing
            setEditingPollId(null);
            setEditingPollData(null);
          }
        }}
        onCreatePoll={handleCreatePoll}
        editingPollData={editingPollData}
      />

      {/* Announcement Banner */}
      {showAnnouncementBanner && currentAnnouncement && (
        <AnnouncementBanner
          id={currentAnnouncement.id}
          title={currentAnnouncement.title}
          description={currentAnnouncement.description}
          buttonText={currentAnnouncement.buttonText}
          onDismiss={async () => {
            try {
              // Mark as dismissed on the server
              await fetch(
                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/announcement/dismiss`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${publicAnonKey}`,
                    'X-User-Id': userId || '',
                  },
                  body: JSON.stringify({
                    announcementId: currentAnnouncement.id,
                  }),
                }
              );
              setShowAnnouncementBanner(false);
            } catch (error) {
              console.error('Failed to dismiss announcement:', error);
              // Still hide it locally even if the API call fails
              setShowAnnouncementBanner(false);
            }
          }}
        />
      )}

      {/* Profile Panel */}
      {profilePanelOpen && profilePanelData && userId && (
        <ProfilePanel
          type={profilePanelData.type}
          data={profilePanelData.data}
          currentUserId={userId}
          onClose={() => {
            setProfilePanelOpen(false);
            setProfilePanelData(null);
          }}
          onUpdate={() => {
            loadFriends();
            loadChannels();
            if (selectedChat && profilePanelData.type !== 'user') {
              // Reload messages if we're viewing the updated group/channel
              loadMessages(selectedChat.type, selectedChat.id);
            }
          }}
          onRemoveFriend={(friendId) => {
            handleRemoveFriend(friendId);
          }}
          friends={friends}
          allUsers={allUsers}
        />
      )}

      {/* Global Confirm Dialog */}
      <CustomConfirm
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDialogConfig.onConfirm}
        title={confirmDialogConfig.title}
        description={confirmDialogConfig.description}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant={confirmDialogConfig.variant}
      />
    </div>
  );
}