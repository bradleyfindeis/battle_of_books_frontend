import { ChevronDown } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { DailyQuestionResponse } from '../../../api/client';

interface DailyQuestionProps {
  dailyQ: DailyQuestionResponse;
  dailySelectedId: number | null;
  setDailySelectedId: (id: number) => void;
  dailyRevealed: boolean;
  dailyExpanded: boolean;
  setDailyExpanded: (fn: (v: boolean) => boolean) => void;
  dailySubmitting: boolean;
  handleDailyAnswer: () => void;
}

export function DailyQuestion({
  dailyQ,
  dailySelectedId,
  setDailySelectedId,
  dailyRevealed,
  dailyExpanded,
  setDailyExpanded,
  dailySubmitting,
  handleDailyAnswer,
}: DailyQuestionProps) {
  if (!dailyQ.available || !dailyQ.question_text || !dailyQ.choices) return null;

  return (
    <Card className="mb-8">
      <button
        type="button"
        onClick={() => setDailyExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
        aria-expanded={dailyExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>{'\u{1F4A1}'}</span>
          <h3 className="text-lg font-semibold text-stone-900">Question of the day</h3>
          {dailyRevealed && !dailyExpanded && (
            <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${dailyQ.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {dailyQ.correct ? '\u2713 Answered' : '\u2717 Answered'}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-stone-400 transition-transform duration-300 ${dailyExpanded ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div className={`collapse-grid ${dailyExpanded ? 'expanded' : ''}`}>
        <div>
          <div className="mt-4">
            <p className="text-stone-800 font-medium mb-4">{dailyQ.question_text}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {dailyQ.choices.map((choice) => {
                const isSelected = dailySelectedId === choice.id;
                const isCorrectAnswer = dailyRevealed && choice.id === dailyQ.correct_answer_id;
                const isWrongChoice = dailyRevealed && isSelected && !dailyQ.correct;

                let borderClass = 'border-stone-200';
                let bgClass = 'bg-white hover:bg-stone-50';
                if (dailyRevealed) {
                  if (isCorrectAnswer) {
                    borderClass = 'border-emerald-400';
                    bgClass = 'bg-emerald-50';
                  } else if (isWrongChoice) {
                    borderClass = 'border-red-300';
                    bgClass = 'bg-red-50';
                  } else {
                    bgClass = 'bg-white opacity-60';
                  }
                } else if (isSelected) {
                  borderClass = 'border-primary-400';
                  bgClass = 'bg-primary-50';
                }

                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={dailyRevealed || dailySubmitting}
                    onClick={() => setDailySelectedId(choice.id)}
                    className={`text-left rounded-xl border-2 ${borderClass} ${bgClass} px-4 py-3 transition disabled:cursor-default`}
                  >
                    <span className="text-sm font-medium text-stone-900">{choice.title}</span>
                    {choice.author && (
                      <span className="block text-xs text-stone-500 mt-0.5">by {choice.author}</span>
                    )}
                    {dailyRevealed && isCorrectAnswer && (
                      <span className="text-xs font-medium text-emerald-700 mt-1 block">{'\u2713'} Correct answer</span>
                    )}
                    {dailyRevealed && isWrongChoice && (
                      <span className="text-xs font-medium text-red-600 mt-1 block">{'\u2717'} Your answer</span>
                    )}
                  </button>
                );
              })}
            </div>
            {!dailyRevealed && (
              <button
                type="button"
                disabled={!dailySelectedId || dailySubmitting}
                onClick={handleDailyAnswer}
                className="mt-4 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {dailySubmitting ? 'Submitting...' : 'Lock in answer'}
              </button>
            )}
            {dailyRevealed && (
              <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                <span>
                  {dailyQ.correct
                    ? <span className="text-emerald-700 font-medium">{'\u{1F389}'} You got it!</span>
                    : <span className="text-red-600 font-medium">Not quite — check out the correct answer above.</span>
                  }
                </span>
                {(dailyQ.team_answered ?? 0) > 0 && (
                  <span className="text-stone-500">
                    {dailyQ.team_correct}/{dailyQ.team_answered} teammates got it right
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
