import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { pb, login } from "../../lib/pocketbase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordCompromised, setPasswordCompromised] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Generate floating emojis once using useMemo
  const floatingEmojis = useMemo(() => {
    const emojiList = ['💬', '👋', '😊', '🎉', '✨', '🚀', '💙', '🌟'];
    return [...Array(8)].map((_, i) => {
      const startX = Math.random() * 90 + 5;
      const startY = Math.random() * 90 + 5;
      const endX = Math.random() * 90 + 5;
      const endY = Math.random() * 90 + 5;
      const scale = 0.5 + Math.random() * 1.5;
      const duration = 25 + Math.random() * 15; // Slower: 25-40 seconds
      const delay = Math.random() * 5;
      const rotationSpeed = 20 + Math.random() * 20; // 20-40 seconds per rotation
      return { id: `emoji-${i}`, emoji: emojiList[i], startX, startY, endX, endY, scale, duration, delay, rotationSpeed };
    });
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        console.log("Checking for existing session...");

        // Check PocketBase auth
        if (pb.authStore.isValid && pb.authStore.model) {
          console.log("Active PocketBase session found! Redirecting to chat...");
          localStorage.setItem("userId", pb.authStore.model.id);
          navigate("/chat");
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting to login with identifier:", identifier);

      // Login with PocketBase
      const authData = await login(identifier, password);

      console.log("Login successful - User ID:", authData.record.id);

      // Store user ID in localStorage for compatibility
      localStorage.setItem("userId", authData.record.id);

      // Check if password is compromised
      try {
        const user = await pb.collection('users').getOne(authData.record.id);

        if (user.passwordCompromised) {
          console.log("Password is marked as compromised");
          setCurrentUserId(authData.record.id);
          setPasswordCompromised(true);
          setChangePasswordOpen(true);
          toast.warning("Your password has been flagged as compromised. Please change it.");
          setLoading(false);
          return; // Don't navigate to chat yet
        }
      } catch (err) {
        console.error("Failed to check password status:", err);
        // Continue to chat even if check fails
      }

      toast.success("Login successful!");
      navigate("/chat");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      if (!currentUserId) {
        toast.error("User ID not found");
        return;
      }

      // Update password and clear compromised flag with PocketBase
      await pb.collection('users').update(currentUserId, {
        password: newPassword,
        passwordConfirm: newPassword,
        passwordCompromised: false
      });

      toast.success("Password changed successfully!");
      setChangePasswordOpen(false);
      navigate("/chat");
    } catch (error: any) {
      console.error("Change password error:", error);
      toast.error(error?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPasswordChange = () => {
    setChangePasswordOpen(false);
    navigate("/chat");
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 relative overflow-hidden">
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
              {emoji.emoji}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
      </Button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <Card 
          className="w-full max-w-md bg-white/40 dark:bg-gray-900/40 border-2 border-white/30 dark:border-gray-700/30 shadow-2xl" 
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold dark:text-white">welcome back to chozaChat</CardTitle>
            <CardDescription className="dark:text-gray-400">Enter your credentials to sign in</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="dark:text-white">Email or username</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="your@email.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>

      {/* Password Compromised Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Password Compromised</DialogTitle>
            <DialogDescription>
              Your password has been flagged as potentially compromised. We recommend changing it immediately for your security.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipPasswordChange}
                className="w-full sm:w-auto"
              >
                Skip for Now
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}