import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ArrowLeft, UserPlus, Check, Shield, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { motion } from "motion/react";
import { useBlur } from "../contexts/BlurContext";

const SERVER_ID = "make-server-a1c86d03";

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  emoji?: string;
  tag?: string;
  tagColor?: string;
  verified?: boolean;
  moderator?: boolean;
}

export default function InviteUser() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { blurStrength } = useBlur();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAlreadyFriend, setIsAlreadyFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Generate floating emojis once using useMemo
  const floatingEmojis = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      // Random starting position
      const startX = Math.random() * 90 + 5; // 5-95%
      const startY = Math.random() * 90 + 5; // 5-95%
      
      // Random ending position (anywhere on screen)
      const endX = Math.random() * 90 + 5; // 5-95%
      const endY = Math.random() * 90 + 5; // 5-95%
      
      const scale = 0.5 + Math.random() * 1.5;
      const duration = 25 + Math.random() * 15; // Slower: 25-40 seconds
      const delay = Math.random() * 5; // Random start delay
      const rotationSpeed = 20 + Math.random() * 20; // 20-40 seconds per rotation
      
      return { id: `emoji-${i}`, startX, startY, endX, endY, scale, duration, delay, rotationSpeed };
    });
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (username && authChecked) {
      loadUser();
    }
  }, [username, authChecked]); // Only reload when username changes or auth check completes

  const checkAuth = async () => {
    console.log('Checking auth...');
    
    // Check for custom auth session in localStorage
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");
    
    if (!accessToken || !userId) {
      console.log('No session found');
      setCurrentUser(null);
    } else {
      console.log('Session found for userId:', userId);
      setCurrentUser({ id: userId });
    }
    
    setAuthChecked(true);
  };

  const loadUser = async () => {
    try {
      setLoading(true);
      // Username is passed without @ in the URL, send it as-is
      const usernameToLookup = username || '';
      console.log('Looking up username:', usernameToLookup);
      const url = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/users/by-username/${encodeURIComponent(usernameToLookup)}`;
      console.log('Fetching URL:', url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log('User data:', userData);
        setUser(userData);
        if (currentUser) {
          await checkIfFriend(userData.id);
        }
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error("User not found");
      }
    } catch (error) {
      console.error("Error loading user:", error);
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const checkIfFriend = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "x-user-id": currentUser.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const friendsList = data.friends || [];
        setIsAlreadyFriend(friendsList.some((f: any) => f.id === userId));
      }
    } catch (error) {
      console.error("Error checking friend status:", error);
    }
  };

  const handleAddFriend = async () => {
    if (!user) return;
    
    if (!currentUser) {
      toast.error("Please log in to add friends");
      navigate("/");
      return;
    }

    try {
      setAdding(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "x-user-id": currentUser.id,
          },
          body: JSON.stringify({ friendEmail: user.email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Friend request sent!");
        setIsAlreadyFriend(true); // Optimistically update UI
      } else {
        toast.error(data.error || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to send friend request");
    } finally {
      setAdding(false);
    }
  };

  const handleCopyLink = () => {
    // Remove @ symbol from username for the URL
    const usernameWithoutAt = user?.username.replace('@', '');
    const link = `${window.location.origin}/#/u/${usernameWithoutAt}`;
    navigator.clipboard.writeText(link);
    toast.success("Profile link copied!");
  };

  const getTagColor = (color?: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500",
      red: "bg-red-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      yellow: "bg-yellow-500",
      pink: "bg-pink-500",
      orange: "bg-orange-500",
    };
    return colors[color || "blue"] || "bg-blue-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The user @{username} doesn't exist.
          </p>
          <Button onClick={() => navigate("/chat")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Chat
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated floating emojis in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingEmojis.map((emoji) => (
          <motion.div
            key={emoji.id}
            className="absolute text-6xl opacity-20"
            animate={{
              left: [`${emoji.startX}%`, `${emoji.endX}%`, `${emoji.startX}%`],
              top: [`${emoji.startY}%`, `${emoji.endY}%`, `${emoji.startY}%`],
              scale: emoji.scale,
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: emoji.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: emoji.delay
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: emoji.rotationSpeed,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {user.emoji || "👤"}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <Card 
        className="w-full max-w-md p-8 relative z-10 bg-white/40 dark:bg-gray-900/40 border-2 border-white/30 dark:border-gray-700/30 shadow-2xl"
        style={{ backdropFilter: 'blur(5px)' }}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Avatar */}
          <Avatar className="w-32 h-32 text-5xl">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              {user.emoji || user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-bold">{user.name}</h1>
              {user.verified && (
                <CheckCircle2 className="w-6 h-6 text-blue-500 fill-blue-500" />
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
            
            {/* Tags */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {user.moderator && (
                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded">
                  MOD
                </span>
              )}
              {user.tag && (
                <span
                  className={`px-2 py-0.5 ${getTagColor(user.tagColor)} text-white text-xs font-bold rounded`}
                >
                  {user.tag}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          {currentUser?.id === user.id ? (
            <div className="text-gray-600 dark:text-gray-400">
              This is your profile
            </div>
          ) : isAlreadyFriend ? (
            <Button variant="outline" disabled className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Already Friends
            </Button>
          ) : (
            <Button onClick={handleAddFriend} disabled={adding} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              {adding ? "Adding..." : "Add Friend"}
            </Button>
          )}

          {/* Copy Link */}
          <Button onClick={handleCopyLink} className="w-full">
            <Copy className="w-4 h-4 mr-2" />
            Copy Profile Link
          </Button>

          {/* Back to Chat */}
          <Button variant="ghost" onClick={() => navigate("/chat")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
        </div>
      </Card>
    </div>
  );
}