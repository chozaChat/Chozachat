import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { pb, register } from "../../lib/pocketbase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

export default function Signup() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Check for existing session on mount - redirect if already logged in
  useEffect(() => {
    const checkSession = () => {
      try {
        if (pb.authStore.isValid && pb.authStore.model) {
          console.log("User already logged in, redirecting to chat...");
          navigate("/chat");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password confirmation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    setLoading(true);

    try {
      // Register with PocketBase
      await register(email, password, name, username);

      toast.success("Account created successfully! Please sign in.");
      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-2xl font-bold dark:text-white">Create an account</CardTitle>
            <CardDescription className="dark:text-gray-400">Enter your details to get started</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-white">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="dark:text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="dark:text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  minLength={6}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="dark:text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign up"}
              </Button>
              <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}