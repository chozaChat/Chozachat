import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <AlertTriangle className="size-24 text-yellow-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Home className="size-4 mr-2" />
            Go to Login
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate("/chat")}
            className="border-gray-700 hover:bg-gray-800"
          >
            Go to Chat
          </Button>
        </div>

        <div className="pt-6 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
