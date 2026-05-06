import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { pb } from "../../lib/pocketbase";
import { compressImage, getLimits, getSubscriptionTier } from "../../lib/imageCompression";
import { X, Plus, Download, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

const SERVER_ID = 'make-server-a1c86d03';

interface Sticker {
  id: string;
  imageUrl: string;
  sourceUrl?: string;
  cropData?: {
    x: number;
    y: number;
    size: number;
  };
}

interface StickerPack {
  name: string;
  stickers: Sticker[];
  createdBy: string;
  createdAt: string;
}

export default function StickerPack() {
  const navigate = useNavigate();
  const { packName } = useParams<{ packName: string }>();
  const { t } = useLanguage();
  const [pack, setPack] = useState<StickerPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [cropping, setCropping] = useState(false);
  const [cropImage, setCropImage] = useState('');
  const [cropArea, setCropArea] = useState({ x: 100, y: 100, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, size: 0 });
  const [editingName, setEditingName] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userSubscription, setUserSubscription] = useState<{ tier: 'boost' | 'ultra' | null; expiresAt?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setCurrentUserId(userId);
      loadUserSubscription(userId);
    }
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
        } else {
          // Pack doesn't exist yet, create empty one
          const userId = localStorage.getItem('userId') || 'anonymous';
          setPack({
            name: packName,
            stickers: [],
            createdBy: userId,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Failed to load sticker pack:", error);
      toast.error("Failed to load sticker pack");
    } finally {
      setLoading(false);
    }
  };

  const savePack = async (updatedPack: StickerPack) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/sticker-pack-${packName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: updatedPack })
        }
      );

      if (response.ok) {
        setPack(updatedPack);
        toast.success(t('sticker.packUpdated'));
      } else {
        const errorText = await response.text();
        console.error("Failed to save sticker pack:", response.status, errorText);
        toast.error("Failed to save sticker pack");
      }
    } catch (error) {
      console.error("Failed to save sticker pack:", error);
      toast.error("Failed to save sticker pack");
    }
  };

  const loadUserSubscription = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'X-User-Id': userId,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data.user?.subscription || null);
      }
    } catch (error) {
      console.error("Failed to load user subscription:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Get subscription tier
      const subscriptionTier = getSubscriptionTier(userSubscription || undefined);
      const limits = getLimits(subscriptionTier, 'stickers');

      // Validate file size
      if (file.size > limits.maxUploadSize * 1024 * 1024) {
        toast.error(`Image must be smaller than ${limits.maxUploadSize}MB (${subscriptionTier} tier)`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      toast.info("Compressing sticker...");

      // Compress image
      const compressedBlob = await compressImage(file, limits.maxCompressedSize, 'stickers');

      // Create a temporary URL for cropping
      const tempUrl = URL.createObjectURL(compressedBlob);

      // Store compressed blob for later upload
      (window as any).__tempStickerBlob = compressedBlob;
      (window as any).__tempStickerFilename = file.name;

      setCropImage(tempUrl);
      setCropping(true);

      const originalSizeKB = (file.size / 1024).toFixed(1);
      const compressedSizeKB = (compressedBlob.size / 1024).toFixed(1);
      toast.success(`Compressed! ${originalSizeKB}KB → ${compressedSizeKB}KB`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to process image");
    }

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move') => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizing(corner);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      size: cropArea.size
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, 500 - prev.size)),
        y: Math.max(0, Math.min(newY, 500 - prev.size))
      }));
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newSize = resizeStart.size;
      let newX = cropArea.x;
      let newY = cropArea.y;

      // Handle different resize directions
      if (isResizing === 'se') {
        // Southeast (bottom-right) - expand from top-left
        const delta = Math.max(deltaX, deltaY);
        newSize = Math.max(50, Math.min(resizeStart.size + delta, 500 - Math.max(cropArea.x, cropArea.y)));
      } else if (isResizing === 'nw') {
        // Northwest (top-left) - expand from bottom-right
        const delta = Math.max(-deltaX, -deltaY);
        const proposedSize = Math.max(50, resizeStart.size + delta);
        newX = Math.max(0, cropArea.x + cropArea.size - proposedSize);
        newY = Math.max(0, cropArea.y + cropArea.size - proposedSize);
        newSize = proposedSize;
      } else if (isResizing === 'ne') {
        // Northeast (top-right) - expand width right, height up
        const delta = Math.max(deltaX, -deltaY);
        const proposedSize = Math.max(50, resizeStart.size + delta);
        newY = Math.max(0, cropArea.y + cropArea.size - proposedSize);
        newSize = Math.min(proposedSize, 500 - cropArea.x);
      } else if (isResizing === 'sw') {
        // Southwest (bottom-left) - expand width left, height down
        const delta = Math.max(-deltaX, deltaY);
        const proposedSize = Math.max(50, resizeStart.size + delta);
        newX = Math.max(0, cropArea.x + cropArea.size - proposedSize);
        newSize = proposedSize;
      } else if (isResizing === 'e') {
        // East (right edge)
        newSize = Math.max(50, Math.min(resizeStart.size + deltaX, 500 - cropArea.x));
      } else if (isResizing === 'w') {
        // West (left edge)
        const proposedSize = Math.max(50, resizeStart.size - deltaX);
        newX = Math.max(0, cropArea.x + cropArea.size - proposedSize);
        newSize = proposedSize;
      } else if (isResizing === 's') {
        // South (bottom edge)
        newSize = Math.max(50, Math.min(resizeStart.size + deltaY, 500 - cropArea.y));
      } else if (isResizing === 'n') {
        // North (top edge)
        const proposedSize = Math.max(50, resizeStart.size - deltaY);
        newY = Math.max(0, cropArea.y + cropArea.size - proposedSize);
        newSize = proposedSize;
      }

      setCropArea({ x: newX, y: newY, size: newSize });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  const finishCrop = async () => {
    if (!pack || !packName) return;

    try {
      toast.info("Uploading sticker...");

      // Get the compressed blob from temporary storage
      const compressedBlob = (window as any).__tempStickerBlob;
      const filename = (window as any).__tempStickerFilename || 'sticker.jpg';

      if (!compressedBlob) {
        toast.error("No image data found");
        return;
      }

      // Create FormData for PocketBase upload
      const formData = new FormData();
      const file = new File([compressedBlob], filename, { type: 'image/jpeg' });
      formData.append('image', file);
      formData.append('name', `${packName}-${Date.now()}`);
      formData.append('pack', packName);
      formData.append('createdBy', currentUserId);

      // Upload to PocketBase stickers collection
      const record = await pb.collection('stickers').create(formData);

      // Get the uploaded image URL
      const imageUrl = pb.files.getUrl(record, record.image);

      // Save sticker with crop metadata
      const newSticker: Sticker = {
        id: record.id,
        imageUrl: imageUrl,
        sourceUrl: imageUrl,
        cropData: {
          x: cropArea.x,
          y: cropArea.y,
          size: cropArea.size
        }
      };

      const updatedPack = {
        ...pack,
        stickers: [...pack.stickers, newSticker]
      };

      await savePack(updatedPack);

      // Clean up temporary storage
      URL.revokeObjectURL(cropImage);
      delete (window as any).__tempStickerBlob;
      delete (window as any).__tempStickerFilename;

      setCropping(false);
      setImageUrl('');
      setCropImage('');
      toast.success(t('sticker.stickerAdded'));
    } catch (error) {
      console.error("Failed to upload sticker:", error);
      toast.error("Failed to upload sticker");
    }
  };

  const deleteSticker = async (stickerId: string) => {
    if (!pack) return;

    const updatedPack = {
      ...pack,
      stickers: pack.stickers.filter(s => s.id !== stickerId)
    };

    await savePack(updatedPack);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/#/stickers/${packName}`;
    navigator.clipboard.writeText(link);
    toast.success(t('sticker.linkCopied'));
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const deletePack = async () => {
    if (!packName) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/sticker-pack-${packName}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success(t('sticker.packDeleted'));
        navigate('/chat');
      } else {
        toast.error('Failed to delete sticker pack');
      }
    } catch (error) {
      console.error('Failed to delete sticker pack:', error);
      toast.error('Failed to delete sticker pack');
    }
  };

  const isOwner = pack && currentUserId && pack.createdBy === currentUserId;

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

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold dark:text-white">{t('sticker.notOwner')}</h1>
          <button
            onClick={() => navigate(`/stickers/${packName}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('sticker.viewPack')}
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
            {editingName ? (
              <div className="flex-1 flex gap-2 items-center">
                <input
                  type="text"
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="new-pack-name"
                />
                <button
                  onClick={() => {
                    const sanitized = newPackName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                    if (!sanitized) {
                      toast.error(t('sticker.enterPackName'));
                      return;
                    }
                    navigate(`/stickers/${sanitized}/manage`);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t('common.save')}
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNewPackName('');
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold dark:text-white">{pack.name}</h1>
                <button
                  onClick={() => {
                    setEditingName(true);
                    setNewPackName(packName || '');
                  }}
                  className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t('sticker.rename')}
                </button>
              </div>
            )}
            <button
              onClick={() => navigate('/chat')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="size-6 dark:text-white" />
            </button>
          </div>

          <div className="mb-6 flex gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="size-4" />
              {t('sticker.copyLink')}
            </button>
            {confirmingDelete ? (
              <>
                <button
                  onClick={deletePack}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t('sticker.confirmDelete')}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400"
                >
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="size-4" />
                {t('sticker.deletePack')}
              </button>
            )}
          </div>

          {/* Add Sticker Section */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-xl font-bold dark:text-white mb-4">{t('sticker.addSticker')}</h2>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  <Upload className="size-5" />
                  Upload Sticker Image
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {userSubscription?.tier === 'ultra' ? (
                  <>Max 15MB upload, compressed to ~100KB</>
                ) : userSubscription?.tier === 'boost' ? (
                  <>Max 10MB upload, compressed to ~75KB</>
                ) : (
                  <>Max 5MB upload, compressed to ~50KB</>
                )}
              </div>
            </div>
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {pack.stickers.map((sticker) => (
              <div key={sticker.id} className="relative group">
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={sticker.imageUrl}
                    alt="Sticker"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => deleteSticker(sticker.id)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {pack.stickers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {t('sticker.noStickers')}
            </div>
          )}
        </div>
      </div>

      {/* Cropping Modal */}
      {cropping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold dark:text-white mb-4">{t('sticker.cropSticker')}</h2>
            <div
              className="relative w-full max-w-[500px] h-[500px] mx-auto bg-gray-100 dark:bg-gray-700 overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={cropImage}
                alt="Crop preview"
                className="w-full h-full object-contain"
                draggable={false}
              />
              <div
                className="absolute border-2 border-blue-600 cursor-move"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.size,
                  height: cropArea.size,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Corner resize handles */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 border border-white cursor-nw-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 border border-white cursor-ne-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-600 border border-white cursor-sw-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 border border-white cursor-se-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                />

                {/* Edge resize handles */}
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 border border-white cursor-n-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                />
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 border border-white cursor-s-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                />
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 border border-white cursor-w-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                />
                <div
                  className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 border border-white cursor-e-resize"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
              {t('sticker.dragToMove')}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setCropping(false);
                  setCropImage('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={finishCrop}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('sticker.addSticker')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
