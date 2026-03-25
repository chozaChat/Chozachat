import { useState, useEffect } from "react";
import { Shield, Users, Settings, LogOut, Trash2, Key, AlertTriangle, CheckCircle, MoreVertical, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";

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
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // Settings states
  const [serverName, setServerName] = useState("ChozaChat Admin");
  const [maxGroupMembers, setMaxGroupMembers] = useState("50");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [messageRetentionDays, setMessageRetentionDays] = useState("365");
  const [maxMessageLength, setMaxMessageLength] = useState("2000");
  const [enableFileUploads, setEnableFileUploads] = useState(false);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [enableOnlineStatus, setEnableOnlineStatus] = useState(true);

  // Troll states
  const [globalMessage, setGlobalMessage] = useState("");
  const [trollLoading, setTrollLoading] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      navigate("/");
      return;
    }
    setUserId(storedUserId);
    loadCurrentUser(storedUserId);
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

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/");
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Delete user ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}`,
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

      toast.success(`User ${user.name} deleted successfully`);
      setUserMenuOpen(false);
      setSelectedUser(null);
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

  const handleMarkAsScam = async (user: User) => {
    if (!confirm(`Mark ${user.name} as SCAM? This will set their tag to SCAM with a red background.`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/admin/users/${user.id}/tag`,
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

      toast.success(`${user.name} marked as SCAM`);
      setUserMenuOpen(false);
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="size-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-gray-400">ChozaChat Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
              onClick={() => navigate("/chat")}
            >
              <MessageSquare className="size-4 mr-2" />
              Back to Chats
            </Button>
            <div className="text-right">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-xs text-gray-400">{currentUser.email}</div>
            </div>
            <Avatar>
              <AvatarFallback className="bg-red-600 text-white">
                {currentUser.emoji ? (
                  <span className="text-2xl">{currentUser.emoji}</span>
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-800">
              <Users className="size-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="troll" className="data-[state=active]:bg-gray-800">
              <span className="mr-2">😈</span>
              Troll Zone
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-800">
              <Settings className="size-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold">User Management</h2>
                <p className="text-sm text-gray-400">Total users: {allUsers.length}</p>
              </div>
              
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {allUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserMenuOpen(true);
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
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
                          <div className="text-xs text-gray-400">@{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <MoreVertical className="size-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="troll" className="mt-6">
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
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mt-6">
                  <p className="text-sm text-yellow-200">
                    <strong>⚠️ Note:</strong> These commands will affect all users who have the app open. Use responsibly and have fun!
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
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

                <div className="pt-4 border-t border-gray-800">
                  <Button onClick={() => toast.success("Settings saved!")} className="bg-blue-600 hover:bg-blue-700">
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
                className="w-full justify-start border-gray-700 hover:bg-gray-800"
                onClick={() => handleMarkAsScam(selectedUser)}
              >
                <AlertTriangle className="size-4 mr-2 text-red-500" />
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
            <p className="text-center text-gray-400 py-4">
              You cannot perform actions on your own account
            </p>
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
    </div>
  );
}