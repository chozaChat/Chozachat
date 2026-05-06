import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { BotTrigger, BlockAction, BotButton } from '../types/bot';

interface BotBlockBuilderProps {
  triggers: BotTrigger[];
  onChange: (triggers: BotTrigger[]) => void;
}

export function BotBlockBuilder({ triggers, onChange }: BotBlockBuilderProps) {
  const [expandedTriggers, setExpandedTriggers] = useState<number[]>([0]);

  const addTrigger = () => {
    onChange([
      ...triggers,
      {
        type: 'text',
        value: '',
        actions: [],
      },
    ]);
    setExpandedTriggers([...expandedTriggers, triggers.length]);
  };

  const removeTrigger = (index: number) => {
    onChange(triggers.filter((_, i) => i !== index));
    setExpandedTriggers(expandedTriggers.filter(i => i !== index));
  };

  const updateTrigger = (index: number, updates: Partial<BotTrigger>) => {
    const newTriggers = [...triggers];
    newTriggers[index] = { ...newTriggers[index], ...updates };
    onChange(newTriggers);
  };

  const addAction = (triggerIndex: number, actionType: BlockAction['type']) => {
    const newTriggers = [...triggers];
    const defaultParams: Record<string, any> = {
      send: { text: '', buttons: [] },
      reply: { text: '', buttons: [] },
      setVar: { name: '', value: '' },
      addToList: { listName: '', value: '' },
      removeFromList: { listName: '', value: '' },
      increment: { name: '', amount: 1 },
      decrement: { name: '', amount: 1 },
      random: { items: ['Option 1', 'Option 2', 'Option 3'] },
      randomWeighted: { items: [{ value: 'Common', weight: 70 }, { value: 'Rare', weight: 25 }, { value: 'Legendary', weight: 5 }] },
      condition: { variable: '', operator: 'equals', value: '', thenActions: [], elseActions: [] },
      checkCooldown: { commandName: 'command', cooldownMs: 10800000, failMessage: 'You can use this again in {time}' },
      setCooldown: { commandName: 'command' },
    };

    newTriggers[triggerIndex].actions.push({
      type: actionType,
      params: defaultParams[actionType] || {},
    });
    onChange(newTriggers);
  };

  const removeAction = (triggerIndex: number, actionIndex: number) => {
    const newTriggers = [...triggers];
    newTriggers[triggerIndex].actions = newTriggers[triggerIndex].actions.filter((_, i) => i !== actionIndex);
    onChange(newTriggers);
  };

  const updateAction = (triggerIndex: number, actionIndex: number, params: any) => {
    const newTriggers = [...triggers];
    newTriggers[triggerIndex].actions[actionIndex].params = params;
    onChange(newTriggers);
  };

  const toggleTriggerExpanded = (index: number) => {
    if (expandedTriggers.includes(index)) {
      setExpandedTriggers(expandedTriggers.filter(i => i !== index));
    } else {
      setExpandedTriggers([...expandedTriggers, index]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <span className="text-xl">💡</span>
          <span>How Scratch Blocks Work:</span>
        </h4>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <p><strong className="text-yellow-600 dark:text-yellow-400">⚡ WHEN</strong> = What triggers your bot (commands like /start, messages like "hello")</p>
          <p><strong className="text-blue-600 dark:text-blue-400">🎬 DO</strong> = What actions happen (send messages, change variables, etc.)</p>
          <p><strong className="text-purple-600 dark:text-purple-400">🔀 IF/ELSE</strong> = Make choices (if balance &gt; 100 then "You're rich!" else "Save more!")</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span>Your Bot Blocks</span>
        </h3>
        <Button type="button" onClick={addTrigger} size="sm" className="bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600">
          <Plus className="size-4 mr-2" />
          Add New Block
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pr-4">
          {triggers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-8xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                Let's Build Your Bot!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Click the <strong>"Add New Block"</strong> button above to create your first bot block.
                It's just like Scratch - super easy!
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 max-w-sm mx-auto">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>Example:</strong> Create a bot that responds "Hello!" when someone says "hi"
                </p>
              </div>
            </div>
          ) : (
            triggers.map((trigger, triggerIndex) => {
              const isExpanded = expandedTriggers.includes(triggerIndex);
              return (
                <div
                  key={triggerIndex}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-4 border-blue-300 dark:border-blue-700 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleTriggerExpanded(triggerIndex)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="bg-white rounded-full p-1">
                        {isExpanded ? (
                          <ChevronUp className="size-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="size-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          <span>Block #{triggerIndex + 1}</span>
                        </div>
                        <div className="text-blue-100 text-sm">
                          {trigger.type === 'command' && '💬 '}
                          {trigger.type === 'text' && '✏️ '}
                          {trigger.type === 'contains' && '🔍 '}
                          {trigger.type} → "{trigger.value || '(empty)'}"
                        </div>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white"
                      onClick={() => removeTrigger(triggerIndex)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="p-4 space-y-4">

                  {isExpanded && (
                    <>
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-4 rounded-xl border-2 border-yellow-500 dark:border-yellow-600">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-yellow-500 dark:bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            ⚡ WHEN
                          </div>
                          <span className="text-sm font-medium dark:text-white">this happens...</span>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-2">
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Trigger Type</Label>
                            <select
                              value={trigger.type}
                              onChange={(e) =>
                                updateTrigger(triggerIndex, {
                                  type: e.target.value as BotTrigger['type'],
                                })
                              }
                              className="w-full p-2 border-2 border-yellow-300 dark:border-yellow-600 rounded-lg dark:bg-gray-700 dark:text-white font-medium"
                            >
                              <option value="command">💬 Command (starts with /)</option>
                              <option value="text">✏️ Exact Text</option>
                              <option value="contains">🔍 Contains Text</option>
                              <option value="startsWith">▶️ Starts With</option>
                              <option value="endsWith">⏹️ Ends With</option>
                              <option value="any">🌐 Any Message</option>
                              <option value="regex">🔧 Regex Pattern</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold mb-1 block">
                              {trigger.type === 'command'
                                ? '💬 Command (without /)'
                                : trigger.type === 'regex'
                                ? '🔧 Regex Pattern'
                                : '📝 Text to Match'}
                            </Label>
                            <Input
                              value={trigger.value}
                              onChange={(e) => updateTrigger(triggerIndex, { value: e.target.value })}
                              placeholder={
                                trigger.type === 'command'
                                  ? 'e.g., start, help, card'
                                  : trigger.type === 'regex'
                                  ? 'e.g., ^hello.*'
                                  : 'e.g., hello, help'
                              }
                              className="border-2 border-yellow-300 dark:border-yellow-600 dark:bg-gray-700 dark:text-white font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t-4 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                              🎬 DO
                            </div>
                            <span className="text-sm font-medium dark:text-white">these actions...</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'send')}
                            >
                              + Send
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'reply')}
                            >
                              + Reply
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'setVar')}
                            >
                              + Set Var
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'addToList')}
                            >
                              + Add to List
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'removeFromList')}
                            >
                              - Remove from List
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'increment')}
                            >
                              + Increment
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'decrement')}
                            >
                              - Decrement
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'random')}
                            >
                              🎲 Random
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'randomWeighted')}
                            >
                              🎲 Random %
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
                              onClick={() => addAction(triggerIndex, 'condition')}
                            >
                              🔀 If / Else
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'checkCooldown')}
                            >
                              ⏱️ Check Time
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addAction(triggerIndex, 'setCooldown')}
                            >
                              ⏱️ Set Time
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {trigger.actions.length === 0 ? (
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                              <div className="text-4xl mb-2">🎯</div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No actions yet!</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click a button above to add your first action</p>
                            </div>
                          ) : (
                            trigger.actions.map((action, actionIndex) => (
                              <div
                                key={actionIndex}
                                className={`p-3 rounded border-l-4 ${
                                  action.type === 'condition' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500' :
                                  action.type === 'send' || action.type === 'reply' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' :
                                  action.type === 'random' || action.type === 'randomWeighted' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                                  action.type.includes('Time') || action.type.includes('Cooldown') ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' :
                                  'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold dark:text-white">
                                    {action.type === 'condition' && '🔀 '}
                                    {(action.type === 'random' || action.type === 'randomWeighted') && '🎲 '}
                                    {action.type.includes('Time') && '⏱️ '}
                                    {action.type.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAction(triggerIndex, actionIndex)}
                                  >
                                    <Trash2 className="size-3 text-red-600" />
                                  </Button>
                                </div>

                                {(action.type === 'send' || action.type === 'reply') && (
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-xs">Message Text</Label>
                                      <textarea
                                        value={action.params.text || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            text: e.target.value,
                                          })
                                        }
                                        placeholder="Type your message..."
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white min-h-[60px]"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Use {'{'}varName{'}'}, {'{'}arg0{'}'}, {'{'}SenderName{'}'}, {'{'}ReplyUserName{'}'}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Buttons (optional, one per line: text|action|value)</Label>
                                      <textarea
                                        value={(action.params.buttons || []).map((b: BotButton) => `${b.text}|${b.action}|${b.value}`).join('\n')}
                                        onChange={(e) => {
                                          const buttons = e.target.value.split('\n').filter(s => s.trim()).map((line, idx) => {
                                            const [text, btnAction, value] = line.split('|');
                                            return {
                                              id: `btn-${idx}`,
                                              text: text || 'Button',
                                              action: (btnAction as 'command' | 'reply' | 'url') || 'command',
                                              value: value || '',
                                            };
                                          });
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            buttons,
                                          });
                                        }}
                                        placeholder="Help|command|/help&#10;Visit|url|https://example.com"
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white min-h-[50px]"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Format: ButtonText|command|/cmd or ButtonText|url|https://...
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {action.type === 'setVar' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Variable Name</Label>
                                      <Input
                                        value={action.params.name || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            name: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., score"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Value</Label>
                                      <Input
                                        value={action.params.value || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            value: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., 100"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                {action.type === 'random' && (
                                  <div>
                                    <Label className="text-xs">Random Options (one per line)</Label>
                                    <textarea
                                      value={(action.params.items || []).join('\n')}
                                      onChange={(e) =>
                                        updateAction(triggerIndex, actionIndex, {
                                          ...action.params,
                                          items: e.target.value.split('\n').filter(s => s.trim()),
                                        })
                                      }
                                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white min-h-[80px]"
                                    />
                                  </div>
                                )}

                                {action.type === 'checkCooldown' && (
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-xs">Command Name</Label>
                                      <Input
                                        value={action.params.commandName || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            commandName: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., dailycard"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Cooldown (milliseconds)</Label>
                                      <Input
                                        type="number"
                                        value={action.params.cooldownMs || 0}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            cooldownMs: parseInt(e.target.value) || 0,
                                          })
                                        }
                                        placeholder="10800000 = 3 hours"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        3600000 = 1hr, 10800000 = 3hrs, 86400000 = 24hrs
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Fail Message (optional)</Label>
                                      <Input
                                        value={action.params.failMessage || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            failMessage: e.target.value,
                                          })
                                        }
                                        placeholder="You can use this again in {time}"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                {action.type === 'setCooldown' && (
                                  <div>
                                    <Label className="text-xs">Command Name</Label>
                                    <Input
                                      value={action.params.commandName || ''}
                                      onChange={(e) =>
                                        updateAction(triggerIndex, actionIndex, {
                                          ...action.params,
                                          commandName: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., dailycard"
                                      className="text-sm dark:bg-gray-800 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Records the current time for this command
                                    </p>
                                  </div>
                                )}

                                {action.type === 'addToList' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">List Name</Label>
                                      <Input
                                        value={action.params.listName || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            listName: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., inventory_{SenderId}"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Value to Add</Label>
                                      <Input
                                        value={action.params.value || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            value: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., Phone-iPhone15"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                {action.type === 'removeFromList' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">List Name</Label>
                                      <Input
                                        value={action.params.listName || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            listName: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., inventory_{SenderId}"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Value to Remove</Label>
                                      <Input
                                        value={action.params.value || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            value: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., Phone-iPhone15"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                {action.type === 'increment' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Variable Name</Label>
                                      <Input
                                        value={action.params.name || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            name: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., balance_{SenderId}"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Amount</Label>
                                      <Input
                                        type="number"
                                        value={action.params.amount || 1}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            amount: parseInt(e.target.value) || 1,
                                          })
                                        }
                                        placeholder="1"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                {action.type === 'decrement' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-xs">Variable Name</Label>
                                      <Input
                                        value={action.params.name || ''}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            name: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., balance_{SenderId}"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Amount</Label>
                                      <Input
                                        type="number"
                                        value={action.params.amount || 1}
                                        onChange={(e) =>
                                          updateAction(triggerIndex, actionIndex, {
                                            ...action.params,
                                            amount: parseInt(e.target.value) || 1,
                                          })
                                        }
                                        placeholder="1"
                                        className="text-sm dark:bg-gray-800 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                )}

                                {action.type === 'randomWeighted' && (
                                  <div>
                                    <Label className="text-xs">Weighted Options (value:weight, one per line)</Label>
                                    <textarea
                                      value={(action.params.items || []).map((item: any) => `${item.value}:${item.weight}`).join('\n')}
                                      onChange={(e) => {
                                        const items = e.target.value.split('\n').filter(s => s.trim()).map(line => {
                                          const [value, weight] = line.split(':');
                                          return {
                                            value: value || '',
                                            weight: parseInt(weight) || 1,
                                          };
                                        });
                                        updateAction(triggerIndex, actionIndex, {
                                          ...action.params,
                                          items,
                                        });
                                      }}
                                      placeholder="Common:70&#10;Rare:25&#10;Legendary:5"
                                      className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white min-h-[80px]"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Weights are percentages (should add up to 100)
                                    </p>
                                  </div>
                                )}

                                {action.type === 'condition' && (
                                  <div className="space-y-2">
                                    {/* IF condition block - Scratch style */}
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-xl p-3 text-white">
                                      <div className="flex items-center gap-2 font-bold">
                                        <span className="text-lg">🔀</span>
                                        <span>IF</span>
                                      </div>
                                      <div className="mt-2 bg-white rounded-lg p-2">
                                        <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                                          <Input
                                            value={action.params.variable || ''}
                                            onChange={(e) =>
                                              updateAction(triggerIndex, actionIndex, {
                                                ...action.params,
                                                variable: e.target.value,
                                              })
                                            }
                                            placeholder="balance_{SenderId}"
                                            className="text-sm border-2 border-purple-300"
                                          />
                                          <select
                                            value={action.params.operator || 'equals'}
                                            onChange={(e) =>
                                              updateAction(triggerIndex, actionIndex, {
                                                ...action.params,
                                                operator: e.target.value,
                                              })
                                            }
                                            className="p-2 text-sm font-bold border-2 border-purple-300 rounded-md bg-purple-100 text-purple-900"
                                          >
                                            <option value="equals">=</option>
                                            <option value="notEquals">≠</option>
                                            <option value="greaterThan">&gt;</option>
                                            <option value="lessThan">&lt;</option>
                                            <option value="greaterOrEqual">≥</option>
                                            <option value="lessOrEqual">≤</option>
                                            <option value="contains">contains</option>
                                          </select>
                                          <Input
                                            value={action.params.value || ''}
                                            onChange={(e) =>
                                              updateAction(triggerIndex, actionIndex, {
                                                ...action.params,
                                                value: e.target.value,
                                              })
                                            }
                                            placeholder="100"
                                            className="text-sm border-2 border-purple-300"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* THEN block - nested inside */}
                                    <div className="ml-8 border-l-4 border-green-500 pl-4">
                                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-2 text-white mb-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 font-bold">
                                            <span>✓ THEN</span>
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            className="bg-white text-green-600 hover:bg-green-50 h-6 text-xs"
                                            onClick={() => {
                                              const newThenActions = [...(action.params.thenActions || []), { type: 'send', params: { text: '' } }];
                                              updateAction(triggerIndex, actionIndex, {
                                                ...action.params,
                                                thenActions: newThenActions,
                                              });
                                            }}
                                          >
                                            + Action
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        {(action.params.thenActions || []).length === 0 ? (
                                          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-dashed border-green-300 rounded-lg p-4 text-center">
                                            <p className="text-xs text-green-700 dark:text-green-400">Click + Action to add</p>
                                          </div>
                                        ) : (
                                          (action.params.thenActions || []).map((thenAction: any, thenIdx: number) => (
                                            <div key={thenIdx} className="bg-green-50 dark:bg-green-900/30 border-2 border-green-300 rounded-lg p-2">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-green-800 dark:text-green-300">{thenAction.type.toUpperCase()}</span>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-5 w-5 p-0"
                                                  onClick={() => {
                                                    const newThenActions = action.params.thenActions.filter((_: any, i: number) => i !== thenIdx);
                                                    updateAction(triggerIndex, actionIndex, {
                                                      ...action.params,
                                                      thenActions: newThenActions,
                                                    });
                                                  }}
                                                >
                                                  <Trash2 className="size-3 text-red-600" />
                                                </Button>
                                              </div>
                                              {thenAction.type === 'send' && (
                                                <Input
                                                  value={thenAction.params?.text || ''}
                                                  onChange={(e) => {
                                                    const newThenActions = [...action.params.thenActions];
                                                    newThenActions[thenIdx] = { ...thenAction, params: { ...thenAction.params, text: e.target.value } };
                                                    updateAction(triggerIndex, actionIndex, {
                                                      ...action.params,
                                                      thenActions: newThenActions,
                                                    });
                                                  }}
                                                  placeholder="Message..."
                                                  className="text-xs border-green-400"
                                                />
                                              )}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    {/* ELSE block - nested inside */}
                                    <div className="ml-8 border-l-4 border-red-500 pl-4">
                                      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-2 text-white mb-2">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 font-bold">
                                            <span>✗ ELSE</span>
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            className="bg-white text-red-600 hover:bg-red-50 h-6 text-xs"
                                            onClick={() => {
                                              const newElseActions = [...(action.params.elseActions || []), { type: 'send', params: { text: '' } }];
                                              updateAction(triggerIndex, actionIndex, {
                                                ...action.params,
                                                elseActions: newElseActions,
                                              });
                                            }}
                                          >
                                            + Action
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        {(action.params.elseActions || []).length === 0 ? (
                                          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-dashed border-red-300 rounded-lg p-4 text-center">
                                            <p className="text-xs text-red-700 dark:text-red-400">Click + Action to add</p>
                                          </div>
                                        ) : (
                                          (action.params.elseActions || []).map((elseAction: any, elseIdx: number) => (
                                            <div key={elseIdx} className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 rounded-lg p-2">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-red-800 dark:text-red-300">{elseAction.type.toUpperCase()}</span>
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-5 w-5 p-0"
                                                  onClick={() => {
                                                    const newElseActions = action.params.elseActions.filter((_: any, i: number) => i !== elseIdx);
                                                    updateAction(triggerIndex, actionIndex, {
                                                      ...action.params,
                                                      elseActions: newElseActions,
                                                    });
                                                  }}
                                                >
                                                  <Trash2 className="size-3 text-red-600" />
                                                </Button>
                                              </div>
                                              {elseAction.type === 'send' && (
                                                <Input
                                                  value={elseAction.params?.text || ''}
                                                  onChange={(e) => {
                                                    const newElseActions = [...action.params.elseActions];
                                                    newElseActions[elseIdx] = { ...elseAction, params: { ...elseAction.params, text: e.target.value } };
                                                    updateAction(triggerIndex, actionIndex, {
                                                      ...action.params,
                                                      elseActions: newElseActions,
                                                    });
                                                  }}
                                                  placeholder="Message..."
                                                  className="text-xs border-red-400"
                                                />
                                              )}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    {/* Closing bracket for IF block */}
                                    <div className="bg-purple-500 h-3 rounded-b-xl"></div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
