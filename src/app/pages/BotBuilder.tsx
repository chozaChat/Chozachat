import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { ArrowLeft, Save, Play, Plus, Trash2, Code, Blocks, BookOpen, Search, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Bot, BotMode, BotTrigger } from '../types/bot';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { BotBlockBuilder } from '../components/BotBlockBuilder';

const SERVER_ID = 'make-server-a1c86d03';

export default function BotBuilder() {
  const navigate = useNavigate();
  const { botid } = useParams<{ botid?: string }>();
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const [bots, setBots] = useState<Bot[]>([]);
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<BotMode>('code');
  const [code, setCode] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [triggers, setTriggers] = useState<BotTrigger[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      navigate('/');
      return;
    }
    setUserId(storedUserId);
    loadBots();
  }, [navigate]);

  useEffect(() => {
    if (botid && bots.length > 0) {
      const bot = bots.find(b => b.id === botid);
      if (bot) {
        setCurrentBot(bot);
        setName(bot.name);
        setUsername(bot.username || '');
        setDescription(bot.description);
        setMode(bot.mode);
        setCode(bot.code || getDefaultCode());
        setEnabled(bot.enabled);
        setTriggers(bot.triggers || []);
      }
    } else if (!botid) {
      resetForm();
    }
  }, [botid, bots]);

  const loadBots = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/prefix/bot-`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const loadedBots = (data.values || [])
          .filter((v: any) => v && v.key)
          .map((v: any) => ({
            ...v.value,
            id: v.key.replace('bot-', ''),
          }));
        setBots(loadedBots);
      }
    } catch (error) {
      console.error('Failed to load bots:', error);
    }
  };

  const resetForm = () => {
    setCurrentBot(null);
    setName('');
    setUsername('');
    setDescription('');
    setMode('code');
    setCode(getDefaultCode());
    setEnabled(true);
    setTriggers([]);
  };

  const getDefaultCode = () => {
    return `// Bot API Example
if (api.matches('/start')) {
  api.send('Hello! I am a bot. Try these commands:', [
    { id: '1', text: 'Help', action: 'command', value: '/help' },
    { id: '2', text: 'Random Card', action: 'command', value: '/card' }
  ]);
}

if (api.matches('/help')) {
  api.reply('Available commands:\\n/start - Start the bot\\n/card - Get a random card');
}

if (api.matches('/card') || api.contains('daily card')) {
  const cards = ['🎴 Ace of Spades', '🎴 King of Hearts', '🎴 Queen of Diamonds', '🎴 Jack of Clubs'];
  const card = api.choose(cards);
  const chance = api.random(1, 100);

  if (chance > 80) {
    api.reply(\`✨ Lucky! You got a rare card: \${card}\`);
  } else {
    api.reply(\`You got: \${card}\`);
  }
}

if (api.contains('hello') || api.contains('hi')) {
  api.send(\`Hello, \${api.context.message.senderName}!\`);
}
`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a bot name');
      return;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (!userId) return;

    const botId = currentBot?.id || `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const botData: Bot = {
      id: botId,
      name,
      username: username.trim() || undefined,
      description,
      mode,
      code: mode === 'code' ? code : undefined,
      triggers: mode === 'blocks' ? triggers : undefined,
      enabled,
      createdBy: currentBot?.createdBy || userId,
      createdAt: currentBot?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/bot-${botId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: botData }),
        }
      );

      if (response.ok) {
        toast.success('Bot saved successfully!');
        await loadBots();
        if (!botid) {
          navigate(`/bots/${botId}`);
        }
      } else {
        toast.error('Failed to save bot');
      }
    } catch (error) {
      console.error('Failed to save bot:', error);
      toast.error('Failed to save bot');
    }
  };

  const handleDelete = async () => {
    if (!currentBot) return;

    if (!confirm(`Delete bot "${currentBot.name}"?`)) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/kv/bot-${currentBot.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        toast.success('Bot deleted successfully!');
        await loadBots();
        navigate('/bots');
      } else {
        toast.error('Failed to delete bot');
      }
    } catch (error) {
      console.error('Failed to delete bot:', error);
      toast.error('Failed to delete bot');
    }
  };

  // List view
  if (!botid) {
    const filteredBots = bots.filter(bot =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bot.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold dark:text-white">Bot Builder</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage your bots</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-4">
          <Button
            onClick={() => navigate('/bots/new')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="size-4 mr-2" />
            Create New Bot
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search bots by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold dark:text-white">Your Bots</h2>
            {bots.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No bots yet. Create your first bot!</p>
            ) : filteredBots.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No bots match your search.</p>
            ) : (
              filteredBots.map(bot => (
                <button
                  key={bot.id}
                  onClick={() => navigate(`/bots/${bot.id}`)}
                  className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {bot.mode === 'code' ? (
                        <Code className="size-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Blocks className="size-5 text-purple-600 dark:text-purple-400" />
                      )}
                      <div>
                        <div className="font-medium dark:text-white flex items-center gap-2">
                          {bot.name}
                          {bot.username && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">@{bot.username}</span>
                          )}
                          {!bot.enabled && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Disabled</span>
                          )}
                          {bot.createdBy === userId && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">Your Bot</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{bot.description || 'No description'}</div>
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

  // Editor view
  const isCreator = !currentBot || currentBot.createdBy === userId;

  if (currentBot && !isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You can only edit bots that you created.</p>
          <Button onClick={() => navigate('/bots')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="size-4 mr-2" />
            Back to Bots
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#4C97FF] dark:bg-gray-900">
      {/* Scratch-like Header */}
      <div className="h-14 bg-[#4C97FF] dark:bg-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/bots')} className="text-white hover:bg-white/20">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold text-white flex-1">{name || 'Untitled Bot'}</h1>

        {/* Documentation Button */}
        <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <BookOpen className="size-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{mode === 'code' ? 'API Documentation' : 'Blocks Documentation'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {mode === 'blocks' ? (
                  <>
                    <div>
                      <h3 className="font-bold text-lg mb-2">🎮 Scratch-Style Bot Builder</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Build bots visually just like Scratch! No coding needed.
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                      <strong>⚡ WHEN</strong> - Choose what triggers your bot
                      <ul className="ml-4 mt-2 space-y-1 text-sm">
                        <li>💬 <strong>Command:</strong> /start, /help, /card</li>
                        <li>✏️ <strong>Exact Text:</strong> Matches "hello" exactly</li>
                        <li>🔍 <strong>Contains:</strong> Message has "help" anywhere</li>
                        <li>🎯 <strong>Button Click:</strong> User clicks a button</li>
                        <li>👤 <strong>User Joins:</strong> Someone joins the chat</li>
                        <li>📩 <strong>Reply:</strong> Someone replies to a message</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                      <strong>🎬 DO</strong> - Actions your bot performs
                      <ul className="ml-4 mt-2 space-y-1 text-sm">
                        <li>💬 Send messages with buttons</li>
                        <li>📝 Set variables (balance, score, etc.)</li>
                        <li>📦 Add/Remove from lists (inventories)</li>
                        <li>➕➖ Increment/Decrement numbers</li>
                        <li>🎲 Random & Weighted Random (rarities)</li>
                        <li>⏱️ Cooldowns and timers</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
                      <strong>🔀 IF/ELSE</strong> - Make decisions
                      <ul className="ml-4 mt-2 space-y-1 text-sm">
                        <li>If balance &gt; 100 then "You're rich!" else "Save more!"</li>
                        <li>Compare: =, ≠, &gt;, &lt;, ≥, ≤, contains</li>
                        <li>Nest actions inside IF and ELSE</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p>Code mode documentation...</p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Settings Button */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <SettingsIcon className="size-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bot Settings</DialogTitle>
              <DialogDescription>Configure your bot's basic information and mode</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="settings-name">Bot Name *</Label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Bot"
                  required
                />
              </div>
              <div>
                <Label htmlFor="settings-username">Username * (@username)</Label>
                <Input
                  id="settings-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mybot"
                  required
                />
              </div>
              <div>
                <Label htmlFor="settings-description">Description</Label>
                <Input
                  id="settings-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your bot do?"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="settings-enabled"
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="settings-enabled">Bot Enabled</Label>
              </div>
              <div>
                <Label>Mode</Label>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant={mode === 'blocks' ? 'default' : 'outline'}
                    onClick={() => setMode('blocks')}
                    className="flex-1"
                  >
                    <Blocks className="size-4 mr-2" />
                    Blocks (Scratch)
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'code' ? 'default' : 'outline'}
                    onClick={() => setMode('code')}
                    className="flex-1"
                  >
                    <Code className="size-4 mr-2" />
                    Code
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSettingsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button onClick={handleSave} className="bg-[#FF8C1A] hover:bg-[#FF7A00] text-white font-bold">
          <Save className="size-4 mr-2" />
          Save
        </Button>
        {currentBot && (
          <Button onClick={handleDelete} variant="destructive">
            <Trash2 className="size-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Scratch-like Editor Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="h-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
          {mode === 'code' ? (
            <div className="h-full flex flex-col">
              <Label htmlFor="code" className="mb-2 text-lg font-bold">Bot Code</Label>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-4 font-mono text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white resize-none"
                placeholder="Write your bot code here..."
              />
            </div>
          ) : (
            <div className="h-full">
              <BotBlockBuilder triggers={triggers} onChange={setTriggers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
