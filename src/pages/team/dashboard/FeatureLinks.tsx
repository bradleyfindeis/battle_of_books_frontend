import { Link } from 'react-router-dom';
import type { Team } from '../../../api/client';

interface FeatureLinksProps {
  team: Team;
}

export function FeatureLinks({ team }: FeatureLinksProps) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      {team?.leaderboard_enabled !== false && (
        <Link
          to="/team/leaderboard"
          className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card transition duration-200 hover:shadow-md hover:border-stone-200 active:scale-[0.98]"
        >
          <span className="text-2xl" aria-hidden>{'\u{1F3C6}'}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900">Team Leaderboard</h3>
            <p className="text-sm text-stone-600">See how you rank against your teammates.</p>
          </div>
          <span className="text-stone-400" aria-hidden>&rarr;</span>
        </Link>
      )}
      <Link
        to="/team/my-progress"
        className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-card transition duration-200 hover:shadow-md hover:border-stone-200 active:scale-[0.98]"
      >
        <span className="text-2xl" aria-hidden>{'\u{1F4CA}'}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-900">My Progress</h3>
          <p className="text-sm text-stone-600">Quiz trends, match record, reading stats, badges, and more.</p>
        </div>
        <span className="text-stone-400" aria-hidden>&rarr;</span>
      </Link>
    </div>
  );
}
