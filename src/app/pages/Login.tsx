import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

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
  const SERVER_ID = 'make-server-a1c86d03';

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Active session found! Redirecting to chat...");
          console.log("User ID:", session.user.id);
          
          // Store session data
          localStorage.setItem("userId", session.user.id);
          localStorage.setItem("accessToken", session.access_token);
          
          // Redirect to chat
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
      // First, try to find if identifier is a username
      let email = identifier;
      
      // Check if identifier is a username (doesn't contain @)
      if (!identifier.includes('@')) {
        console.log("Identifier appears to be a username, looking up email...");
        try {
          const userLookupResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/lookup?username=${encodeURIComponent(identifier)}`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          console.log("Username lookup response status:", userLookupResponse.status);
          
          if (userLookupResponse.ok) {
            const userData = await userLookupResponse.json();
            email = userData.email;
            console.log("Username found, using email:", email);
          } else {
            const errorData = await userLookupResponse.json();
            console.error("Username lookup failed:", errorData);
            toast.error(
              `Username "${identifier}" not found. Please check spelling or use your email address instead.`
            );
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Username lookup error:", err);
          toast.error("Failed to lookup username. Try using your email address instead.");
          setLoading(false);
          return;
        }
      }
      
      console.log("Attempting to sign in with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Supabase auth error:", error);
        toast.error(`Login failed: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Store session
        console.log("Login successful - Session data:");
        console.log("Access token (first 50 chars):", data.session.access_token.substring(0, 50));
        console.log("User ID:", data.user.id);
        console.log("Token expires at:", new Date(data.session.expires_at! * 1000).toISOString());
        
        localStorage.setItem("accessToken", data.session.access_token);
        localStorage.setItem("userId", data.user.id);
        
        // Also store refresh token to maintain session
        if (data.session.refresh_token) {
          localStorage.setItem("refreshToken", data.session.refresh_token);
        }
        
        // Verify storage
        console.log("Stored in localStorage:");
        console.log("Access token:", localStorage.getItem("accessToken")?.substring(0, 50));
        console.log("User ID:", localStorage.getItem("userId"));
        
        // Check if password is compromised
        try {
          const userResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/${data.user.id}`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.user?.passwordCompromised) {
              console.log("Password is marked as compromised");
              setCurrentUserId(data.user.id);
              setPasswordCompromised(true);
              setChangePasswordOpen(true);
              toast.warning("Your password has been flagged as compromised. Please change it.");
              setLoading(false);
              return; // Don't navigate to chat yet
            }
          }
        } catch (err) {
          console.error("Failed to check password status:", err);
          // Continue to chat even if check fails
        }
        
        toast.success("Login successful!");
        navigate("/chat");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
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
      
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error("Failed to change password: " + error.message);
        return;
      }

      // Clear compromised flag in our KV store
      if (currentUserId) {
        const userResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/${currentUserId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const updatedUser = {
            ...userData.user,
            passwordCompromised: false
          };
          
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/set`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                key: `user:${currentUserId}`,
                value: updatedUser
              }),
            }
          );
        }
      }

      toast.success("Password changed successfully!");
      setChangePasswordOpen(false);
      navigate("/chat");
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPasswordChange = () => {
    setChangePasswordOpen(false);
    navigate("/chat");
  };

  return (
    <div className="size-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
      </Button>
      <Card className="w-full max-w-md dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold dark:text-white">welcome back to chozaChat</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter your credentials to sign in</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="dark:text-white">Email</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="your@email.com"
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