import { Link } from 'react-router-dom';

interface Recommendation {
  emoji: string;
  text: string;
  link: string;
  linkLabel: string;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-stone-900 mb-3">Recommended for you</h3>
      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
            style={{ animation: `fade-in-up 0.3s ease-out ${i * 60}ms both` }}
          >
            <span className="text-lg shrink-0" aria-hidden>{rec.emoji}</span>
            <p className="flex-1 text-sm text-stone-700">{rec.text}</p>
            {rec.link.startsWith('/') ? (
              <Link
                to={rec.link}
                className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 transition whitespace-nowrap"
              >
                {rec.linkLabel} &rarr;
              </Link>
            ) : (
              <span className="shrink-0 text-sm font-medium text-stone-400 whitespace-nowrap">
                {rec.linkLabel}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
