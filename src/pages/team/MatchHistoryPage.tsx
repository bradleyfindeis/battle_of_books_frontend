import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { QuizMatchState, QuizMatchQuestionResult } from '../../api/client';

type MatchWithDate = QuizMatchState & { created_at: string };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function MatchHistoryPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMatchHistory()
      .then((data) => {
        if (!cancelled) setMatches(data);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="border-b border-stone-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Match History</h1>
          <Link
            to="/team/dashboard"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition duration-200 hover:bg-stone-50 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-3" aria-hidden>⚔️</p>
            <h2 className="text-lg font-semibold text-stone-900">No matches yet</h2>
            <p className="mt-2 text-stone-600">Once you complete a head-to-head quiz match, it will show up here so you can review it.</p>
            <Link
              to="/team/dashboard"
              className="mt-5 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:bg-primary-700 focus:outline focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              const isExpanded = expandedId === match.id;
              const isChallenger = match.challenger_id === user?.id;
              const myScore = isChallenger ? match.challenger_score : match.opponent_score;
              const theirScore = isChallenger ? match.opponent_score : match.challenger_score;
              const opponentName = isChallenger
                ? (match.opponent_username ?? match.invited_opponent_username)
                : match.challenger_username;
              const opponentAvatar = isChallenger
                ? (match.opponent_avatar ?? match.invited_opponent_avatar)
                : match.challenger_avatar;
              const won = myScore > theirScore;
              const tied = myScore === theirScore;
              const resultLabel = won ? 'Won' : tied ? 'Tied' : 'Lost';
              const resultColor = won
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : tied
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-red-700 bg-red-50 border-red-200';

              return (
                <div key={match.id} className="rounded-2xl bg-white border border-stone-100 shadow-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : match.id)}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-stone-50 transition"
                    aria-expanded={isExpanded}
                  >
                    <span className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-bold ${resultColor}`}>
                      {resultLabel}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900">
                        vs {opponentAvatar && <span className="mr-0.5" aria-hidden>{opponentAvatar}</span>}{opponentName}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(match.created_at)} at {formatTime(match.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-stone-900">{myScore} – {theirScore}</p>
                    </div>
                    <span className={`shrink-0 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden>
                      &#9662;
                    </span>
                  </button>

                  {isExpanded && match.question_results && match.question_results.length > 0 && (
                    <div className="border-t border-stone-100 px-4 py-3">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-2">
                        Question-by-question breakdown
                      </h3>
                      <ul className="space-y-2">
                        {match.question_results.map((qr: QuizMatchQuestionResult, i: number) => {
                          const iWasFirst = isChallenger
                            ? qr.first_responder_id === match.challenger_id
                            : qr.first_responder_id === match.opponent_id;
                          const myCorrect = iWasFirst ? qr.first_responder_correct : qr.second_responder_correct;
                          const theirCorrect = iWasFirst ? qr.second_responder_correct : qr.first_responder_correct;

                          return (
                            <li key={i} className="rounded-lg border border-stone-100 p-3 text-sm">
                              <div className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5 text-stone-400 font-mono text-xs w-5 text-right">
                                  {i + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-stone-900">{qr.question_text}</p>
                                  <p className="text-xs text-stone-500 mt-1">
                                    Answer: <span className="font-medium">{qr.correct_book_title}</span>
                                    {qr.correct_book_author && (
                                      <> by <span className="font-medium">{qr.correct_book_author}</span></>
                                    )}
                                  </p>
                                  <div className="flex gap-4 mt-1.5 text-xs">
                                    <span className={myCorrect ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                                      You: {myCorrect ? 'Correct' : myCorrect === false ? 'Wrong' : 'N/A'}
                                    </span>
                                    <span className={theirCorrect ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                                      {opponentName}: {theirCorrect ? 'Correct' : theirCorrect === false ? 'Wrong' : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {isExpanded && (!match.question_results || match.question_results.length === 0) && (
                    <div className="border-t border-stone-100 px-4 py-3 text-center">
                      <p className="text-sm text-stone-500">No question details available for this match.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
