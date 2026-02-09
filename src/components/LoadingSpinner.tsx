export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div
        className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
