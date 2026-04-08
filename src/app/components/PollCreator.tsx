import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Plus, CheckCircle2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PollData {
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
  anonymous: boolean;
  multipleAnswers: boolean;
  victorineMode: boolean;
  hint?: string;
  explanation?: string;
  duration?: number; // in minutes
  hideVotersUntilStopped?: boolean;
}

interface PollCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (poll: PollData) => void;
  editingPollData?: PollData | null;
}

export function PollCreator({ open, onOpenChange, onCreatePoll, editingPollData }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<Array<{ id: string; text: string; isCorrect: boolean }>>([
    { id: '1', text: '', isCorrect: false },
    { id: '2', text: '', isCorrect: false }
  ]);
  const [anonymous, setAnonymous] = useState(false);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [victorineMode, setVictorineMode] = useState(false);
  const [hint, setHint] = useState('');
  const [explanation, setExplanation] = useState('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [hideVotersUntilStopped, setHideVotersUntilStopped] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingPollData && open) {
      setQuestion(editingPollData.question);
      setOptions(editingPollData.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect || false
      })));
      setAnonymous(editingPollData.anonymous);
      setMultipleAnswers(editingPollData.multipleAnswers);
      setVictorineMode(editingPollData.victorineMode);
      setHint(editingPollData.hint || '');
      setExplanation(editingPollData.explanation || '');
      setDuration(editingPollData.duration);
      setHideVotersUntilStopped(editingPollData.hideVotersUntilStopped || false);
    } else if (!editingPollData && !open) {
      // Reset form when closing and not editing
      setQuestion('');
      setOptions([
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false }
      ]);
      setAnonymous(false);
      setMultipleAnswers(false);
      setVictorineMode(false);
      setHint('');
      setExplanation('');
      setDuration(undefined);
      setHideVotersUntilStopped(false);
    }
  }, [editingPollData, open]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, { id: String(options.length + 1), text: '', isCorrect: false }]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const toggleCorrectAnswer = (id: string) => {
    if (!victorineMode) return;
    
    if (multipleAnswers) {
      // Allow multiple correct answers
      setOptions(options.map(opt => 
        opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt
      ));
    } else {
      // Only one correct answer
      setOptions(options.map(opt => ({
        ...opt,
        isCorrect: opt.id === id ? !opt.isCorrect : false
      })));
    }
  };

  const handleCreate = () => {
    if (!question.trim()) {
      return;
    }

    const filledOptions = options.filter(opt => opt.text.trim());
    if (filledOptions.length < 2) {
      return;
    }

    if (victorineMode && !filledOptions.some(opt => opt.isCorrect)) {
      return;
    }

    onCreatePoll({
      question: question.trim(),
      options: filledOptions.map(opt => ({
        id: opt.id,
        text: opt.text.trim(),
        isCorrect: victorineMode ? opt.isCorrect : undefined
      })),
      anonymous,
      multipleAnswers,
      victorineMode,
      hint: victorineMode && hint.trim() ? hint.trim() : undefined,
      explanation: victorineMode && explanation.trim() ? explanation.trim() : undefined,
      duration,
      hideVotersUntilStopped
    });

    // Reset form
    setQuestion('');
    setOptions([
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false }
    ]);
    setAnonymous(false);
    setMultipleAnswers(false);
    setVictorineMode(false);
    setHint('');
    setExplanation('');
    setDuration(undefined);
    setHideVotersUntilStopped(false);
    onOpenChange(false);
  };

  const hasAtLeastTwoOptions = options.filter(opt => opt.text.trim()).length >= 2;
  const hasCorrectAnswer = victorineMode ? options.some(opt => opt.isCorrect) : true;
  const canCreate = question.trim() && hasAtLeastTwoOptions && hasCorrectAnswer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingPollData ? '✏️ Edit Poll' : '📊 Create Poll'}
          </DialogTitle>
          <DialogDescription>
            {editingPollData ? 'Update your poll settings and options.' : 'Create a poll with up to 10 options. Configure settings below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Question */}
          <div>
            <Label htmlFor="poll-question">Poll Question *</Label>
            <Input
              id="poll-question"
              placeholder="What's your question?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Options * (minimum 2, maximum 10)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddOption}
                disabled={options.length >= 10}
                className="dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Plus className="size-4 mr-1" />
                Add Option
              </Button>
            </div>
            
            <AnimatePresence mode="popLayout">
              {options.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mb-2"
                >
                  {victorineMode && (
                    <Button
                      type="button"
                      size="icon"
                      variant={option.isCorrect ? "default" : "outline"}
                      onClick={() => toggleCorrectAnswer(option.id)}
                      className={`flex-shrink-0 ${
                        option.isCorrect 
                          ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' 
                          : 'dark:border-gray-700 dark:hover:bg-gray-800'
                      }`}
                      title="Mark as correct answer"
                    >
                      <CheckCircle2 className={`size-4 ${option.isCorrect ? 'text-white' : ''}`} />
                    </Button>
                  )}
                  <div className="flex-1 relative">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveOption(option.id)}
                      className="flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <div className="space-y-3 pt-2 border-t dark:border-gray-800">
            <Label className="text-base font-semibold">Poll Settings</Label>
            
            {/* Anonymous Mode */}
            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex-1">
                <div className="font-medium">🕵️ Anonymous Voting</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hide who voted for what</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={anonymous ? "default" : "outline"}
                onClick={() => setAnonymous(!anonymous)}
                className={anonymous ? 'bg-blue-500 hover:bg-blue-600' : 'dark:border-gray-700'}
              >
                {anonymous ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Multiple Answers */}
            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex-1">
                <div className="font-medium">☑️ Allow Multiple Answers</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Users can select more than one option</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={multipleAnswers ? "default" : "outline"}
                onClick={() => setMultipleAnswers(!multipleAnswers)}
                className={multipleAnswers ? 'bg-blue-500 hover:bg-blue-600' : 'dark:border-gray-700'}
              >
                {multipleAnswers ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Victorine Mode */}
            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex-1">
                <div className="font-medium">🎓 Victorine Mode (Quiz)</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mark correct answers for a quiz</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={victorineMode ? "default" : "outline"}
                onClick={() => setVictorineMode(!victorineMode)}
                className={victorineMode ? 'bg-purple-500 hover:bg-purple-600' : 'dark:border-gray-700'}
              >
                {victorineMode ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            {/* Duration Limit */}
            <div className="p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex-1">
                <div className="font-medium">⏱️ Limit Duration</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Auto-stop voting after set time</div>
              </div>
              <Input
                type="number"
                placeholder="Duration in minutes (optional)"
                value={duration !== undefined ? duration.toString() : ''}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                className="dark:bg-gray-800 dark:border-gray-700"
                min="1"
              />
            </div>

            {/* Hide Voters Until Stopped */}
            <div className="flex items-center justify-between p-3 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex-1">
                <div className="font-medium">👻 Hide Voters Until Stopped</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Don't show who voted until voting stops</div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={hideVotersUntilStopped ? "default" : "outline"}
                onClick={() => setHideVotersUntilStopped(!hideVotersUntilStopped)}
                className={hideVotersUntilStopped ? 'bg-blue-500 hover:bg-blue-600' : 'dark:border-gray-700'}
              >
                {hideVotersUntilStopped ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>

          {/* Victorine Mode Additional Fields */}
          {victorineMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold">
                <HelpCircle className="size-4" />
                Quiz Settings
              </div>
              
              {!hasCorrectAnswer && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  ⚠️ Please mark at least one correct answer using the checkmark buttons
                </div>
              )}

              <div>
                <Label htmlFor="hint" className="text-purple-700 dark:text-purple-300">
                  Hint (optional)
                </Label>
                <Input
                  id="hint"
                  placeholder="Give users a hint..."
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  className="mt-2 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <Label htmlFor="explanation" className="text-purple-700 dark:text-purple-300">
                  Explanation (optional)
                </Label>
                <Textarea
                  id="explanation"
                  placeholder="Explain the answer after voting..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={3}
                  className="mt-2 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleCreate}
            disabled={!canCreate}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {editingPollData ? 'Update Poll' : 'Create Poll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}