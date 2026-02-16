import { Link } from 'react-router-dom';
import { Card } from '../components/Card';

function BookStackIcon() {
  return (
    <svg
      className="w-14 h-14 text-primary-600 mx-auto"
      fill="none"
      viewBox="0 0 48 48"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 12v24l8-4 8 4 8-4 8 4V12" />
      <path d="M8 12l8 4 8-4 8 4 8-4" />
      <path d="M8 20l8 4 8-4 8 4 8-4" />
    </svg>
  );
}

export function EntryPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 px-4">
      <Card padding="p-8" className="w-full max-w-md animate-scale-in">
        <BookStackIcon />
        <h1 className="text-3xl sm:text-4xl font-bold text-center mt-4 mb-1 tracking-tight text-stone-900">
          Battle of the Books
        </h1>
        <p className="text-stone-600 text-center mb-8">Choose how you want to sign in</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/admin/login"
            className="flex-1 px-6 py-4 text-center font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition duration-200"
          >
            Admin
          </Link>
          <Link
            to="/team/login"
            className="flex-1 px-6 py-4 text-center font-medium text-stone-700 bg-white border border-stone-300 rounded-lg shadow-sm hover:bg-stone-50 hover:shadow-md active:scale-[0.98] focus:ring-2 focus:ring-offset-2 focus:ring-primary outline-none transition duration-200"
          >
            Team
          </Link>
        </div>
      </Card>
      <p className="mt-6 text-sm text-stone-500 animate-fade-in stagger-3">
        New team? <Link to="/team/register" className="text-primary-600 hover:text-primary-700 font-medium transition duration-200">Register your team</Link>
      </p>
    </div>
  );
}
