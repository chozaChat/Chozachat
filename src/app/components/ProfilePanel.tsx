import { useState, useEffect } from "react";
import { X, UserPlus, UserMinus, Edit2, Trash2, LogOut, Shield, Users as UsersIcon, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import EmojiPicker from "emoji-picker-react";
import { useBlur } from "../contexts/BlurContext";
import { useLanguage } from "../contexts/LanguageContext";

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
  isModerator?: boolean;
}

interface ProfilePanelProps {
  type: 'user' | 'group' | 'channel';
  data: any;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
  onRemoveFriend?: (friendId: string) => void;
  friends?: any[];
  allUsers?: any[];
}

export function ProfilePanel({ type, data, currentUserId, onClose, onUpdate, onRemoveFriend, friends, allUsers }: ProfilePanelProps) {
  const { blurStrength } = useBlur();
  const { t } = useLanguage();
  const [members, setMembers] = useState<User[]>([]);
  const [allFriends, setAllFriends] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data?.name || "");
  const [editEmoji, setEditEmoji] = useState(data?.emoji || "");
  const [editUsername, setEditUsername] = useState(data?.username || "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>([]);
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState<string | null>(null);

  const isCreator = data?.createdBy === currentUserId || data?.creatorId === currentUserId;
  const isMember = data?.members?.includes(currentUserId);

  useEffect(() => {
    if (type === 'group' || type === 'channel') {
      loadMembers();
      loadFriends();
    }
  }, [type, data]);

  const loadMembers = async () => {
    if (!data?.members) return;

    console.log('🔍 Loading members for', type, 'with member IDs:', data.members);

    try {
      const memberPromises = data.members.map(async (memberId: string) => {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/users/${memberId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "X-User-Id": currentUserId,
            },
          }
        );
        if (response.ok) {
          const userData = await response.json();
          return userData.user;
        }
        return null;
      });

      const memberData = await Promise.all(memberPromises);
      const filteredMembers = memberData.filter(Boolean);
      console.log('✅ Loaded members:', filteredMembers);
      setMembers(filteredMembers);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/friends`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": currentUserId,
          },
        }
      );

      if (response.ok) {
        const friendsData = await response.json();
        setAllFriends(friendsData.friends || []);
      }
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const endpoint = type === 'channel' 
        ? `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${data.id}`
        : `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${data.id}`;

      const body = type === 'channel'
        ? { name: editName, emoji: editEmoji, username: editUsername }
        : { name: editName, emoji: editEmoji };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Id": currentUserId,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to update ${type}`);
        return;
      }

      toast.success(`${type === 'channel' ? t('common.channel') : t('common.group')} ${t('profile.updated')}`);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Failed to update ${type}`);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembersToAdd.length === 0) {
      toast.error("Please select at least one friend to add");
      return;
    }

    try {
      for (const memberId of selectedMembersToAdd) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${data.id}/members`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
              "X-User-Id": currentUserId,
            },
            body: JSON.stringify({ memberId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to add member");
          return;
        }
      }

      toast.success(t('profile.membersAdded'));
      setSelectedMembersToAdd([]);
      setShowAddMembersDialog(false);
      loadMembers();
      onUpdate();
    } catch (error) {
      console.error("Add members error:", error);
      toast.error("Failed to add members");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${data.id}/members/${memberId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
            "X-User-Id": currentUserId,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to remove member");
        return;
      }

      toast.success(t('profile.memberRemoved'));
      setShowRemoveMemberConfirm(null);
      loadMembers();
      onUpdate();
    } catch (error) {
      console.error("Remove member error:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleLeave = async () => {
    if (!confirm(`Are you sure you want to leave this ${type}?`)) {
      return;
    }

    try {
      const endpoint = type === 'channel'
        ? `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${data.id}/leave`
        : `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${data.id}/leave`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Id": currentUserId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to leave ${type}`);
        return;
      }

      toast.success(`Left ${type}`);
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Leave error:", error);
      toast.error(`Failed to leave ${type}`);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      return;
    }

    try {
      const endpoint = type === 'channel'
        ? `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${data.id}`
        : `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/groups/${data.id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "X-User-Id": currentUserId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to delete ${type}`);
        return;
      }

      toast.success(`${type === 'channel' ? t('common.channel') : t('common.group')} ${t('profile.deleted')}`);
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleUnfriend = async () => {
    if (!confirm(`Are you sure you want to unfriend ${data.name}?`)) {
      return;
    }

    if (onRemoveFriend) {
      onRemoveFriend(data.id);
      onClose();
    }
  };

  const handleCopyLink = () => {
    let link = '';
    if (type === 'user') {
      const usernameWithoutAt = data?.username?.replace('@', '') || '';
      link = `${window.location.origin}/#/u/${usernameWithoutAt}`;
    } else if (type === 'group') {
      link = `${window.location.origin}/#/g/${data?.id}`;
    } else if (type === 'channel') {
      const usernameWithoutAt = data?.username?.replace('@', '') || '';
      link = `${window.location.origin}/#/c/${usernameWithoutAt}`;
    }
    navigator.clipboard.writeText(link);
    toast.success(`${type === 'user' ? t('profile.title') : type === 'channel' ? t('common.channel') : t('common.group')} ${t('profile.linkCopied')}`);
  };

  const availableFriendsToAdd = allFriends.filter(
    friend => !data?.members?.includes(friend.id)
  );

  return (
    <div 
      className={`fixed inset-0 md:relative md:inset-auto md:w-80 border-l border-gray-200 dark:border-gray-800 ${blurStrength > 0 ? 'bg-white/60 dark:bg-gray-900/60' : 'bg-white dark:bg-gray-900'} flex flex-col z-50 md:z-auto`}
      style={blurStrength > 0 ? { backdropFilter: `blur(${blurStrength}px)` } : {}}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {type === 'user' ? t('profile.title') : type === 'channel' ? t('profile.channelInfo') : t('profile.groupInfo')}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="size-24 mb-3">
              <AvatarFallback className="bg-blue-600 text-white text-3xl">
                {data?.emoji || data?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            {isEditing ? (
              <div className="w-full space-y-3">
                <div>
                  <Label className="text-gray-900 dark:text-white">Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                </div>

                {type === 'channel' && (
                  <div>
                    <Label className="text-gray-900 dark:text-white">Username</Label>
                    <Input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="@username"
                      className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-gray-900 dark:text-white">Emoji</Label>
                  <div className="relative mt-1">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-2xl"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      {editEmoji || "Choose emoji"}
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute z-50 mt-2">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setEditEmoji(emojiData.emoji);
                            setShowEmojiPicker(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex-1">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(data?.name || "");
                      setEditEmoji(data?.emoji || "");
                      setEditUsername(data?.username || "");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {data?.name}
                  {data?.verified && (
                    <Shield className="size-5 text-blue-500" />
                  )}
                  {data?.moderator && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500 text-white">
                      MOD
                    </span>
                  )}
                </h3>
                {type === 'user' && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{data?.username}</p>
                )}
                {type === 'channel' && data?.username && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{data?.username}</p>
                )}
                {type !== 'user' && data?.members && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {data.members.length} {data.members.length === 1 ? t('profile.memberSingular') : t('profile.memberPlural')}
                  </p>
                )}
              </>
            )}
          </div>

          {/* User-specific info */}
          {type === 'user' && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <p className="text-gray-900 dark:text-white">{data?.email}</p>
              </div>
              {data?.tag && (
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tag:</span>
                  <span
                    className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      backgroundColor: data?.tagColor || "#3b82f6",
                      color: "#ffffff",
                    }}
                  >
                    {data?.tag}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Members list for groups/channels */}
          {(type === 'group' || type === 'channel') && data?.members && (
            <div className="border-t pt-4 dark:border-gray-700">
              <Label className="text-base font-semibold mb-3 block text-gray-900 dark:text-white">
                {type === 'channel' ? t('profile.channelMembers') : t('profile.groupMembers')} ({data.members.length})
              </Label>
              {type === 'channel' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {t('profile.channelAdminsOnly')}
                </p>
              )}
              <ScrollArea className="h-48 border rounded-lg p-2 dark:border-gray-700">
                <div className="space-y-2">
                  {data.members.map((memberId: string) => {
                    const member = friends && allUsers ? [...friends, ...allUsers].find((u: any) => u.id === memberId) : null;
                    const isAdmin = type === 'channel' && data?.admins?.includes(memberId);
                    const isChannelCreator = data?.creatorId === memberId;
                    
                    return (
                      <div key={memberId} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <Avatar className="flex-shrink-0 size-8">
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-sm">
                            {member?.emoji ? (
                              <span className="text-lg">{member.emoji}</span>
                            ) : (
                              member?.name?.charAt(0)?.toUpperCase() || '?'
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium dark:text-white truncate text-gray-900">
                            {member?.name || 'Unknown User'}
                            {member?.verified && <Shield className="inline size-3 ml-1 text-blue-500" />}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {isChannelCreator ? t('profile.creator') : isAdmin ? t('profile.admin') : t('profile.member')}
                          </div>
                        </div>
                        {/* Admin management buttons for channel creators */}
                        {type === 'channel' && isCreator && !isChannelCreator && (
                          <Button
                            type="button"
                            size="sm"
                            variant={isAdmin ? "destructive" : "default"}
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/channels/${data.id}/admins`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${publicAnonKey}`,
                                      'X-User-Id': currentUserId,
                                    },
                                    body: JSON.stringify({ 
                                      memberId, 
                                      action: isAdmin ? 'remove' : 'add' 
                                    }),
                                  }
                                );

                                const responseData = await response.json();
                                if (!response.ok) {
                                  toast.error(responseData.error || "Failed to update admin");
                                  return;
                                }

                                toast.success(isAdmin ? "Admin removed" : "Admin added");
                                onUpdate();
                              } catch (error) {
                                console.error("Update admin error:", error);
                                toast.error("Failed to update admin");
                              }
                            }}
                          >
                            {isAdmin ? 'Remove Admin' : 'Set as Admin'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            {/* Copy Profile/Channel/Group Link - Show for all types */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCopyLink}
            >
              <Copy className="size-4 mr-2" />
              {type === 'user' ? t('profile.copyProfileLink') : type === 'channel' ? t('profile.copyChannelLink') : t('profile.copyGroupLink')}
            </Button>

            {type === 'user' && onRemoveFriend && (
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                onClick={handleUnfriend}
              >
                <UserMinus className="size-4 mr-2" />
                {t('profile.unfriend')}
              </Button>
            )}

            {(type === 'group' || type === 'channel') && (
              <>
                {isCreator && !isEditing && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="size-4 mr-2" />
                    {type === 'channel' ? t('profile.editChannel') : t('profile.editGroup')}
                  </Button>
                )}

                {isMember && !isCreator && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                    onClick={handleLeave}
                  >
                    <LogOut className="size-4 mr-2" />
                    {type === 'channel' ? t('profile.leaveChannel') : t('profile.leaveGroup')}
                  </Button>
                )}

                {isCreator && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                    onClick={handleDelete}
                  >
                    <Trash2 className="size-4 mr-2" />
                    {type === 'channel' ? t('profile.deleteChannel') : t('profile.deleteGroup')}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Add Members Dialog */}
      <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{t('profile.addMembers')}</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t('profile.selectFriends')} {type === 'channel' ? t('common.channel').toLowerCase() : t('common.group').toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {availableFriendsToAdd.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No friends available to add</p>
              ) : (
                availableFriendsToAdd.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      setSelectedMembersToAdd((prev) =>
                        prev.includes(friend.id)
                          ? prev.filter((id) => id !== friend.id)
                          : [...prev, friend.id]
                      );
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembersToAdd.includes(friend.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {friend?.emoji || friend?.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{friend.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">@{friend.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMembersDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddMembers} disabled={selectedMembersToAdd.length === 0}>
              {t('common.add')} {selectedMembersToAdd.length > 0 ? `(${selectedMembersToAdd.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={!!showRemoveMemberConfirm} onOpenChange={(open) => !open && setShowRemoveMemberConfirm(null)}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{t('profile.removeMember')}</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {t('profile.removeMemberConfirm')} {type === 'channel' ? t('common.channel').toLowerCase() : t('common.group').toLowerCase()}?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveMemberConfirm(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => showRemoveMemberConfirm && handleRemoveMember(showRemoveMemberConfirm)}
            >
              {t('common.remove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}