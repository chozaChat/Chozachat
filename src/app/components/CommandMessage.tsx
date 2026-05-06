import { motion } from 'motion/react';
import { Cloud, Clock, HelpCircle, AlertCircle, Calculator } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CommandMessageProps {
  type: 'weather' | 'time' | 'help' | 'error' | 'calc';
  success: boolean;
  content: string;
}

export function CommandMessage({ type, success, content }: CommandMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'weather':
        return <Cloud className="size-6" />;
      case 'time':
        return <Clock className="size-6" />;
      case 'calc':
        return <Calculator className="size-6" />;
      case 'help':
        return <HelpCircle className="size-6" />;
      case 'error':
        return <AlertCircle className="size-6" />;
      default:
        return <HelpCircle className="size-6" />;
    }
  };

  const getColor = () => {
    if (!success || type === 'error') {
      return 'from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 border-red-300 dark:border-red-700';
    }
    switch (type) {
      case 'weather':
        return 'from-blue-100 to-sky-50 dark:from-blue-900/30 dark:to-sky-800/20 border-blue-300 dark:border-blue-700';
      case 'time':
        return 'from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-300 dark:border-purple-700';
      case 'calc':
        return 'from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-800/20 border-orange-300 dark:border-orange-700';
      case 'help':
        return 'from-green-100 to-emerald-50 dark:from-green-900/30 dark:to-emerald-800/20 border-green-300 dark:border-green-700';
      default:
        return 'from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 border-gray-300 dark:border-gray-600';
    }
  };

  const getIconColor = () => {
    if (!success || type === 'error') {
      return 'text-red-600 dark:text-red-400';
    }
    switch (type) {
      case 'weather':
        return 'text-blue-600 dark:text-blue-400';
      case 'time':
        return 'text-purple-600 dark:text-purple-400';
      case 'calc':
        return 'text-orange-600 dark:text-orange-400';
      case 'help':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-md mx-auto p-4 rounded-lg bg-gradient-to-br border-2 ${getColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="whitespace-pre-wrap text-sm dark:text-white">
            {content}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
