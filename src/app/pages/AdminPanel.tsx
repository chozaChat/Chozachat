import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "../../lib/supabase";
import { toast } from "sonner";
import { 
  Shield, 
  MessageSquare, 
  Users, 
  Settings, 
  CheckCircle, 
  MoreVertical, 
  LogOut, 
  AlertTriangle, 
  Key, 
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";

const SERVER_ID = "make-server-a1c86d03";

// Helper function to darken color for dark mode
function darkenColor(color: string, amount: number = 0.4): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Darken by reducing each component
  const newR = Math.max(0, Math.floor(r * amount));
  const newG = Math.max(0, Math.floor(g * amount));
  const newB = Math.max(0, Math.floor(b * amount));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  emoji?: string;
  tag?: string;
  tagColor?: string;
  verified?: boolean;
  emailVerified?: boolean;
  passwordCompromised?: boolean;
  moderator?: boolean;
  isModerator?: boolean;
  isScammer?: boolean;
  tags?: string[];
  coins?: number;
  subscription?: {
    tier: 'boost' | 'ultra' | null;
    expiresAt: string;
    tagGradient?: string;
    customGradient?: string;
  };
}

interface Channel {
  id: string;
  name: string;
  username?: string;
  emoji?: string;
  type?: string;
  verified?: boolean;
  members?: string[];
  createdBy?: string;
  createdAt?: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
  const [bulkDeleteChannelsDialogOpen, setBulkDeleteChannelsDialogOpen] = useState(false);
  const [addCoinsDialogOpen, setAddCoinsDialogOpen] = useState(false);
  const [coinsAmount, setCoinsAmount] = useState("");

  // Settings states
  const [serverName, setServerName] = useState("ChozaChat Admin");
  const [maxGroupMembers, setMaxGroupMembers] = useState("50");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [messageRetentionDays, setMessageRetentionDays] = useState("365");
  const [maxMessageLength, setMaxMessageLength] = useState("2000");
  const [enableFileUploads, setEnableFileUploads] = useState(false);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [enableOnlineStatus, setEnableOnlineStatus] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");

  // Troll states
  const [globalMessage, setGlobalMessage] = useState("");
  const [trollLoading, setTrollLoading] = useState(false);

  // Announcement states
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDescription, setAnnouncementDescription] = useState("");
  const [announcementButtonText, setAnnouncementButtonText] = useState("Got it!");
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);

  // Best Language states
  const [bestLanguageKey, setBestLanguageKey] = useState("");
  const [customLanguages, setCustomLanguages] = useState<Array<{ key: string; displayName: string }>>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      navigate("/");
      return;
    }
    setUserId(storedUserId);
    loadCurrentUser(storedUserId);
    loadCustomLanguages();
    loadBestLanguage();
  }, [navigate]);

  const loadCurrentUser = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": id,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to load current user:", response.status, response.statusText);
        navigate("/");
        return;
      }

      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
        
        // Check if user is admin
        if (data.user.email !== "mikhail02323@gmail.com") {
          toast.error("Access denied. Admin privileges required.");
          navigate("/chat");
          return;
        }
        
        loadAllUsers(id);
        loadAllChannels(id);
        loadSettings(id);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Load current user error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async (userIdToUse?: string) => {
    const idToUse = userIdToUse || userId;
    if (!idToUse) {
      console.error("No user ID available to load users");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": idToUse,
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

  const loadAllChannels = async (userIdToUse?: string) => {
    const idToUse = userIdToUse || userId;
    if (!idToUse) {
      console.error("No user ID available to load channels");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": idToUse,
          },
        }
      );

      if (!response.ok) {
        // Silently return if not authorized (expected for non-admin users)
        if (response.status === 403) {
          return;
        }
        const errorText = await response.text();
        console.error("Failed to load all channels:", response.status, response.statusText, errorText);
        return;
      }

      const data = await response.json();
      console.log("Loaded channels:", data.channels?.length || 0);
      if (data.channels) {
        setAllChannels(data.channels);
      }
    } catch (error) {
      console.error("Load all channels error:", error);
    }
  };

  const loadCustomLanguages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/prefix/custom-lang-`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const langs = (data.values || [])
          .filter((v: any) => v && v.key)
          .map((v: any) => ({
            key: v.key.replace('custom-lang-', ''),
            displayName: v.value?.displayName || v.value?.name || v.key.replace('custom-lang-', '')
          }));
        setCustomLanguages(langs);
      }
    } catch (error) {
      console.error("Failed to load custom languages:", error);
    }
  };

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
        if (data.value && data.value.key) {
          setBestLanguageKey(data.value.key);
        }
      }
    } catch (error) {
      console.error("Failed to load best language:", error);
    }
  };

  const loadSettings = async (userIdToUse?: string) => {
    const idToUse = userIdToUse || userId;
    if (!idToUse) {
      console.error("No user ID available to load settings");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/settings`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": idToUse,
          },
        }
      );

      if (!response.ok) {
        // Silently return if not authorized
        if (response.status === 403) {
          return;
        }
        const errorText = await response.text();
        console.error("Failed to load settings:", response.status, response.statusText, errorText);
        return;
      }

      const data = await response.json();
      console.log("Loaded settings:", data.settings);
      if (data.settings) {
        setServerName(data.settings.serverName || "ChozaChat Admin");
        setMaxGroupMembers(String(data.settings.maxGroupMembers || 50));
        setAllowRegistration(data.settings.allowRegistration !== false);
        setMessageRetentionDays(String(data.settings.messageRetentionDays || 365));
        setMaxMessageLength(String(data.settings.maxMessageLength || 2000));
        setEnableFileUploads(data.settings.enableFileUploads || false);
        setRequireEmailVerification(data.settings.requireEmailVerification || false);
        setEnableOnlineStatus(data.settings.enableOnlineStatus !== false);
        setGeminiApiKey(data.settings.geminiApiKey || '');  // Load API key from Supabase
      }
      
      // Load announcement after loading settings
      loadAnnouncement(idToUse);
    } catch (error) {
      console.error("Load settings error:", error);
    }
  };

  const loadAnnouncement = async (userIdToUse?: string) => {
    const idToUse = userIdToUse || userId;
    if (!idToUse) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/announcement`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": idToUse,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.announcement) {
          setCurrentAnnouncement(data.announcement);
          setAnnouncementTitle(data.announcement.title || "");
          setAnnouncementDescription(data.announcement.description || "");
          setAnnouncementButtonText(data.announcement.buttonText || "Got it!");
          setAnnouncementEnabled(data.announcement.enabled || false);
        }
      }
    } catch (error) {
      console.error("Load announcement error:", error);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    if (!announcementTitle.trim()) {
      toast.error("Please enter an announcement title");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/announcement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId,
          },
          body: JSON.stringify({
            title: announcementTitle,
            description: announcementDescription,
            buttonText: announcementButtonText,
            enabled: announcementEnabled,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save announcement");
        return;
      }

      toast.success("Announcement saved successfully!");
      loadAnnouncement();
    } catch (error) {
      console.error("Save announcement error:", error);
      toast.error("Failed to save announcement");
    }
  };

  const handleDisableAnnouncement = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/announcement/disable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId,
          },
        }
      );

      if (response.ok) {
        toast.success("Announcement disabled");
        setAnnouncementEnabled(false);
        loadAnnouncement();
      }
    } catch (error) {
      console.error("Disable announcement error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/");
  };

  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setDeleteUserDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${userToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete user");
        return;
      }

      toast.success(`User ${userToDelete.name} deleted successfully`);
      setUserMenuOpen(false);
      setSelectedUser(null);
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
      loadAllUsers();
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${selectedUser.id}/password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }

      toast.success(`Password changed for ${selectedUser.name}`);
      setNewPassword("");
      setChangePasswordDialogOpen(false);
      setUserMenuOpen(false);
      loadAllUsers();
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Failed to change password");
    }
  };

  const handleMarkPasswordCompromised = async (user: User, compromised: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/password-compromised`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ compromised }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update password status");
        return;
      }

      toast.success(
        compromised
          ? `Password marked as compromised for ${user.name}`
          : `Password status cleared for ${user.name}`
      );
      setUserMenuOpen(false);
      loadAllUsers();
    } catch (error) {
      console.error("Mark password compromised error:", error);
      toast.error("Failed to update password status");
    }
  };

  const handleToggleVerified = async (user: User) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ verified: !user.verified }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update verification status");
        return;
      }

      toast.success(
        user.verified
          ? `${user.name} unverified`
          : `${user.name} verified`
      );
      setUserMenuOpen(false);
      loadAllUsers();
    } catch (error) {
      console.error("Toggle verified error:", error);
      toast.error("Failed to update verification status");
    }
  };

  const handleToggleEmailVerified = async (user: User) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/verify-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ emailVerified: !user.emailVerified }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update email verification status");
        return;
      }

      toast.success(
        user.emailVerified
          ? `Email unverified for ${user.name}`
          : `Email verified for ${user.name}`
      );
      setUserMenuOpen(false);
      loadAllUsers();
    } catch (error) {
      console.error("Toggle email verified error:", error);
      toast.error("Failed to update email verification status");
    }
  };

  const [scamDialogOpen, setScamDialogOpen] = useState(false);
  const [scamUser, setScamUser] = useState<User | null>(null);

  const handleMarkAsScam = async (user: User) => {
    setScamUser(user);
    setScamDialogOpen(true);
  };

  const confirmMarkAsScam = async () => {
    if (!scamUser) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${scamUser.id}/tag`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ tag: "SCAM", tagColor: "#dc2626" }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to mark as scam");
        return;
      }

      toast.success(`${scamUser.name} marked as SCAM`);
      setUserMenuOpen(false);
      setScamDialogOpen(false);
      setScamUser(null);
      loadAllUsers();
    } catch (error) {
      console.error("Mark as scam error:", error);
      toast.error("Failed to mark as scam");
    }
  };

  const handleToggleModerator = async (user: User) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/moderator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ moderator: !user.moderator }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update moderator status");
        return;
      }

      toast.success(
        user.moderator
          ? `${user.name} removed from moderators`
          : `${user.name} promoted to moderator`
      );
      setUserMenuOpen(false);
      loadAllUsers();
    } catch (error) {
      console.error("Toggle moderator error:", error);
      toast.error("Failed to update moderator status");
    }
  };

  const handleAddCoins = async (user: User, amount: number) => {
    try {
      const updatedUser = {
        ...user,
        coins: ((user as any).coins || 0) + amount
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/set`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            key: `user:${user.id}`,
            value: updatedUser
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add coins");
      }

      toast.success(`Added ${amount} coins to ${user.name}! New balance: ${updatedUser.coins}`);
      setUserMenuOpen(false);
      loadAllUsers();
    } catch (error) {
      console.error("Add coins error:", error);
      toast.error("Failed to add coins");
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    const validUsers = allUsers.filter(u => u.name && u.username && u.id !== userId);
    if (selectedUserIds.size === validUsers.length) {
      // Deselect all
      setSelectedUserIds(new Set());
    } else {
      // Select all
      setSelectedUserIds(new Set(validUsers.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.size === 0) {
      toast.error("No users selected");
      return;
    }

    setBulkDeleteDialogOpen(false);

    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const userIdToDelete of Array.from(selectedUserIds)) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${userIdToDelete}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
                "X-User-Id": userId || "",
              },
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to delete user ${userIdToDelete}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} user${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} user${failCount > 1 ? 's' : ''}`);
      }

      setSelectedUserIds(new Set());
      loadAllUsers();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete users");
    }
  };

  const handleToggleChannelSelection = (channelId: string) => {
    setSelectedChannelIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  const handleToggleSelectAllChannels = () => {
    const validChannels = allChannels.filter(c => c.type === 'channel');
    if (selectedChannelIds.size === validChannels.length) {
      // Deselect all
      setSelectedChannelIds(new Set());
    } else {
      // Select all
      setSelectedChannelIds(new Set(validChannels.map(c => c.id)));
    }
  };

  const handleBulkDeleteChannels = async () => {
    if (selectedChannelIds.size === 0) {
      toast.error("No channels selected");
      return;
    }

    setBulkDeleteChannelsDialogOpen(false);

    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const channelIdToDelete of Array.from(selectedChannelIds)) {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels/${channelIdToDelete}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
                "X-User-Id": userId || "",
              },
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to delete channel ${channelIdToDelete}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} channel${successCount > 1 ? 's' : ''}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} channel${failCount > 1 ? 's' : ''}`);
      }

      setSelectedChannelIds(new Set());
      loadAllChannels();
    } catch (error) {
      console.error("Bulk delete channels error:", error);
      toast.error("Failed to delete channels");
    }
  };

  const handleToggleChannelVerified = async (channel: Channel) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels/${channel.id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId || "",
          },
          body: JSON.stringify({ verified: !channel.verified }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update channel verification");
        return;
      }

      toast.success(
        channel.verified
          ? `${channel.name} unverified`
          : `${channel.name} verified ✓`
      );
      setChannelMenuOpen(false);
      loadAllChannels();
    } catch (error) {
      console.error("Toggle channel verified error:", error);
      toast.error("Failed to update channel verification");
    }
  };

  const handleSendGlobalMessage = async () => {
    if (!globalMessage) {
      toast.error("Please enter a message to send");
      return;
    }

    setTrollLoading(true);
    try {
      // Broadcast via Supabase Realtime
      console.log('[Troll Admin] Creating channel for broadcast');
      const trollChannel = supabase.channel('troll-zone-global', {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      
      // Wait for subscription to be ready
      await new Promise<void>((resolve, reject) => {
        trollChannel
          .subscribe((status: string) => {
            console.log('[Troll Admin] Subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(`Subscription failed with status: ${status}`));
            }
          });
      });
      
      console.log('[Troll Admin] Sending broadcast message:', globalMessage);
      const result = await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: {
          action: 'broadcast',
          message: globalMessage,
          timestamp: Date.now()
        }
      });
      console.log('[Troll Admin] Broadcast send result:', result);

      toast.success(`✉️ Global message broadcasted to all users!`);
      setGlobalMessage("");
      
      // Unsubscribe after sending
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Send global message error:", error);
      toast.error("Failed to send message");
    } finally {
      setTrollLoading(false);
    }
  };

  const handleScreenShake = async () => {
    try {
      // Broadcast via Supabase Realtime
      console.log('[Troll Admin] Creating channel for shake');
      const trollChannel = supabase.channel('troll-zone-global', {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      
      // Wait for subscription to be ready
      await new Promise<void>((resolve, reject) => {
        trollChannel
          .subscribe((status: string) => {
            console.log('[Troll Admin] Shake subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(`Subscription failed with status: ${status}`));
            }
          });
      });
      
      console.log('[Troll Admin] Sending shake action');
      const result = await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: {
          action: 'shake',
          timestamp: Date.now()
        }
      });
      console.log('[Troll Admin] Shake send result:', result);
      
      toast.success("🔨 Screen shake activated for all users!");
      
      // Unsubscribe after sending
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Screen shake error:", error);
      toast.error("Failed to activate screen shake");
    }
  };

  const handleConfetti = async () => {
    try {
      // Broadcast via Supabase Realtime
      console.log('[Troll Admin] Creating channel for confetti');
      const trollChannel = supabase.channel('troll-zone-global', {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      
      // Wait for subscription to be ready
      await new Promise<void>((resolve, reject) => {
        trollChannel
          .subscribe((status: string) => {
            console.log('[Troll Admin] Confetti subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(`Subscription failed with status: ${status}`));
            }
          });
      });
      
      console.log('[Troll Admin] Sending confetti action');
      const result = await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: {
          action: 'confetti',
          timestamp: Date.now()
        }
      });
      console.log('[Troll Admin] Confetti send result:', result);
      
      toast.success("🎉 Confetti explosion triggered for all users!");
      
      // Unsubscribe after sending
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Confetti error:", error);
      toast.error("Failed to trigger confetti");
    }
  };

  const handleFakeUpdate = async () => {
    try {
      // Broadcast via Supabase Realtime
      console.log('[Troll Admin] Creating channel for fake update');
      const trollChannel = supabase.channel('troll-zone-global', {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      
      // Wait for subscription to be ready
      await new Promise<void>((resolve, reject) => {
        trollChannel
          .subscribe((status: string) => {
            console.log('[Troll Admin] Update subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(`Subscription failed with status: ${status}`));
            }
          });
      });
      
      console.log('[Troll Admin] Sending fake update action');
      const result = await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: {
          action: 'update',
          timestamp: Date.now()
        }
      });
      console.log('[Troll Admin] Update send result:', result);
      
      toast.success("⚠️ Fake update alert sent to all users!");
      
      // Unsubscribe after sending
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Fake update error:", error);
      toast.error("Failed to send update alert");
    }
  };

  const handleEmojiRain = async () => {
    try {
      // Broadcast via Supabase Realtime
      console.log('[Troll Admin] Creating channel for emoji rain');
      const trollChannel = supabase.channel('troll-zone-global', {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      
      // Wait for subscription to be ready
      await new Promise<void>((resolve, reject) => {
        trollChannel
          .subscribe((status: string) => {
            console.log('[Troll Admin] Emoji rain subscription status:', status);
            if (status === 'SUBSCRIBED') {
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              reject(new Error(`Subscription failed with status: ${status}`));
            }
          });
      });
      
      console.log('[Troll Admin] Sending emoji rain action');
      const result = await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: {
          action: 'emojiRain',
          timestamp: Date.now()
        }
      });
      console.log('[Troll Admin] Emoji rain send result:', result);
      
      toast.success("🌧️ Emoji rain activated for all users!");
      
      // Unsubscribe after sending
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Emoji rain error:", error);
      toast.error("Failed to activate emoji rain");
    }
  };

  const handleGlitchEffect = async () => {
    try {
      const trollChannel = supabase.channel('troll-zone-global', {
        config: { broadcast: { self: true } }
      });
      
      await new Promise<void>((resolve, reject) => {
        trollChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
      });
      
      await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: { action: 'glitchEffect', timestamp: Date.now() }
      });
      
      toast.success("📺 Glitch effect activated!");
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Glitch error:", error);
      toast.error("Failed to activate glitch");
    }
  };

  const handleDiscoMode = async () => {
    try {
      const trollChannel = supabase.channel('troll-zone-global', {
        config: { broadcast: { self: true } }
      });
      
      await new Promise<void>((resolve, reject) => {
        trollChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
      });
      
      await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: { action: 'discoMode', timestamp: Date.now() }
      });
      
      toast.success("🪩 Disco mode activated! Let's party!");
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Disco error:", error);
      toast.error("Failed to activate disco mode");
    }
  };

  const handleFlipScreen = async () => {
    try {
      const trollChannel = supabase.channel('troll-zone-global', {
        config: { broadcast: { self: true } }
      });
      
      await new Promise<void>((resolve, reject) => {
        trollChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
      });
      
      await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: { action: 'flipScreen', timestamp: Date.now() }
      });
      
      toast.success("🔄 Screen flipped for all users!");
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Flip error:", error);
      toast.error("Failed to flip screens");
    }
  };

  const handleRickRoll = async () => {
    try {
      const trollChannel = supabase.channel('troll-zone-global', {
        config: { broadcast: { self: true } }
      });
      
      await new Promise<void>((resolve, reject) => {
        trollChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
      });
      
      await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: { action: 'rickRoll', timestamp: Date.now() }
      });
      
      toast.success("🎵 Never gonna give you up! Rick rolled all users!");
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Rick roll error:", error);
      toast.error("Failed to rick roll");
    }
  };

  const handleZaWarudo = async () => {
    try {
      const trollChannel = supabase.channel('troll-zone-global', {
        config: { broadcast: { self: true } }
      });
      
      await new Promise<void>((resolve, reject) => {
        trollChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
      });
      
      await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: { action: 'zaWarudo', timestamp: Date.now() }
      });
      
      toast.success("⏰ ZA WARUDO! Time has stopped!");
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] Za Warudo error:", error);
      toast.error("Failed to stop time");
    }
  };

  const handleToBeContinued = async () => {
    try {
      const trollChannel = supabase.channel('troll-zone-global', {
        config: { broadcast: { self: true } }
      });
      
      await new Promise<void>((resolve, reject) => {
        trollChannel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            reject(new Error(`Subscription failed: ${status}`));
          }
        });
      });
      
      await trollChannel.send({
        type: 'broadcast',
        event: 'troll-action',
        payload: { action: 'toBeContinued', timestamp: Date.now() }
      });
      
      toast.success("⬅️ To Be Continued... activated!");
      await supabase.removeChannel(trollChannel);
    } catch (error) {
      console.error("[Troll Admin] To Be Continued error:", error);
      toast.error("Failed to activate To Be Continued");
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    try {
      const settings = {
        serverName,
        maxGroupMembers: parseInt(maxGroupMembers) || 50,
        allowRegistration,
        messageRetentionDays: parseInt(messageRetentionDays) || 365,
        maxMessageLength: parseInt(maxMessageLength) || 2000,
        enableFileUploads,
        requireEmailVerification,
        enableOnlineStatus,
        geminiApiKey: geminiApiKey || '',  // Save API key to Supabase settings
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": userId,
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save settings");
        return;
      }

      // Save best language of the month
      if (bestLanguageKey) {
        const selectedLang = customLanguages.find(l => l.key === bestLanguageKey);
        if (selectedLang) {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/best-language-of-month`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                value: {
                  key: selectedLang.key,
                  displayName: selectedLang.displayName
                }
              }),
            }
          );
        }
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Save settings error:", error);
      toast.error("Failed to save settings");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.email !== "mikhail02323@gmail.com") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col h-screen overflow-hidden">
      {/* Header - Fixed */}
      <div className="border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Shield className="size-8 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">Admin Panel</h1>
              <p className="text-sm text-gray-400 hidden md:block">ChozaChat Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="size-4 md:mr-2" />
              <span className="hidden sm:inline">Back to Chats</span>
            </Button>
            <div className="text-right hidden md:block">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-xs text-gray-400">{currentUser.email}</div>
            </div>
            <Avatar className="flex-shrink-0">
              <AvatarFallback className="bg-red-600 text-white">
                {currentUser.emoji ? (
                  <span className="text-2xl">{currentUser.emoji}</span>
                ) : (
                  currentUser.name?.charAt(0)?.toUpperCase() || "?"
                )}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="flex-shrink-0">
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-6 flex flex-col">
          <Tabs defaultValue="users" className="w-full flex flex-col h-full overflow-hidden">
            <TabsList className="bg-gray-900 border border-gray-800 flex-shrink-0">
              <TabsTrigger value="users" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400">
                <Users className="size-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="channels" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400">
                <span className="mr-2">#</span>
                Channels
              </TabsTrigger>
              <TabsTrigger value="troll" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400">
                <span className="mr-2">😈</span>
                Troll Zone
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400">
                <Settings className="size-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

          <TabsContent value="users" className="mt-6 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">User Management</h2>
                    <p className="text-sm text-gray-400">Total users: {allUsers.filter(u => u.name && u.username).length}</p>
                  </div>
                  {selectedUserIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{selectedUserIds.size} selected</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkDeleteDialogOpen(true)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>

                {allUsers.filter(u => u.name && u.username).length > 0 && (
                  <div className="mb-3 flex items-center gap-2 pb-3 border-b border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSelectAll}
                      className="text-gray-400 hover:text-white"
                    >
                      {selectedUserIds.size === allUsers.filter(u => u.name && u.username && u.id !== userId).length ? (
                        <CheckSquare className="size-4 mr-2" />
                      ) : (
                        <Square className="size-4 mr-2" />
                      )}
                      {selectedUserIds.size === allUsers.filter(u => u.name && u.username && u.id !== userId).length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                )}
                
                <div className="space-y-3">
                  {allUsers.filter(u => u.name && u.username).map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {user.id !== userId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUserSelection(user.id);
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                          >
                            {selectedUserIds.has(user.id) ? (
                              <CheckSquare className="size-5 text-blue-500" />
                            ) : (
                              <Square className="size-5" />
                            )}
                          </button>
                        )}
                        <Avatar>
                          <AvatarFallback className="bg-blue-600 text-white">
                            {user?.emoji ? (
                              <span className="text-2xl">{user.emoji}</span>
                            ) : (
                              user?.name?.charAt(0)?.toUpperCase() || "?"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserMenuOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user?.name || 'Unknown'}</span>
                            {user.verified && (
                              <CheckCircle className="size-4 text-blue-500" />
                            )}
                            {user.tag && (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-bold"
                                style={{
                                  backgroundColor: user.tagColor || "#3b82f6",
                                  color: "#ffffff",
                                }}
                              >
                                {user.tag}
                              </span>
                            )}
                            {user.passwordCompromised && (
                              <AlertTriangle className="size-4 text-yellow-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">@{user?.username || 'unknown'}</div>
                          <div className="text-xs text-gray-500">{user?.email || 'No email'}</div>
                        </div>
                        <MoreVertical 
                          className="size-5 text-gray-400 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserMenuOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="channels" className="mt-6 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Channel Management</h2>
                    <p className="text-sm text-gray-400">Total channels: {allChannels.filter(c => c.type === 'channel').length}</p>
                  </div>
                  {selectedChannelIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{selectedChannelIds.size} selected</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkDeleteChannelsDialogOpen(true)}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>

                {allChannels.filter(c => c.type === 'channel').length > 0 && (
                  <div className="mb-3 flex items-center gap-2 pb-3 border-b border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSelectAllChannels}
                      className="text-gray-400 hover:text-white"
                    >
                      {selectedChannelIds.size === allChannels.filter(c => c.type === 'channel').length ? (
                        <CheckSquare className="size-4 mr-2" />
                      ) : (
                        <Square className="size-4 mr-2" />
                      )}
                      {selectedChannelIds.size === allChannels.filter(c => c.type === 'channel').length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                )}
                
                <div className="space-y-3">
                  {allChannels.filter(c => c.type === 'channel').map((channel) => (
                    <div
                      key={channel.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleChannelSelection(channel.id);
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                        >
                          {selectedChannelIds.has(channel.id) ? (
                            <CheckSquare className="size-5 text-purple-500" />
                          ) : (
                            <Square className="size-5" />
                          )}
                        </button>
                        <Avatar>
                          <AvatarFallback className="bg-purple-600 text-white">
                            {channel.emoji ? (
                              <span className="text-2xl">{channel.emoji}</span>
                            ) : (
                              "#"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setSelectedChannel(channel);
                            setChannelMenuOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{channel.name}</span>
                            {channel.verified && (
                              <CheckCircle className="size-4 text-blue-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            @{channel.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created {channel.createdAt ? new Date(channel.createdAt).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                        <MoreVertical 
                          className="size-5 text-gray-400 cursor-pointer"
                          onClick={() => {
                            setSelectedChannel(channel);
                            setChannelMenuOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="troll" className="mt-6 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">😈 Troll Zone</h2>
                  <p className="text-sm text-gray-400">Have some fun with your users (responsibly!)</p>
                </div>

                <div className="space-y-6 max-w-4xl">
                {/* Global Message */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
                    <span>✉️</span>
                    Global Message Broadcast
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">Send a message that appears as a toast notification to all users</p>
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter your message..."
                      value={globalMessage}
                      onChange={(e) => setGlobalMessage(e.target.value)}
                      className="bg-gray-900 border-gray-600 text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && globalMessage) {
                          handleSendGlobalMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendGlobalMessage}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={trollLoading || !globalMessage}
                    >
                      {trollLoading ? "Sending..." : "📢 Broadcast Message"}
                    </Button>
                  </div>
                </div>

                {/* Fun Effects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Screen Shake */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>🔨</span>
                      Screen Shake
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Make everyone's screen shake violently for 2 seconds</p>
                    <Button
                      onClick={handleScreenShake}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Activate Shake
                    </Button>
                  </div>

                  {/* Confetti */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-pink-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>🎉</span>
                      Confetti Explosion
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Trigger confetti celebration for all users</p>
                    <Button
                      onClick={handleConfetti}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      Launch Confetti
                    </Button>
                  </div>

                  {/* Fake Update */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-yellow-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>⚠️</span>
                      Fake Update Alert
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Show a fake "Critical Update Required" message</p>
                    <Button
                      onClick={handleFakeUpdate}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      Send Fake Alert
                    </Button>
                  </div>

                  {/* Emoji Rain */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>🌧️</span>
                      Emoji Rain
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Make random emojis rain down everyone's screen</p>
                    <Button
                      onClick={handleEmojiRain}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Start Emoji Rain
                    </Button>
                  </div>

                  {/* Glitch Effect */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>📺</span>
                      Glitch Matrix
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Trigger a glitchy matrix effect across all screens</p>
                    <Button
                      onClick={handleGlitchEffect}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Activate Glitch
                    </Button>
                  </div>

                  {/* Disco Mode */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-cyan-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>🪩</span>
                      Disco Mode
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Flash random background colors like a disco party</p>
                    <Button
                      onClick={handleDiscoMode}
                      className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                      Start Party! 🎊
                    </Button>
                  </div>

                  {/* Flip Screen */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-green-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>🔄</span>
                      Flip Screen
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Turn everyone's screen upside down for 5 seconds</p>
                    <Button
                      onClick={handleFlipScreen}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Flip It!
                    </Button>
                  </div>

                  {/* Rick Roll */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-orange-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>🎵</span>
                      Never Gonna Give You Up
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Classic rickroll - show lyrics to all users</p>
                    <Button
                      onClick={handleRickRoll}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      Rick Roll 'Em
                    </Button>
                  </div>

                  {/* Za Warudo */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-yellow-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>⏰</span>
                      ZA WARUDO!
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Dio's time stop with white flash and golden text</p>
                    <Button
                      onClick={handleZaWarudo}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      ⏰ ZA WARUDO!
                    </Button>
                  </div>

                  {/* To Be Continued */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-amber-500 transition-colors">
                    <h3 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
                      <span>⬅️</span>
                      To Be Continued...
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">Freeze frame with the iconic JoJo ending arrow</p>
                    <Button
                      onClick={handleToBeContinued}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      ⬅️ To Be Continued
                    </Button>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-200">
                    <strong>⚠️ Note:</strong> These commands will affect all users who have the app open. Use responsibly and have fun!
                  </p>
                </div>
              </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-6 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Server Settings</h2>
                  <p className="text-sm text-gray-400">Configure your ChozaChat server</p>
                </div>

                <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">General Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="serverName" className="text-white">Server Name</Label>
                      <Input
                        id="serverName"
                        type="text"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxGroupMembers" className="text-white">Max Group Members</Label>
                      <Input
                        id="maxGroupMembers"
                        type="number"
                        value={maxGroupMembers}
                        onChange={(e) => setMaxGroupMembers(e.target.value)}
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">User Management</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowRegistration"
                        checked={allowRegistration}
                        onChange={(e) => setAllowRegistration(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="allowRegistration" className="text-white">
                        Allow New User Registration
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requireEmailVerification"
                        checked={requireEmailVerification}
                        onChange={(e) => setRequireEmailVerification(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="requireEmailVerification" className="text-white">
                        Require Email Verification
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableOnlineStatus"
                        checked={enableOnlineStatus}
                        onChange={(e) => setEnableOnlineStatus(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="enableOnlineStatus" className="text-white">
                        Show Online Status
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Message Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="messageRetentionDays" className="text-white">Message Retention (Days)</Label>
                      <Input
                        id="messageRetentionDays"
                        type="number"
                        value={messageRetentionDays}
                        onChange={(e) => setMessageRetentionDays(e.target.value)}
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Messages older than this will be auto-deleted. Set to 0 to keep forever.</p>
                    </div>

                    <div>
                      <Label htmlFor="maxMessageLength" className="text-white">Max Message Length (Characters)</Label>
                      <Input
                        id="maxMessageLength"
                        type="number"
                        value={maxMessageLength}
                        onChange={(e) => setMaxMessageLength(e.target.value)}
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableFileUploads"
                        checked={enableFileUploads}
                        onChange={(e) => setEnableFileUploads(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="enableFileUploads" className="text-white">
                        Enable File Uploads (Coming Soon)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">AI Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="geminiApiKey" className="text-white">Gemini API Key (Global)</Label>
                      <Input
                        id="geminiApiKey"
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Set a global Gemini API key for all users. Users can override with their own key in settings.
                      </p>
                      {geminiApiKey && (
                        <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                          <span>✓</span> Global API key is configured (remember to click Save Settings)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                    ⭐ Best Language of the Month
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bestLanguage" className="text-white">Select Language</Label>
                      <select
                        id="bestLanguage"
                        value={bestLanguageKey}
                        onChange={(e) => setBestLanguageKey(e.target.value)}
                        className="mt-2 w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
                      >
                        <option value="">None</option>
                        {customLanguages.map(lang => (
                          <option key={lang.key} value={lang.key}>
                            {lang.displayName}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        This language will be featured in all users' settings with a special highlight.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Settings Button */}
                <div className="border-t border-gray-800 pt-6">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Settings
                  </Button>
                </div>

                {/* Announcement Section */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">Global Announcements</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Create announcements that will be shown to all users on login
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="announcementTitle" className="text-white">Announcement Title</Label>
                      <Input
                        id="announcementTitle"
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="Enter announcement title..."
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="announcementDescription" className="text-white">Announcement Description</Label>
                      <Textarea
                        id="announcementDescription"
                        value={announcementDescription}
                        onChange={(e) => setAnnouncementDescription(e.target.value)}
                        placeholder="Enter announcement description..."
                        className="mt-2 bg-gray-800 border-gray-700 text-white min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="announcementButtonText" className="text-white">Button Text</Label>
                      <Input
                        id="announcementButtonText"
                        type="text"
                        value={announcementButtonText}
                        onChange={(e) => setAnnouncementButtonText(e.target.value)}
                        placeholder="e.g., Got it!, Okay, Understood, etc."
                        className="mt-2 bg-gray-800 border-gray-700 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="announcementEnabled"
                        checked={announcementEnabled}
                        onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="announcementEnabled" className="text-white">
                        Enable Announcement (Show to all users)
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveAnnouncement} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save Announcement
                      </Button>
                      {currentAnnouncement && announcementEnabled && (
                        <Button 
                          onClick={handleDisableAnnouncement} 
                          variant="outline"
                          className="border-gray-700 hover:bg-gray-800"
                        >
                          Disable Current
                        </Button>
                      )}
                    </div>

                    {currentAnnouncement && (
                      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-blue-200">
                          <strong>📢 Current announcement:</strong> {currentAnnouncement.title}
                          {currentAnnouncement.enabled ? ' (Active)' : ' (Disabled)'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <Button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700">
                    Save Settings
                  </Button>
                </div>
              </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* User Menu Dialog */}
      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Manage User: {selectedUser?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select an action to perform on this user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && selectedUser.id !== userId && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                onClick={() => {
                  setChangePasswordDialogOpen(true);
                }}
              >
                <Key className="size-4 mr-2" />
                Change Password
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                onClick={() => handleMarkPasswordCompromised(selectedUser, !selectedUser.passwordCompromised)}
              >
                <AlertTriangle className="size-4 mr-2" />
                {selectedUser.passwordCompromised ? "Clear Compromised Status" : "Mark Password as Compromised"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                onClick={() => handleToggleVerified(selectedUser)}
              >
                <CheckCircle className="size-4 mr-2" />
                {selectedUser.verified ? "Unverify User" : "Verify User"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                onClick={() => handleToggleEmailVerified(selectedUser)}
              >
                <CheckCircle className="size-4 mr-2" />
                {selectedUser.emailVerified ? "Unverify Email" : "Verify Email"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800 text-red-400"
                onClick={() => handleMarkAsScam(selectedUser)}
              >
                <AlertTriangle className="size-4 mr-2" />
                Mark as SCAM
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                onClick={() => handleToggleModerator(selectedUser)}
              >
                <Shield className="size-4 mr-2" />
                {selectedUser.moderator ? "Remove from Moderators" : "Promote to Moderator"}
              </Button>

              {/* Coin Management */}
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Coins:</span>
                  <span className="font-bold text-purple-400">{(selectedUser as any).coins || 0}</span>
                </div>
                {(selectedUser as any).subscription?.tier && new Date((selectedUser as any).subscription.expiresAt) > new Date() && (
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>Subscription:</span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${(selectedUser as any).subscription.tier === 'ultra' ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gradient-to-r from-purple-500 to-pink-400'} text-white`}>
                      {(selectedUser as any).subscription.tier === 'ultra' ? 'ChozaBoost Ultra' : 'ChozaBoost'}
                    </span>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white border-0"
                  onClick={() => {
                    setCoinsAmount("");
                    setAddCoinsDialogOpen(true);
                  }}
                >
                  💰 Add Coins
                </Button>
              </div>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => handleDeleteUser(selectedUser)}
              >
                <Trash2 className="size-4 mr-2" />
                Delete User
              </Button>
            </div>
          )}

          {selectedUser && selectedUser.id === userId && (
            <div className="space-y-2">
              <p className="text-center text-gray-400 py-2 text-sm">
                Your own account
              </p>
              <div className="space-y-2 pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Your Coins:</span>
                  <span className="font-bold text-purple-400">{(selectedUser as any).coins || 0}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white border-0"
                  onClick={() => {
                    setCoinsAmount("");
                    setAddCoinsDialogOpen(true);
                  }}
                >
                  💰 Add Coins to Self
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-white">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2 bg-gray-800 border-gray-700 text-white"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Channel Menu Dialog */}
      <Dialog open={channelMenuOpen} onOpenChange={setChannelMenuOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Manage Channel: {selectedChannel?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select an action to perform on this channel
            </DialogDescription>
          </DialogHeader>

          {selectedChannel && (
            <div className="space-y-3">
              <Button
                key="verify-btn"
                onClick={() => handleToggleChannelVerified(selectedChannel)}
                className="w-full justify-start"
                variant="outline"
              >
                <CheckCircle className="size-4 mr-2" />
                {selectedChannel.verified ? "Remove Verification" : "Verify Channel"}
              </Button>
              
              <Button
                key="scam-btn"
                onClick={async () => {
                  setScamDialogOpen(true);
                  
                  try {
                    // Mark channel as SCAM by setting its tag
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels/${selectedChannel.id}/scam`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${publicAnonKey}`,
                          "X-User-Id": userId || "",
                        },
                      }
                    );

                    const data = await response.json();
                    if (!response.ok) {
                      toast.error(data.error || "Failed to mark channel as SCAM");
                      return;
                    }

                    toast.success(`${selectedChannel.name} marked as SCAM`);
                    setChannelMenuOpen(false);
                    loadAllChannels();
                  } catch (error) {
                    console.error("Mark channel as scam error:", error);
                    toast.error("Failed to mark channel as SCAM");
                  }
                }}
                className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                variant="outline"
              >
                <AlertTriangle className="size-4 mr-2" />
                Mark as SCAM
              </Button>
              
              <Button
                key="delete-btn"
                onClick={async () => {
                  setDeleteUserDialogOpen(true);
                  
                  try {
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/channels/${selectedChannel.id}`,
                      {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${publicAnonKey}`,
                          "X-User-Id": userId || "",
                        },
                      }
                    );

                    const data = await response.json();
                    if (!response.ok) {
                      toast.error(data.error || "Failed to delete channel");
                      return;
                    }

                    toast.success(`Channel "${selectedChannel.name}" deleted successfully`);
                    setChannelMenuOpen(false);
                    setSelectedChannel(null);
                    loadAllChannels();
                  } catch (error) {
                    console.error("Delete channel error:", error);
                    toast.error("Failed to delete channel");
                  }
                }}
                className="w-full justify-start"
                variant="destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete Channel
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">⚠️ Confirm Bulk Delete</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedUserIds.size} user{selectedUserIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              <strong>Warning:</strong> This will permanently delete all selected users, their data, and messages.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkDeleteDialogOpen(false)}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-4 mr-2" />
              Delete {selectedUserIds.size} User{selectedUserIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Coins Dialog */}
      <Dialog open={addCoinsDialogOpen} onOpenChange={setAddCoinsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add Coins</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser ? `Add coins to ${selectedUser.name}'s balance (current: ${(selectedUser as any).coins || 0} coins)` : 'Add coins'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="coinsAmount" className="text-white">Amount of Coins</Label>
              <Input
                id="coinsAmount"
                type="number"
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
                className="mt-2 bg-gray-800 border-gray-700 text-white"
                placeholder="Enter amount"
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCoinsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500"
              onClick={() => {
                const amount = parseInt(coinsAmount);
                if (selectedUser && amount > 0) {
                  handleAddCoins(selectedUser, amount);
                  setAddCoinsDialogOpen(false);
                }
              }}
            >
              Add Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">⚠️ Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              {userToDelete ? `Delete user ${userToDelete.name}? This action cannot be undone.` : 'Delete user?'}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              <strong>Warning:</strong> This will permanently delete the user and all their data.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              <Trash2 className="size-4 mr-2" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as SCAM Confirmation Dialog */}
      <Dialog open={scamDialogOpen} onOpenChange={setScamDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">⚠️ Mark as SCAM</DialogTitle>
            <DialogDescription className="text-gray-400">
              {scamUser ? `Mark ${scamUser.name} as SCAM? This will set their tag to SCAM with a red background.` : 'Mark as SCAM?'}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <p className="text-sm text-red-200">
              <strong>Warning:</strong> This will publicly mark this user as a scammer.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScamDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmMarkAsScam}
            >
              <AlertTriangle className="size-4 mr-2" />
              Mark as SCAM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Channels Confirmation Dialog */}
      <Dialog open={bulkDeleteChannelsDialogOpen} onOpenChange={setBulkDeleteChannelsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">⚠️ Confirm Bulk Delete Channels</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedChannelIds.size} channel{selectedChannelIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              <strong>Warning:</strong> This will permanently delete all selected channels and their messages.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setBulkDeleteChannelsDialogOpen(false)}
              className="border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleBulkDeleteChannels}
            >
              <Trash2 className="size-4 mr-2" />
              Delete {selectedChannelIds.size} Channel{selectedChannelIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}