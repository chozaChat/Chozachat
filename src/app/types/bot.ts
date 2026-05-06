export interface BotButton {
  id: string;
  text: string;
  action: 'command' | 'reply' | 'url';
  value: string;
}

export interface BotMessage {
  text: string;
  buttons?: BotButton[];
}

export interface BotVariable {
  name: string;
  value: any;
}

export interface BotContext {
  message: {
    text: string;
    senderId: string;
    senderName: string;
    chatId: string;
    isDM: boolean;
    args?: string[];
    replyTo?: {
      userId: string;
      userName: string;
      text: string;
    };
  };
  variables: Record<string, any>;
  bot: {
    id: string;
    name: string;
  };
}

export interface BotAPI {
  // Send a message
  send(text: string, buttons?: BotButton[]): void;

  // Reply to the current message
  reply(text: string, buttons?: BotButton[]): void;

  // Get/Set variables
  getVar(name: string): any;
  setVar(name: string, value: any): void;

  // List operations
  getList(name: string): any[];
  addToList(name: string, value: any): void;
  removeFromList(name: string, value: any): void;

  // Number operations
  increment(name: string, amount?: number): number;
  decrement(name: string, amount?: number): number;

  // Random utilities
  random(min: number, max: number): number;
  choose<T>(array: T[]): T;

  // Message matching
  matches(pattern: string | RegExp): boolean;
  contains(text: string): boolean;

  // Args and reply helpers
  getArg(index: number): string | undefined;
  getAllArgs(): string[];
  getReplyUser(): { userId: string; userName: string; text: string } | null;

  // Time utilities
  canUseCommand(commandName: string, cooldownMs: number): boolean;
  getTimeUntilNext(commandName: string, cooldownMs: number): number;
  formatTime(ms: number): string;

  // Context
  context: BotContext;
}

export type BotMode = 'code' | 'blocks';

export interface BlockAction {
  type: 'send' | 'reply' | 'setVar' | 'condition' | 'random' | 'checkCooldown' | 'setCooldown' | 'addToList' | 'removeFromList' | 'increment' | 'decrement' | 'randomWeighted';
  params: Record<string, any>;
}

export interface BotTrigger {
  type: 'command' | 'text' | 'contains' | 'regex' | 'startsWith' | 'endsWith' | 'any';
  value: string;
  actions: BlockAction[];
}

export interface Bot {
  id: string;
  name: string;
  username?: string;
  description: string;
  mode: BotMode;
  code?: string; // For code mode
  triggers?: BotTrigger[]; // For blocks mode
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
