import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { ArrowLeft, Save, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../contexts/ThemeContext";
import { useBlur } from "../contexts/BlurContext";
import { useLanguage } from "../contexts/LanguageContext";
import { CustomPrompt, CustomConfirm } from "../components/CustomPrompt";
import { translations } from "../config/translations";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const SERVER_ID = 'make-server-a1c86d03';

export default function CustomLanguageEditor() {
  const navigate = useNavigate();
  const { languagename } = useParams<{ languagename?: string }>();
  const { theme } = useTheme();
  const { blurStrength } = useBlur();
  const { t, loadCustomLanguages } = useLanguage();

  const [languageName, setLanguageName] = useState(languagename || "");
  const [languageKey, setLanguageKey] = useState(languagename || "");
  const [displayName, setDisplayName] = useState("");
  const [baseLanguage, setBaseLanguage] = useState<'en' | 'ru'>('en');
  const [customTranslations, setCustomTranslations] = useState<Record<string, string>>({});
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ key: string; displayName: string }>>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState<string | null>(null);

  // Custom prompt states
  const [showCreatePrompt, setShowCreatePrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get all translation keys from base language (excluding admin ones)
  const allKeys = Object.keys(translations.en).filter(key => {
    // Filter out admin-specific keys
    return !key.startsWith('admin.');
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      navigate("/");
      return;
    }
    setUserId(storedUserId);
    loadAvailableLanguages();

    if (languagename) {
      setLanguageName(languagename);
      setLanguageKey(languagename);
      loadLanguage(languagename);
    } else {
      // Reset state when going back to list
      setLanguageName("");
      setLanguageKey("");
      setDisplayName("");
      setCustomTranslations({});
      setBaseLanguage('en');
      setCreatedBy(null);
    }
  }, [languagename, navigate]);

  const loadAvailableLanguages = async () => {
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
        console.log('Available languages response:', data);
        const langs = (data.values || [])
          .filter((v: any) => v && v.key)
          .map((v: any) => ({
            key: v.key.replace('custom-lang-', ''),
            displayName: v.value?.displayName || v.value?.name || v.key.replace('custom-lang-', '')
          }));
        setAvailableLanguages(langs);
      }
    } catch (error) {
      console.error("Failed to load available languages:", error);
    }
  };

  const loadLanguage = async (name: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/custom-lang-${name}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setCustomTranslations(data.value.translations || {});
          setBaseLanguage(data.value.baseLanguage || 'en');
          setDisplayName(data.value.displayName || data.value.name || name);
          setCreatedBy(data.value.createdBy || null);
        }
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  };

  const handleSave = async () => {
    if (!languageKey.trim()) {
      toast.error("Please enter a language key");
      return;
    }

    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    // Check if editing existing language and user is not the owner
    if (languagename && createdBy && createdBy !== userId) {
      toast.error("You don't have permission to edit this language");
      return;
    }

    // Sanitize language key (only alphanumeric and hyphens)
    const sanitizedKey = languageKey.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    try {
      // If the key changed, delete the old one first
      if (languagename && languagename !== sanitizedKey) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/custom-lang-${languagename}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
      }

      // Save with the new/current key
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/custom-lang-${sanitizedKey}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: {
              name: sanitizedKey,
              displayName: displayName,
              baseLanguage,
              translations: customTranslations,
              createdBy: createdBy || userId,
              updatedAt: new Date().toISOString(),
            }
          }),
        }
      );

      if (response.ok) {
        toast.success("Language saved successfully!");
        // Reload both local and context language lists
        await loadAvailableLanguages();
        await loadCustomLanguages();
        // Always navigate if the key changed
        if (!languagename || languagename !== sanitizedKey) {
          navigate(`/lang/${sanitizedKey}`, { replace: true });
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to save language:", errorText);
        toast.error("Failed to save language: " + errorText);
      }
    } catch (error) {
      console.error("Failed to save language:", error);
      toast.error("Failed to save language: " + String(error));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!languagename) return;

    // Check if user owns this language
    if (createdBy && createdBy !== userId) {
      toast.error("You don't have permission to delete this language");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/custom-lang-${languagename}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Language deleted successfully!");
        await loadAvailableLanguages();
        await loadCustomLanguages();
        navigate('/lang');
      } else {
        toast.error("Failed to delete language");
      }
    } catch (error) {
      console.error("Failed to delete language:", error);
      toast.error("Failed to delete language");
    }
  };

  const handleTranslationChange = (key: string, value: string) => {
    setCustomTranslations(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getBlurClasses = (lightBg: string, darkBg: string) => {
    if (blurStrength === 0) {
      return `${lightBg} ${darkBg}`;
    }
    return `${lightBg}/60 ${darkBg}/60 backdrop-blur-[${blurStrength}px]`;
  };

  // Show list of available languages if no language is selected
  if (!languagename && languageName === "") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className={`p-4 ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} border-b border-gray-200 dark:border-gray-800 flex items-center gap-3`}
          style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate('/chat', { replace: false });
            }}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold dark:text-white">{t('lang.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('lang.subtitle')}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Button
            onClick={() => setShowCreatePrompt(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            type="button"
          >
            <Globe className="size-4 mr-2" />
            {t('lang.createNew')}
          </Button>

          <CustomPrompt
            open={showCreatePrompt}
            onClose={() => setShowCreatePrompt(false)}
            onConfirm={(name) => {
              if (name && name.trim()) {
                // Sanitize the name for URL
                const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
                navigate(`/lang/${sanitized}`);
              }
            }}
            title={t('lang.createNew')}
            description="Enter a short key/identifier (e.g., 'spanish', 'french')"
            placeholder="e.g., spanish, french, german"
          />

          <div className="space-y-2">
            <h2 className="text-lg font-semibold dark:text-white">{t('lang.available')}</h2>
            {availableLanguages.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('lang.noLanguages')}</p>
            ) : (
              availableLanguages.map(lang => (
                <button
                  key={lang.key}
                  onClick={() => navigate(`/lang/${lang.key}`)}
                  className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="size-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="font-medium dark:text-white">{lang.displayName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">/{lang.key}</div>
                      </div>
                    </div>
                    <ArrowLeft className="size-4 text-gray-400 rotate-180" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className={`p-4 ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} border-b border-gray-200 dark:border-gray-800 flex items-center gap-3`}
        style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Back button clicked, navigating to /lang');
            navigate('/lang', { replace: false });
          }}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold dark:text-white">{t('lang.editLang')}: {languagename || languageName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('lang.subtitle')}</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="size-4 mr-2" />
          {t('common.save')}
        </Button>
        {languagename && (
          <>
            <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive">
              <Trash2 className="size-4 mr-2" />
              {t('common.delete')}
            </Button>
            <CustomConfirm
              open={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={handleDeleteConfirm}
              title={t('common.delete') + " " + languagename + "?"}
              description="This will permanently delete this custom language."
              confirmText={t('common.delete')}
              cancelText={t('common.cancel')}
              variant="destructive"
            />
          </>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div>
            <Label htmlFor="langKey" className="dark:text-white">Language Key (URL)</Label>
            <Input
              id="langKey"
              value={languageKey}
              onChange={(e) => setLanguageKey(e.target.value)}
              placeholder="e.g., spanish, french, german"
              disabled={false}
              className="dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Used in the URL (/#/lang/key). Only letters, numbers, and hyphens allowed.
              {languageKey && languageKey !== languageKey.toLowerCase().replace(/[^a-z0-9-]/g, '-') && (
                <span className="block text-yellow-600 dark:text-yellow-400 mt-1">
                  Will be saved as: {languageKey.toLowerCase().replace(/[^a-z0-9-]/g, '-')}
                </span>
              )}
              {languagename && languageKey !== languagename && (
                <span className="block text-orange-600 dark:text-orange-400 mt-1 font-semibold">
                  ⚠️ Changing the key will create a new language and delete the old one!
                </span>
              )}
            </p>
          </div>

          <div>
            <Label htmlFor="displayName" className="dark:text-white">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('lang.languageNamePlaceholder')}
              className="dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The name shown to users (can be in any language, including русский)
            </p>
          </div>

          <div>
            <Label htmlFor="baseLang" className="dark:text-white">{t('lang.baseLanguage')}</Label>
            <select
              id="baseLang"
              value={baseLanguage}
              onChange={(e) => setBaseLanguage(e.target.value as 'en' | 'ru')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            >
              <option value="en">English</option>
              <option value="ru">Russian</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">{t('lang.translations')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('lang.leaveEmpty')} {baseLanguage === 'en' ? 'English' : 'Russian'} {t('lang.fallback')}
            </p>
          </div>
          <ScrollArea className="h-[calc(100vh-350px)]">
            <div className="p-4 space-y-4">
              {allKeys.map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {key}
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {translations[baseLanguage][key]}
                    </span>
                  </div>
                  <Input
                    id={key}
                    value={customTranslations[key] || ''}
                    onChange={(e) => handleTranslationChange(key, e.target.value)}
                    placeholder={translations[baseLanguage][key]}
                    className="dark:bg-gray-700 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
