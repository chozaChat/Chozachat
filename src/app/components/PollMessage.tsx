import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, HelpCircle, Eye, EyeOff, MoreVertical, Pencil, Trash2, StopCircle, Clock, X, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PollData } from './PollCreator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface PollVote {
  userId: string;
  optionIds: string[];
  userName: string;
}

interface PollMessageProps {
  poll: PollData & {
    stopped?: boolean;
    expiresAt?: string;
    createdAt?: string;
  };
  pollId: string;
  votes: PollVote[];
  currentUserId: string;
  onVote: (pollId: string, optionIds: string[]) => void;
  onRetractVote?: (pollId: string) => void;
  isOwnPoll?: boolean;
  totalChatMembers?: number; // Total members in the chat (excluding sender)
  onRefreshPoll?: () => void; // Callback to refresh poll data
  onEditPoll?: (pollId: string) => void;
  onDeletePoll?: (pollId: string) => void;
  onStopVoting?: (pollId: string) => void;
  senderId?: string;
}

export function PollMessage({ poll, pollId, votes, currentUserId, onVote, onRetractVote, isOwnPoll, totalChatMembers, onRefreshPoll, onEditPoll, onDeletePoll, onStopVoting, senderId }: PollMessageProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Check if poll is expired
  useEffect(() => {
    if (!poll.expiresAt) {
      setIsExpired(false);
      setTimeRemaining(null);
      return;
    }

    const checkExpiry = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(poll.expiresAt!).getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
        return;
      }

      setIsExpired(false);

      // Calculate time remaining
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);

    return () => clearInterval(interval);
  }, [poll.expiresAt]);

  useEffect(() => {
    const userVote = votes.find(v => v.userId === currentUserId);
    if (userVote) {
      setHasVoted(true);
      setSelectedOptions(userVote.optionIds);
      setShowResults(true);
    } else {
      setHasVoted(false);
      setSelectedOptions([]);
      setShowResults(false);
    }
  }, [votes, currentUserId]);

  // Helper functions and calculations
  const getVoteCount = (optionId: string) => {
    return votes.filter(v => v.optionIds.includes(optionId)).length;
  };

  const getVoterNames = (optionId: string) => {
    return votes.filter(v => v.optionIds.includes(optionId)).map(v => v.userName);
  };

  const totalVotes = votes.length;
  
  const getPercentage = (optionId: string) => {
    if (totalVotes === 0) return 0;
    return Math.round((getVoteCount(optionId) / totalVotes) * 100);
  };

  const isCorrectOption = (optionId: string) => {
    if (!poll.victorineMode) return false;
    const option = poll.options.find(opt => opt.id === optionId);
    return option?.isCorrect || false;
  };

  const getUserCorrectness = () => {
    if (!poll.victorineMode || !hasVoted) return null;
    
    const correctOptionIds = poll.options.filter(opt => opt.isCorrect).map(opt => opt.id);
    const userSelectedCorrect = selectedOptions.filter(id => correctOptionIds.includes(id));
    const userSelectedWrong = selectedOptions.filter(id => !correctOptionIds.includes(id));
    
    if (userSelectedWrong.length > 0) return 'wrong';
    if (userSelectedCorrect.length === correctOptionIds.length && selectedOptions.length === correctOptionIds.length) {
      return 'correct';
    }
    return 'partial';
  };

  const correctness = getUserCorrectness();

  // Auto-refresh poll every 5 seconds if not everyone has voted
  useEffect(() => {
    if (!onRefreshPoll || !totalChatMembers) return;
    
    // Check if everyone has voted (excluding the poll sender)
    const allVoted = totalVotes >= totalChatMembers;
    
    if (allVoted) return; // Don't refresh if everyone voted
    
    const interval = setInterval(() => {
      console.log(`🔄 Auto-refreshing poll ${pollId} (${totalVotes}/${totalChatMembers} voted)`);
      onRefreshPoll();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [onRefreshPoll, totalChatMembers, totalVotes, pollId]);

  const handleOptionClick = (optionId: string) => {
    // Don't allow voting if poll is stopped or expired
    if (hasVoted || poll.stopped || isExpired) return;

    if (poll.multipleAnswers) {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(id => id !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length === 0) return;
    // Don't allow voting if poll is stopped or expired
    if (poll.stopped || isExpired) return;
    onVote(pollId, selectedOptions);
    setHasVoted(true);
    setShowResults(true);
  };

  // Determine if we should show voter names
  const shouldShowVoterNames = poll.hideVotersUntilStopped 
    ? (poll.stopped || isExpired) 
    : true;

  return (
    <div className="space-y-3 p-3 md:p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 min-w-0 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base md:text-lg dark:text-white break-words">{poll.question}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {poll.anonymous && (
              <Badge key="anonymous" variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800">
                🕵️ Anonymous
              </Badge>
            )}
            {poll.multipleAnswers && (
              <Badge key="multiple" variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900">
                ☑️ Multiple Choice
              </Badge>
            )}
            {poll.victorineMode && (
              <Badge key="victorine" variant="outline" className="text-xs bg-purple-100 dark:bg-purple-900">
                🎓 Quiz Mode
              </Badge>
            )}
            {poll.stopped && (
              <Badge key="stopped" variant="outline" className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                🛑 Voting Stopped
              </Badge>
            )}
            {isExpired && (
              <Badge key="expired" variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                ⏱️ Expired
              </Badge>
            )}
            {poll.expiresAt && !isExpired && timeRemaining && (
              <Badge key="timer" variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900">
                <Clock className="size-3 mr-1" />
                {timeRemaining}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </div>
      </div>

      {/* Hint for Victorine Mode */}
      {poll.victorineMode && poll.hint && !hasVoted && (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowHint(!showHint)}
            className="text-xs dark:border-gray-700"
          >
            <HelpCircle className="size-3 mr-1" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm"
            >
              💡 {poll.hint}
            </motion.div>
          )}
        </div>
      )}

      {/* Result Badge for Victorine Mode */}
      {poll.victorineMode && hasVoted && correctness && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-3 rounded-lg text-center font-semibold ${
            correctness === 'correct'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
              : correctness === 'wrong'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
          }`}
        >
          {correctness === 'correct' ? '✅ Correct!' : correctness === 'wrong' ? '❌ Incorrect' : '⚠️ Partially Correct'}
        </motion.div>
      )}

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const voteCount = getVoteCount(option.id);
          const percentage = getPercentage(option.id);
          const isSelected = selectedOptions.includes(option.id);
          const isCorrect = isCorrectOption(option.id);
          const voterNames = getVoterNames(option.id);

          return (
            <motion.div
              key={option.id}
              whileHover={!hasVoted ? { scale: 1.02 } : {}}
              whileTap={!hasVoted ? { scale: 0.98 } : {}}
            >
              <button
                type="button"
                onClick={() => handleOptionClick(option.id)}
                disabled={hasVoted}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all relative overflow-hidden ${
                  hasVoted
                    ? poll.victorineMode && isCorrect
                      ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                    : isSelected
                    ? 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {/* Progress Bar */}
                {showResults && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`absolute inset-0 ${
                      poll.victorineMode && isCorrect
                        ? 'bg-green-200 dark:bg-green-800/40'
                        : 'bg-blue-100 dark:bg-blue-800/40'
                    }`}
                  />
                )}

                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {poll.multipleAnswers ? (
                      <div className={`flex-shrink-0 size-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle2 className="size-4 text-white" />}
                      </div>
                    ) : (
                      <div className={`flex-shrink-0 size-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {isSelected && <div className="size-2.5 rounded-full bg-white" />}
                      </div>
                    )}
                    <span className="flex-1 dark:text-white break-words">{option.text}</span>
                    {poll.victorineMode && showResults && isCorrect && (
                      <CheckCircle2 className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  {showResults && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-sm dark:text-white">{percentage}%</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">({voteCount})</span>
                    </div>
                  )}
                </div>

                {/* Voter names (non-anonymous) */}
                {showResults && !poll.anonymous && showVoters && shouldShowVoterNames && voterNames.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200">
                    👥 {voterNames.join(', ')}
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Explanation for Victorine Mode */}
      {poll.victorineMode && poll.explanation && showResults && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded"
        >
          <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">📚 Explanation</div>
          <div className="text-sm text-gray-700 dark:text-gray-300">{poll.explanation}</div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2">
        {!hasVoted ? (
          <>
            {(poll.stopped || isExpired) ? (
              <div className="flex-1 p-2 md:p-3 text-center bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                {poll.stopped ? '🛑 Voting has been stopped' : '⏱️ Poll has expired'}
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleVote}
                disabled={selectedOptions.length === 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm md:text-base"
              >
                Vote {selectedOptions.length > 0 && `(${selectedOptions.length})`}
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-wrap gap-2 flex-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowResults(!showResults)}
              className="flex-1 min-w-0 dark:border-gray-700 text-xs md:text-sm"
            >
              {showResults ? (
                <>
                  <EyeOff className="size-3 md:size-4 md:mr-1" />
                  <span className="hidden md:inline">Hide Results</span>
                </>
              ) : (
                <>
                  <Eye className="size-3 md:size-4 md:mr-1" />
                  <span className="hidden md:inline">Show Results</span>
                </>
              )}
            </Button>
            {!poll.anonymous && totalVotes > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowVoters(!showVoters)}
                className="dark:border-gray-700 text-xs md:text-sm px-2 md:px-3"
                disabled={!shouldShowVoterNames}
              >
                {showVoters ? '👤' : '👥'}
                <span className="hidden md:inline ml-1">{showVoters ? 'Hide' : 'Show'} Voters</span>
                {!shouldShowVoterNames && <span className="ml-1">🔒</span>}
              </Button>
            )}
            {onRetractVote && !poll.victorineMode && !poll.stopped && !isExpired && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRetractVote(pollId)}
                className="bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs md:text-sm px-2 md:px-3"
              >
                <Undo2 className="size-3 md:size-4 md:mr-1" />
                <span className="hidden md:inline">Retract Vote</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Poll Actions */}
      {isOwnPoll && (
        <div className="mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="dark:border-gray-700"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              {!poll.stopped && !isExpired && onStopVoting && (
                <DropdownMenuItem
                  onClick={() => onStopVoting(pollId)}
                  className="text-red-500 dark:text-red-300"
                >
                  <StopCircle className="size-4 mr-2" />
                  Stop Voting
                </DropdownMenuItem>
              )}
              {poll.expiresAt && timeRemaining && (
                <DropdownMenuItem
                  disabled
                  className="text-gray-500 dark:text-gray-300"
                >
                  <Clock className="size-4 mr-2" />
                  {isExpired ? 'Expired' : `Expires in ${timeRemaining}`}
                </DropdownMenuItem>
              )}
              {onEditPoll && (
                <DropdownMenuItem
                  onClick={() => onEditPoll(pollId)}
                >
                  <Pencil className="size-4 mr-2" />
                  Edit Poll
                </DropdownMenuItem>
              )}
              {onDeletePoll && (
                <DropdownMenuItem
                  onClick={() => onDeletePoll(pollId)}
                  className="text-red-500 dark:text-red-300"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Poll
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}