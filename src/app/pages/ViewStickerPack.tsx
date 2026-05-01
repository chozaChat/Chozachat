import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from 'motion/react';
import { useLanguage } from "../contexts/LanguageContext";

const SERVER_ID = 'make-server-a1c86d03';

interface Sticker {
  id: string;
  imageUrl: string;
}

interface StickerPack {
  name: string;
  stickers: Sticker[];
  createdBy: string;
  createdAt: string;
}

export default function ViewStickerPack() {
  const navigate = useNavigate();
  const { packName } = useParams<{ packName: string }>();
  const { t } = useLanguage();
  const [pack, setPack] = useState<StickerPack | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPack();
  }, [packName]);

  const loadPack = async () => {
    if (!packName) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/sticker-pack-${packName}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setPack(data.value);
        }
      }
    } catch (error) {
      console.error("Failed to load sticker pack:", error);
      toast.error("Failed to load sticker pack");
    } finally {
      setLoading(false);
    }
  };

  const addPackToSaved = () => {
    if (!packName) return;

    // Get saved packs from localStorage
    const saved = localStorage.getItem('savedStickerPacks');
    const savedPacks: string[] = saved ? JSON.parse(saved) : [];

    if (savedPacks.includes(packName)) {
      toast.info(t('sticker.alreadyAdded'));
      return;
    }

    savedPacks.push(packName);
    localStorage.setItem('savedStickerPacks', JSON.stringify(savedPacks));
    toast.success(t('sticker.packAdded'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold dark:text-white">{t('sticker.loading')}</h1>
        </div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold dark:text-white">{t('sticker.notFound')}</h1>
          <button
            onClick={() => navigate('/chat')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('sticker.backToChat')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold dark:text-white">{pack.name}</h1>
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="size-6 dark:text-white" />
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            <button
              onClick={addPackToSaved}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="size-4" />
              {t('sticker.addToPacks')}
            </button>
            <button
              onClick={() => navigate(`/stickers/${packName}/manage`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('sticker.manage')}
            </button>
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {pack.stickers.map((sticker) => (
              <motion.div
                key={sticker.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
              >
                <img
                  src={sticker.imageUrl}
                  alt="Sticker"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>

          {pack.stickers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('sticker.noStickers')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
