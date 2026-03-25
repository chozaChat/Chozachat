import { useState, useEffect, useRef } from "react";
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
import { MessageCircle, Users, UserPlus, LogOut, Send, Plus, UserMinus, Check, X, Bell, ArrowLeft, Settings, Shield, Newspaper, MoreVertical, Edit, Trash, Trash2, Moon, Sun, Menu, Search, Hash } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";

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
  "🎳", "🎮", "🎰", "🧩"
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
  username: string;
  creatorId: string;
  emoji?: string;
  members: string[];
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export default function ChatMain() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ type: 'friend' | 'group' | 'news' | 'channel', id: string, name: string, friendData?: Friend } | null>(null);
  const [messageText, setMessageText] = useState("");
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
  const [userId, setUserId] = useState<string | null>(null);
  const [addMembersGroup, setAddMembersGroup] = useState<Group | null>(null);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [adminTab, setAdminTab] = useState<'users' | 'settings' | 'troll'>('users');
  const [moderatorPanelOpen, setModeratorPanelOpen] = useState(false);
  const [moderatorSearchQuery, setModeratorSearchQuery] = useState("");
  const [moderatorSearchResults, setModeratorSearchResults] = useState<User[]>([]);
  const [selectedUserForMod, setSelectedUserForMod] = useState<User | null>(null);
  const [friendEmail, setFriendEmail] = useState("");
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [trollChannelConnected, setTrollChannelConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // Refs for Realtime channels
  const messageChannelRef = useRef<any>(null);
  const trollChannelRef = useRef<any>(null);

  // CLIENT-ONLY MODE - Bypass server entirely
  const CLIENT_ONLY_MODE = false;
  
  // SERVER ID
  const SERVER_ID = 'make-server-a1c86d03';
  
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
        console.log("Expected version: 2024-03-19-v9");
        
        if (!data.version) {
          console.warn("WARNING: Server did not return version info. Server may not be deployed.");
          console.warn("Response data:", data);
        } else if (data.version !== "2024-03-19-v9") {
          console.warn("WARNING: Server version mismatch! Old code might be running.");
          console.warn("Current version:", data.version);
        } else {
          console.log("✓ Server version is correct!");
        }
      } catch (err) {
        console.error("Failed to check server version:", err);
        console.error("This usually means the server is not deployed or unreachable.");
      }
    };
    
    checkServerVersion();
    loadCurrentUser();
    loadFriends();
    loadGroups();
    loadChannels();
    loadFriendRequests();
    loadStats();
    updateLastActive();
    
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
            if (messageData.senderId !== userId) {
              // Get sender info
              const sender = friends.find(f => f.id === messageData.senderId) || 
                            { name: 'Someone', emoji: '👤' };
              showMessageNotification(sender.name, messageData.text, sender.emoji);
            }
          }
          // Reload messages when a new message is broadcast
          loadMessages(selectedChat.type, selectedChat.id);
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
    }, 5000); // Check every 5 seconds instead of 2

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
      clearInterval(statsInterval);
    };
  }, [userId, selectedChat]);

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
        }
      })
      .subscribe((status: string) => {
        console.log('[Troll] Channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Troll] Successfully subscribed to troll channel');
          setTrollChannelConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('[Troll] Channel connection failed or closed:', status);
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

  const loadCurrentUser = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
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
        if (data.user.email === 'mikhail02323@gmail.com' || data.user.moderator) {
          loadAllUsers();
        }
      }
    } catch (error) {
      console.error("Failed to load user:", error);
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
        console.error("Failed to load friends:", response.status);
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
      console.error("Failed to load friends:", error);
    }
  };

  const loadGroups = async () => {
    if (!userId) {
      console.log("Skipping loadGroups - no userId");
      return;
    }
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups`,
        {
          headers: { 
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId
          },
        }
      );
      
      if (!response.ok) {
        console.error("Failed to load groups:", response.status);
        return;
      }
      
      const data = await response.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
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
        console.error("Failed to load channels:", response.status);
        return;
      }
      
      const data = await response.json();
      if (data.channels) {
        setChannels(data.channels);
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  };

  const loadMessages = async (chatType: 'friend' | 'group' | 'news' | 'channel', chatId: string) => {
    if (!userId) {
      console.log("Skipping loadMessages - no userId");
      return;
    }
    
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
          console.error("Failed to load news:", response.status);
          return;
        }
        
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages);
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
        console.error("Failed to load messages:", response.status);
        return;
      }
      
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
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
        const errorData = await response.json();
        console.error("Failed to load friend requests:", response.status, errorData);
        toast.error(`Failed to load friend requests: ${errorData.message || errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      if (data.requests) {
        setFriendRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to load friend requests:", error);
      toast.error(`Failed to load friend requests: ${error}`);
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
        console.error("Failed to load stats:", response.status);
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
      console.error("Failed to load stats:", error);
    }
  };

  const updateLastActive = async () => {
    if (!userId) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/users/activity`,
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
      toast.success("Notifications enabled!");
    } else if (permission === "denied") {
      toast.error("Notification permission denied");
    }
  };

  // Show notification for new message
  const showMessageNotification = (senderName: string, message: string, senderEmoji?: string) => {
    if (!notificationsEnabled || notificationPermission !== "granted") return;
    
    // Don't show notification if user is viewing the chat
    if (document.hasFocus()) return;

    const notification = new Notification(`${senderEmoji || ""} ${senderName}`, {
      body: message,
      icon: "/favicon.ico",
      tag: "chat-message",
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
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
      loadGroups();
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
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${addMembersGroup.id}/members`,
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
      loadGroups();
    } catch (error) {
      console.error("Add members error:", error);
      toast.error("Failed to add members");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${groupId}`,
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
      
      loadGroups();
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
        setSearchResults(data.results || []);
      } else {
        toast.error("Failed to search");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search");
    }
  };

  const handleAddFriendFromSearch = async (friendId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends`,
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;

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
            body: JSON.stringify({ text: messageText }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          toast.error(data.error || "Failed to send news");
          return;
        }

        setMessageText("");
        loadMessages('news', 'news-channel');
        
        // Broadcast new news message via Realtime using existing channel
        if (messageChannelRef.current) {
          await messageChannelRef.current.send({
            type: 'broadcast',
            event: 'new-message',
            payload: { chatType: 'news', chatId: 'news-channel' }
          });
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
            text: messageText,
            chatType: selectedChat.type,
          }),
        }
      );

      if (!response.ok) {
        toast.error("Failed to send message");
        return;
      }

      setMessageText("");
      loadMessages(selectedChat.type, selectedChat.id);
      
      // Broadcast new message via Realtime using existing channel
      if (messageChannelRef.current) {
        await messageChannelRef.current.send({
          type: 'broadcast',
          event: 'new-message',
          payload: { chatType: selectedChat.type, chatId: selectedChat.id }
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
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
    
    // Load messages for this chat
    loadMessages('friend', chatId);
  };

  const selectGroupChat = (group: Group) => {
    console.log("Selecting group chat:", group.name, "groupId:", group.id);
    
    // Clear messages immediately when switching chats
    setMessages([]);
    
    // Set the selected chat
    setSelectedChat({ type: 'group', id: group.id, name: group.name });
    
    // Load messages for this chat
    loadMessages('group', group.id);
  };

  const selectChannelChat = (channel: Channel) => {
    console.log("Selecting channel chat:", channel.name, "channelId:", channel.id);
    
    // Clear messages immediately when switching chats
    setMessages([]);
    
    // Set the selected chat
    setSelectedChat({ type: 'channel', id: channel.id, name: channel.name });
    
    // Load messages for this chat
    loadMessages('channel', channel.id);
  };

  const getSenderName = (senderId: string) => {
    if (senderId === userId) return "You";
    const friend = friends.find(f => f.id === senderId);
    if (friend) return friend.name;
    return "Unknown";
  };

  const getSenderEmoji = (senderId: string) => {
    if (senderId === userId) return currentUser?.emoji;
    const friend = friends.find(f => f.id === senderId);
    return friend?.emoji;
  };

  const getSenderTag = (senderId: string) => {
    if (senderId === userId) return currentUser?.tag;
    const friend = friends.find(f => f.id === senderId);
    return friend?.tag;
  };

  const getSenderTagColor = (senderId: string) => {
    if (senderId === userId) return currentUser?.tagColor;
    const friend = friends.find(f => f.id === senderId);
    return friend?.tagColor;
  };

  const getSenderIsAdmin = (senderId: string) => {
    if (senderId === userId) return isUserAdmin(currentUser);
    const friend = friends.find(f => f.id === senderId);
    return isUserAdmin(friend);
  };

  const getSenderIsVerified = (senderId: string) => {
    if (senderId === userId) return currentUser?.verified;
    const friend = friends.find(f => f.id === senderId);
    return friend?.verified;
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/accept`,
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

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to accept friend request");
        return;
      }

      toast.success("Friend request accepted!");
      loadFriendRequests();
      loadFriends();
    } catch (error) {
      console.error("Accept friend request error:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineFriendRequest = async (requesterId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/decline`,
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

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to decline friend request");
        return;
      }

      toast.success("Friend request declined!");
      loadFriendRequests();
    } catch (error) {
      console.error("Decline friend request error:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/remove`,
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

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to remove friend");
        return;
      }

      toast.success("Friend removed!");
      loadFriends();
      if (selectedChat?.type === 'friend' && selectedChat.id.includes(friendId)) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error("Remove friend error:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ name: editName, username: editUsername, tag: editTag, tagColor: editTagColor, emoji: editEmoji }),
        }
      );

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

  return (
    <div className="size-full flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={`w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={sideMenuOpen} onOpenChange={setSideMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 dark:bg-gray-900 dark:border-gray-800">
                <SheetHeader>
                  <SheetTitle className="dark:text-white">Menu</SheetTitle>
                  <SheetDescription className="dark:text-gray-400">Access settings and options</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Theme Toggle */}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start dark:border-gray-700 dark:hover:bg-gray-800"
                    onClick={toggleTheme}
                  >
                    {theme === 'light' ? <Moon className="size-5 mr-2" /> : <Sun className="size-5 mr-2" />}
                    {theme === 'light' ? 'Dark' : 'Light'} Mode
                  </Button>

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
                        }}
                      >
                        <Settings className="size-5 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your name and username</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="editName">Name</Label>
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
                      <Label htmlFor="editUsername">Username</Label>
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
                      <Label htmlFor="editTag">Tag</Label>
                      <Input
                        id="editTag"
                        type="text"
                        placeholder="Your custom tag (e.g. Developer, Artist)"
                        value={editTag}
                        onChange={(e) => setEditTag(e.target.value)}
                      />
                      {currentUser?.moderator && (
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
                    {currentUser?.moderator && (
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
                      <Label>Profile Emoji</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="text-4xl">{editEmoji || "😀"}</div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            {showEmojiPicker ? "Hide" : "Choose Emoji"}
                          </Button>
                          {editEmoji && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditEmoji("")}
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        {showEmojiPicker && (
                          <ScrollArea className="h-48 border rounded-md p-2">
                            <div className="grid grid-cols-8 gap-1">
                              {COMMON_EMOJIS.map((emoji, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-2xl hover:bg-gray-100 rounded p-1 cursor-pointer"
                                  onClick={() => {
                                    setEditEmoji(emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </div>
                    
                    {/* Notifications Settings */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Label>Notifications</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Bell className="size-4 text-gray-500" />
                            <span className="text-sm">Browser Notifications</span>
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
                                toast.info("Notifications disabled");
                              }
                            }}
                          >
                            {notificationsEnabled ? "Enabled" : "Enable"}
                          </Button>
                        </div>
                        {notificationPermission === "denied" && (
                          <p className="text-xs text-red-500">
                            Notifications are blocked. Please enable them in your browser settings.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
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
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create Group</DialogTitle>
                  <DialogDescription>Create a new group chat</DialogDescription>
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
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 cursor-pointer"
                                  onClick={() => {
                                    setGroupEmoji(emoji);
                                    setShowCreateGroupEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </button>
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
                  Create Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create Channel</DialogTitle>
                  <DialogDescription>Create a new public channel</DialogDescription>
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
                                <button
                                  key={idx}
                                  type="button"
                                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 cursor-pointer"
                                  onClick={() => {
                                    setChannelEmoji(emoji);
                                    setShowCreateChannelEmojiPicker(false);
                                  }}
                                >
                                  {emoji}
                                </button>
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
              Logout
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
              currentUser?.name?.charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold dark:text-white">{currentUser?.name}</span>
            {currentUser?.verified && renderVerifiedBadge()}
            {renderTagBadge(currentUser?.tag, isUserAdmin(currentUser), currentUser?.tagColor)}
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
      {currentUser?.moderator && (
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
          placeholder="Search users and channels..."
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
                  <AvatarFallback className={result.username ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}>
                    {result.emoji ? (
                      <span className="text-xl">{result.emoji}</span>
                    ) : result.username ? (
                      <Hash className="size-4" />
                    ) : (
                      result.name?.charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium dark:text-white truncate">{result.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{result.username || result.email?.split('@')[0]}
                  </div>
                </div>
                {result.channelUsername ? (
                  <Button size="sm" onClick={() => handleJoinChannel(result.id)}>
                    Join
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleAddFriendFromSearch(result.id)}>
                    <UserPlus className="size-4" />
                  </Button>
                )}
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
            Friend Requests
            {friendRequests.length > 0 && (
              <Badge className="ml-auto" variant="destructive">
                {friendRequests.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Friend Requests</DialogTitle>
            <DialogDescription>
              {friendRequests.length === 0 ? "No pending requests" : `${friendRequests.length} pending request${friendRequests.length > 1 ? 's' : ''}`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {friendRequests.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No friend requests
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
                          request.requester.name.charAt(0).toUpperCase()
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

    <ScrollArea className="flex-1 px-2">
      {/* News Channel - Small and less noticeable */}
      <button
        onClick={() => {
          setMessages([]);
          setSelectedChat({ type: 'news', id: 'news-channel', name: 'News Channel' });
          loadMessages('news', 'news-channel');
        }}
        className={`w-full p-2 rounded-md flex items-center gap-2 hover:bg-gray-50 transition mb-3 border-b border-gray-100 ${
          selectedChat?.type === 'news' ? 'bg-yellow-50' : ''
        }`}
      >
        <div className="text-xl">📰</div>
        <div className="flex-1 text-left">
          <div className="text-xs font-medium text-gray-600">News Channel</div>
        </div>
      </button>

      {friends.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-8">
          No friends yet. Add some friends to start chatting!
        </div>
      ) : (
        <div className="space-y-1">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                selectedChat?.type === 'friend' && selectedChat.id.includes(friend.id)
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : ''
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
                      friend.name.charAt(0).toUpperCase()
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
                  <div className="text-xs text-gray-500 truncate">@{friend.username}</div>
                </div>
              </button>
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${friend.name} from your friends?`)) {
                        await handleRemoveFriend(friend.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Remove Friend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Groups Section */}
      <div className="mt-4 mb-2 px-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Groups</h3>
      </div>
      {groups.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-4 px-2">
          No groups yet
        </div>
      ) : (
        <div className="space-y-1">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                selectedChat?.id === group.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
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
                  <span className="text-xs text-gray-500 dark:text-gray-400">{group.members?.length || 0} members</span>
                </div>
              </button>
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
                    Edit Group
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddMembersGroup(group);
                    }}
                  >
                    <UserPlus className="size-4 mr-2" />
                    Add Members
                  </DropdownMenuItem>
                  {group.creatorId === userId && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${group.name}"? This will delete all messages.`)) {
                          await handleDeleteGroup(group.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Channels Section */}
      <div className="mt-4 mb-2 px-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Channels</h3>
      </div>
      {channels.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-4 px-2">
          No channels yet
        </div>
      ) : (
        <div className="space-y-1">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                selectedChat?.id === channel.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
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
                  <span className="font-medium dark:text-white truncate block">{channel.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">@{channel.username}</span>
                </div>
              </button>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChannel(channel);
                          setEditChannelName(channel.name);
                          setEditChannelUsername(channel.username);
                          setEditChannelEmoji(channel.emoji || "");
                        }}
                      >
                        <Edit className="size-4 mr-2" />
                        Edit Channel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${channel.name}"? This will delete all messages.`)) {
                            await handleDeleteChannel(channel.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Channel
                      </DropdownMenuItem>
                    </>
                  )}
                  {channel.creatorId !== userId && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Leave "${channel.name}"?`)) {
                          await handleLeaveChannel(channel.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Leave Channel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  </div>
</div>

      {/* Chat Area - Full width on mobile when chat is selected */}
      <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex w-full'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header with Back Button on Mobile */}
            <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6">
              {/* Back button - Only visible on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedChat(null)}
                className="md:hidden mr-2"
              >
                <ArrowLeft className="size-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className={selectedChat.type === 'group' ? 'bg-purple-600 text-white' : selectedChat.type === 'news' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-300 dark:bg-gray-700'}>
                    {selectedChat.type === 'news' ? (
                      <span className="text-2xl">📰</span>
                    ) : selectedChat.type === 'group' ? (
                      groups.find(g => g.id === selectedChat.id)?.emoji ? (
                        <span className="text-2xl">{groups.find(g => g.id === selectedChat.id)?.emoji}</span>
                      ) : (
                        <Users className="size-5" />
                      )
                    ) : (
                      selectedChat.friendData?.emoji ? (
                        <span className="text-2xl">{selectedChat.friendData.emoji}</span>
                      ) : (
                        selectedChat.name.charAt(0).toUpperCase()
                      )
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold dark:text-white">{selectedChat.name}</span>
                    {selectedChat.type === 'friend' && selectedChat.friendData?.verified && renderVerifiedBadge()}
                    {selectedChat.type === 'friend' && renderTagBadge(selectedChat.friendData?.tag, isUserAdmin(selectedChat.friendData), selectedChat.friendData?.tagColor)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedChat.type === 'group' ? 'Group chat' : selectedChat.type === 'news' ? 'News Channel' : 'Direct message'}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] md:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (selectedChat.type === 'group' || selectedChat.type === 'news') && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1 px-3 flex-wrap">
                            {getSenderEmoji(message.senderId) && (
                              <span className="text-sm">{getSenderEmoji(message.senderId)}</span>
                            )}
                            <span>{getSenderName(message.senderId)}</span>
                            {getSenderIsVerified(message.senderId) && renderVerifiedBadge()}
                            {renderTagBadge(getSenderTag(message.senderId), getSenderIsAdmin(message.senderId), getSenderTagColor(message.senderId))}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                          }`}
                        >
                          <div>{message.text}</div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-3">
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
              {/* Hide input for news channel if not admin */}
              {selectedChat.type === 'news' && currentUser?.email !== 'mikhail02323@gmail.com' ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">
                  📰 News channel is read-only
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="size-5" />
                  </Button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="text-center text-gray-500 dark:text-gray-400 px-4">
              <MessageCircle className="size-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">Select a chat to start messaging</p>
              <p className="text-sm mt-2">Choose a friend or group from the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Admin Panel */}
      <Dialog open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Admin Panel</DialogTitle>
            <DialogDescription>Manage users, view stats, and fun global functions</DialogDescription>
          </DialogHeader>
          
          <Tabs value={adminTab} onValueChange={(value) => setAdminTab(value as 'users' | 'settings' | 'troll')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
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
                allUsers.map((user) => (
                  <div key={user.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-600 text-white">
                          {user.emoji ? (
                            <span className="text-2xl">{user.emoji}</span>
                          ) : (
                            user.name.charAt(0).toUpperCase()
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
                          onClick={async () => {
                            if (confirm(`Delete user ${user.name}?`)) {
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
                            }
                          }}
                        >
                          Delete User
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const newPw = prompt(`Enter new password for ${user.name}:`);
                            if (newPw) {
                              handleChangePassword(user.id, newPw);
                            }
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
                        onClick={async () => {
                          if (confirm(`Mark ${user.name}'s password as compromised?`)) {
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
                          }
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
                        onClick={async () => {
                          if (confirm(`Mark ${user.name} as SCAM? This will set their tag to "SCAM" with a red background.`)) {
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
                          }
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
                        onClick={async () => {
                          if (confirm(`Remove SCAM tag from ${user.name}? This will clear their tag.`)) {
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
                          }
                        }}
                      >
                        ✓ Remove SCAM Tag
                      </Button>
                    )}
                  </div>
                ))
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
                    const message = prompt("Enter broadcast message:");
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
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Moderator Panel */}
      <Dialog open={moderatorPanelOpen} onOpenChange={setModeratorPanelOpen}>
        <DialogContent className="max-w-2xl">
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
                                user.name.charAt(0).toUpperCase()
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
                                user.name.charAt(0).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium flex items-center gap-2">
                              {user.name}
                              {user.verified && renderVerifiedBadge()}
                              {renderTagBadge(user.tag, user.email === 'mikhail02323@gmail.com', user.tagColor)}
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
                        selectedUserForMod.name.charAt(0).toUpperCase()
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
                    const newPw = prompt(`Enter new password for ${selectedUserForMod.name}:`);
                    if (newPw) {
                      handleChangePassword(selectedUserForMod.id, newPw);
                    }
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
                  onClick={async () => {
                    if (confirm(`Mark ${selectedUserForMod.name}'s password as compromised?`)) {
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
                    }
                  }}
                >
                  Mark Password as Compromised
                </Button>
                
                {selectedUserForMod.tag !== 'SCAM' ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={async () => {
                      if (confirm(`Mark ${selectedUserForMod.name} as SCAM?`)) {
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
                      }
                    }}
                  >
                    ⚠️ Mark as SCAM
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                    onClick={async () => {
                      if (confirm(`Remove SCAM tag from ${selectedUserForMod.name}?`)) {
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
                      }
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
                `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${editingGroup.id}`,
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
              loadGroups();
              
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
                          <button
                            key={idx}
                            type="button"
                            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-900 rounded p-1 cursor-pointer"
                            onClick={() => {
                              setEditGroupEmoji(emoji);
                              setShowGroupEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
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
              <Button type="submit">Save Changes</Button>
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
                          <button
                            key={idx}
                            type="button"
                            className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-900 rounded p-1 cursor-pointer"
                            onClick={() => {
                              setEditChannelEmoji(emoji);
                              setShowEditChannelEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditingChannel(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
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
                                friend.name.charAt(0).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium dark:text-white">{friend.name}</span>
                              {friend.verified && renderVerifiedBadge()}
                              {renderTagBadge(friend.tag, isUserAdmin(friend), friend.tagColor)}
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
    </div>
  );
}