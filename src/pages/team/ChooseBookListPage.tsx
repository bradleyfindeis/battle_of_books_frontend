import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { api } from '../../api/client';
import type { BookList } from '../../api/client';
import { BOOK_LISTS_FALLBACK } from '../../data/bookLists';

export function ChooseBookListPage() {
  const { refreshMe } = useAuth();
  const [lists, setLists] = useState<BookList[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingListId, setCreatingListId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api
      .getBookLists()
      .then((data) => {
        if (!cancelled) setLists(data);
      })
      .catch(() => {
        if (!cancelled) {
          setLists(
            BOOK_LISTS_FALLBACK.map((f, idx) => ({
              id: idx + 1,
              name: f.name,
              book_count: f.books.length,
              books: f.books.map((b, i) => ({ id: i + 1, title: b.title, author: b.author })),
            }))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSelectList = async (list: BookList) => {
    const books = list.books ?? [];
    if (books.length === 0) {
      setError('This list has no books.');
      return;
    }
    setError('');
    setCreatingListId(list.id);
    try {
      for (const book of books) {
        await api.createBook(book.title, book.author ?? undefined);
      }
      await api.updateMyTeamBookList(list.id);
      await refreshMe();
      navigate('/team/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add books. Try again.');
      setCreatingListId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Choose your book list</h1>
        <p className="text-stone-600 mb-6">Select one group of books for your team. You can only choose once.</p>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {lists.map((list) => {
            const count = list.books?.length ?? list.book_count ?? 0;
            const isCreating = creatingListId === list.id;
            const isDisabled = creatingListId != null && !isCreating;
            return (
              <button
                type="button"
                key={list.id}
                onClick={() => handleSelectList(list)}
                disabled={isDisabled}
                className="p-6 bg-white rounded-2xl shadow-card border border-stone-100 text-left hover:border-primary-200 hover:shadow-card-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none transition duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                <h2 className="text-lg font-semibold text-stone-900">{list.name}</h2>
                <p className="mt-1 text-sm text-stone-500">{count} books</p>
                {isCreating ? (
                  <p className="mt-3 text-sm text-primary-600">Adding books…</p>
                ) : (
                  <p className="mt-3 text-sm font-medium text-primary-600">Select this list</p>
                )}
              </button>
            );
          })}
        </div>
        {lists.length === 0 && (
          <p className="text-stone-500 text-center py-8">No book lists available. Ask your admin to create one.</p>
        )}
      </div>
    </div>
  );
}
