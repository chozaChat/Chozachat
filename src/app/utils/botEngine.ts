import { Bot, BotAPI, BotContext, BotMessage, BotButton } from '../types/bot';

export class BotExecutor {
  private messages: BotMessage[] = [];
  private variables: Record<string, any> = {};
  private context: BotContext;

  constructor(
    private bot: Bot,
    messageText: string,
    senderId: string,
    senderName: string,
    chatId: string,
    isDM: boolean,
    replyTo?: { userId: string; userName: string; text: string }
  ) {
    // Parse args from message (split by spaces, handle quoted strings)
    const args = messageText.trim().split(/\s+/).slice(1);

    this.context = {
      message: {
        text: messageText,
        senderId,
        senderName,
        chatId,
        isDM,
        args,
        replyTo,
      },
      variables: this.variables,
      bot: {
        id: bot.id,
        name: bot.name,
      },
    };
  }

  async execute(): Promise<BotMessage[]> {
    if (this.bot.mode === 'code') {
      return this.executeCode();
    } else {
      return this.executeBlocks();
    }
  }

  private async executeCode(): Promise<BotMessage[]> {
    const api: BotAPI = {
      send: (text: string, buttons?: BotButton[]) => {
        this.messages.push({ text, buttons });
      },
      reply: (text: string, buttons?: BotButton[]) => {
        this.messages.push({ text, buttons });
      },
      getVar: (name: string) => {
        return this.variables[name];
      },
      setVar: (name: string, value: any) => {
        this.variables[name] = value;
      },
      getList: (name: string) => {
        const list = this.variables[name];
        return Array.isArray(list) ? list : [];
      },
      addToList: (name: string, value: any) => {
        const list = this.variables[name];
        if (Array.isArray(list)) {
          list.push(value);
        } else {
          this.variables[name] = [value];
        }
      },
      removeFromList: (name: string, value: any) => {
        const list = this.variables[name];
        if (Array.isArray(list)) {
          const index = list.indexOf(value);
          if (index !== -1) {
            list.splice(index, 1);
          }
        }
      },
      increment: (name: string, amount: number = 1) => {
        const current = Number(this.variables[name]) || 0;
        const newValue = current + amount;
        this.variables[name] = newValue;
        return newValue;
      },
      decrement: (name: string, amount: number = 1) => {
        const current = Number(this.variables[name]) || 0;
        const newValue = current - amount;
        this.variables[name] = newValue;
        return newValue;
      },
      random: (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      choose: <T,>(array: T[]): T => {
        return array[Math.floor(Math.random() * array.length)];
      },
      matches: (pattern: string | RegExp) => {
        if (typeof pattern === 'string') {
          return this.context.message.text.toLowerCase() === pattern.toLowerCase();
        }
        return pattern.test(this.context.message.text);
      },
      contains: (text: string) => {
        return this.context.message.text.toLowerCase().includes(text.toLowerCase());
      },
      getArg: (index: number) => {
        return this.context.message.args?.[index];
      },
      getAllArgs: () => {
        return this.context.message.args || [];
      },
      getReplyUser: () => {
        return this.context.message.replyTo || null;
      },
      canUseCommand: (commandName: string, cooldownMs: number) => {
        const lastUsedKey = `_cooldown_${commandName}_${this.context.message.senderId}`;
        const lastUsed = this.variables[lastUsedKey] || 0;
        const now = Date.now();
        return now - lastUsed >= cooldownMs;
      },
      getTimeUntilNext: (commandName: string, cooldownMs: number) => {
        const lastUsedKey = `_cooldown_${commandName}_${this.context.message.senderId}`;
        const lastUsed = this.variables[lastUsedKey] || 0;
        const now = Date.now();
        const timeLeft = cooldownMs - (now - lastUsed);
        return Math.max(0, timeLeft);
      },
      formatTime: (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
          return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds % 60}s`;
        } else {
          return `${seconds}s`;
        }
      },
      context: this.context,
    };

    try {
      // Create a safe function from the bot code
      const botFunction = new Function('api', this.bot.code || '');
      await botFunction(api);
    } catch (error) {
      console.error('Bot execution error:', error);
      this.messages.push({
        text: `⚠️ Bot error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    return this.messages;
  }

  private async executeBlocks(): Promise<BotMessage[]> {
    if (!this.bot.triggers) return [];

    for (const trigger of this.bot.triggers) {
      let shouldExecute = false;

      switch (trigger.type) {
        case 'command':
          shouldExecute = this.context.message.text.startsWith('/' + trigger.value);
          break;
        case 'text':
          shouldExecute = this.context.message.text.toLowerCase() === trigger.value.toLowerCase();
          break;
        case 'contains':
          shouldExecute = this.context.message.text.toLowerCase().includes(trigger.value.toLowerCase());
          break;
        case 'startsWith':
          shouldExecute = this.context.message.text.toLowerCase().startsWith(trigger.value.toLowerCase());
          break;
        case 'endsWith':
          shouldExecute = this.context.message.text.toLowerCase().endsWith(trigger.value.toLowerCase());
          break;
        case 'any':
          shouldExecute = true;
          break;
        case 'regex':
          try {
            const regex = new RegExp(trigger.value, 'i');
            shouldExecute = regex.test(this.context.message.text);
          } catch (e) {
            console.error('Invalid regex:', trigger.value);
          }
          break;
      }

      if (shouldExecute) {
        for (const action of trigger.actions) {
          const result = this.executeBlockAction(action);
          if (result === 'skip') break;
        }
      }
    }

    return this.messages;
  }

  private executeBlockAction(action: any) {
    switch (action.type) {
      case 'send':
      case 'reply':
        this.messages.push({
          text: this.replaceVariables(action.params.text || ''),
          buttons: action.params.buttons,
        });
        break;

      case 'setVar':
        this.variables[this.replaceVariables(action.params.name)] = this.replaceVariables(action.params.value);
        break;

      case 'addToList':
        const listNameAdd = this.replaceVariables(action.params.listName);
        const valueToAdd = this.replaceVariables(action.params.value);
        if (!Array.isArray(this.variables[listNameAdd])) {
          this.variables[listNameAdd] = [];
        }
        this.variables[listNameAdd].push(valueToAdd);
        break;

      case 'removeFromList':
        const listNameRemove = this.replaceVariables(action.params.listName);
        const valueToRemove = this.replaceVariables(action.params.value);
        if (Array.isArray(this.variables[listNameRemove])) {
          const index = this.variables[listNameRemove].indexOf(valueToRemove);
          if (index !== -1) {
            this.variables[listNameRemove].splice(index, 1);
          }
        }
        break;

      case 'increment':
        const incName = this.replaceVariables(action.params.name);
        const incAmount = parseInt(this.replaceVariables(String(action.params.amount))) || 1;
        this.variables[incName] = (Number(this.variables[incName]) || 0) + incAmount;
        break;

      case 'decrement':
        const decName = this.replaceVariables(action.params.name);
        const decAmount = parseInt(this.replaceVariables(String(action.params.amount))) || 1;
        this.variables[decName] = (Number(this.variables[decName]) || 0) - decAmount;
        break;

      case 'random':
        const items = action.params.items || [];
        if (items.length > 0) {
          const chosen = items[Math.floor(Math.random() * items.length)];
          this.messages.push({
            text: this.replaceVariables(chosen),
          });
        }
        break;

      case 'randomWeighted':
        const weightedItems = action.params.items || [];
        if (weightedItems.length > 0) {
          const totalWeight = weightedItems.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
          let random = Math.random() * totalWeight;
          let chosen = weightedItems[0].value;

          for (const item of weightedItems) {
            random -= item.weight || 0;
            if (random <= 0) {
              chosen = item.value;
              break;
            }
          }

          this.messages.push({
            text: this.replaceVariables(chosen),
          });
        }
        break;

      case 'checkCooldown':
        const commandName = action.params.commandName || 'default';
        const cooldownMs = action.params.cooldownMs || 0;
        const lastUsedKey = `_cooldown_${commandName}_${this.context.message.senderId}`;
        const lastUsed = this.variables[lastUsedKey] || 0;
        const now = Date.now();
        const timeLeft = cooldownMs - (now - lastUsed);

        if (timeLeft > 0) {
          const hours = Math.floor(timeLeft / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

          let timeStr = '';
          if (hours > 0) timeStr += `${hours}h `;
          if (minutes > 0) timeStr += `${minutes}m `;
          if (seconds > 0 && hours === 0) timeStr += `${seconds}s`;

          this.messages.push({
            text: this.replaceVariables(action.params.failMessage || `Please wait ${timeStr.trim()}`),
          });
          // Skip remaining actions in this trigger by setting a flag
          return 'skip';
        }
        break;

      case 'setCooldown':
        const cmdName = action.params.commandName || 'default';
        const cooldownKey = `_cooldown_${cmdName}_${this.context.message.senderId}`;
        this.variables[cooldownKey] = Date.now();
        break;

      case 'condition':
        // Evaluate condition with operator
        const variable = this.replaceVariables(action.params.variable || '');
        const operator = action.params.operator || 'equals';
        const value = this.replaceVariables(action.params.value || '');
        let conditionResult = false;

        const varNum = parseFloat(variable);
        const valNum = parseFloat(value);

        switch (operator) {
          case 'equals':
            conditionResult = variable === value;
            break;
          case 'notEquals':
            conditionResult = variable !== value;
            break;
          case 'greaterThan':
            conditionResult = !isNaN(varNum) && !isNaN(valNum) && varNum > valNum;
            break;
          case 'lessThan':
            conditionResult = !isNaN(varNum) && !isNaN(valNum) && varNum < valNum;
            break;
          case 'greaterOrEqual':
            conditionResult = !isNaN(varNum) && !isNaN(valNum) && varNum >= valNum;
            break;
          case 'lessOrEqual':
            conditionResult = !isNaN(varNum) && !isNaN(valNum) && varNum <= valNum;
            break;
          case 'contains':
            conditionResult = String(variable).toLowerCase().includes(String(value).toLowerCase());
            break;
        }

        if (conditionResult) {
          action.params.thenActions?.forEach((a: any) => this.executeBlockAction(a));
        } else {
          action.params.elseActions?.forEach((a: any) => this.executeBlockAction(a));
        }
        break;
    }
  }

  private replaceVariables(text: string): string {
    return text.replace(/\{(\w+)\}/g, (match, varName) => {
      // Check for special variables first
      switch (varName) {
        case 'SenderName':
          return this.context.message.senderName;
        case 'SenderId':
          return this.context.message.senderId;
        case 'ReplyUserName':
          return this.context.message.replyTo?.userName || '';
        case 'ReplyUserId':
          return this.context.message.replyTo?.userId || '';
        case 'ReplyText':
          return this.context.message.replyTo?.text || '';
        default:
          // Check for arg variables (arg0, arg1, arg2, etc.)
          if (varName.startsWith('arg')) {
            const argIndex = parseInt(varName.substring(3));
            if (!isNaN(argIndex) && this.context.message.args) {
              return this.context.message.args[argIndex] || '';
            }
          }
          return this.variables[varName] ?? match;
      }
    });
  }

  private evaluateCondition(condition: string): boolean {
    // Simple condition evaluation
    try {
      const replaced = this.replaceVariables(condition);
      return Boolean(eval(replaced));
    } catch {
      return false;
    }
  }
}

export async function executeBotForMessage(
  bots: Bot[],
  messageText: string,
  senderId: string,
  senderName: string,
  chatId: string,
  isDM: boolean,
  replyTo?: { userId: string; userName: string; text: string }
): Promise<BotMessage[]> {
  const results: BotMessage[] = [];

  for (const bot of bots) {
    if (!bot.enabled) continue;

    const executor = new BotExecutor(bot, messageText, senderId, senderName, chatId, isDM, replyTo);
    const messages = await executor.execute();
    results.push(...messages);
  }

  return results;
}
