import { motion } from "motion/react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ArrowLeft, UserPlus, Check, Hash, Users, Copy } from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "../../lib/supabase";
import { useBlur } from "../contexts/BlurContext";

const SERVER_ID = "make-server-a1c86d03";

interface Channel {
  id: string;
  name: string;
  emoji?: string;
  members: string[];
  createdBy: string;
  username?: string;
}

export default function InviteChannel() {
  const { channelname } = useParams();
  const navigate = useNavigate();
  const { blurStrength } = useBlur();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Generate floating emojis once using useMemo
  const floatingEmojis = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      const startX = Math.random() * 90 + 5;
      const startY = Math.random() * 90 + 5;
      const endX = Math.random() * 90 + 5;
      const endY = Math.random() * 90 + 5;
      const scale = 0.5 + Math.random() * 1.5;
      const duration = 25 + Math.random() * 15; // Slower: 25-40 seconds
      const delay = Math.random() * 5;
      const rotationSpeed = 20 + Math.random() * 20; // 20-40 seconds per rotation
      return { id: `emoji-${i}`, startX, startY, endX, endY, scale, duration, delay, rotationSpeed };
    });
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (channelname) {
      loadChannel();
    }
  }, [channelname, currentUser]);

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
  };

  const loadChannel = async () => {
    try {
      setLoading(true);
      // Username is passed without @ in the URL, send it as-is
      const usernameToLookup = channelname || '';
      console.log('Looking up channel username:', usernameToLookup);
      const url = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/by-username/${encodeURIComponent(usernameToLookup)}`;
      console.log('Fetching URL:', url);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const channelData = await response.json();
        console.log('Channel data:', channelData);
        setChannel(channelData);
        if (currentUser) {
          setIsAlreadyMember(channelData.members.includes(currentUser.id));
        }
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error("Channel not found");
      }
    } catch (error) {
      console.error("Error loading channel:", error);
      toast.error("Failed to load channel");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async () => {
    if (!channel) return;

    if (!currentUser) {
      toast.error("Please log in to join channels");
      navigate("/");
      return;
    }

    try {
      setJoining(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${channel.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "x-user-id": currentUser.id,
          },
          body: JSON.stringify({ userId: currentUser.id }),
        }
      );

      if (response.ok) {
        toast.success(`Joined #${channel.name}!`);
        setIsAlreadyMember(true);
        setTimeout(() => navigate("/chat"), 1500);
      } else {
        const error = await response.text();
        toast.error(error || "Failed to join channel");
      }
    } catch (error) {
      console.error("Error joining channel:", error);
      toast.error("Failed to join channel");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    // Use username if available, otherwise fall back to channel name
    const usernameWithoutAt = channel?.username?.replace('@', '') || channel?.name || '';
    const link = `${window.location.origin}/#/c/${usernameWithoutAt}`;
    navigator.clipboard.writeText(link);
    toast.success("Channel link copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Channel Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The channel "#{channelname}" doesn't exist.
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
              {channel.emoji || "#"}
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
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              {channel.emoji || <Hash className="w-16 h-16" />}
            </AvatarFallback>
          </Avatar>

          {/* Channel Info */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">#{channel.name}</h1>
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{channel.members.length} member{channel.members.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Action Button */}
          {isAlreadyMember ? (
            <Button variant="outline" disabled className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Already a Member
            </Button>
          ) : (
            <Button onClick={handleJoinChannel} disabled={joining} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              {joining ? "Joining..." : "Join Channel"}
            </Button>
          )}

          {/* Copy Link */}
          <Button onClick={handleCopyLink} className="w-full">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
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