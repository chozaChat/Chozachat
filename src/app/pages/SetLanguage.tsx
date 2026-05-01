import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";
import { toast } from "sonner";

export default function SetLanguage() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { setLanguage, availableLanguages, loadCustomLanguages } = useLanguage();

  useEffect(() => {
    const setLang = async () => {
      if (name) {
        // Reload languages first to make sure we have the latest
        await loadCustomLanguages();

        // Give it a moment to update
        setTimeout(() => {
          // Check if language exists
          if (availableLanguages.includes(name)) {
            setLanguage(name);
            toast.success(`Language set to ${name}`);
          } else {
            console.log('[SetLanguage] Available languages:', availableLanguages);
            console.log('[SetLanguage] Requested language:', name);
            toast.error(`Language "${name}" not found`);
          }
          // Redirect to chat
          navigate('/chat');
        }, 300);
      } else {
        navigate('/chat');
      }
    };

    setLang();
  }, [name, setLanguage, loadCustomLanguages, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold dark:text-white mb-2">Setting Language...</h1>
        <p className="text-gray-500 dark:text-gray-400">Redirecting to chat...</p>
      </div>
    </div>
  );
}
