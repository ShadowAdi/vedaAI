import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-800 mb-4">404</h1>
        <h2 className="text-4xl font-semibold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-xl text-slate-600 mb-8 max-w-md">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link
          href="/assignments"
          className="inline-block px-8 py-3 bg-stone-900 text-white font-semibold rounded-lg hover:bg-stone-950 transition-colors duration-200 shadow-lg"
        >
          Go to Assignments
        </Link>
        <p className="text-slate-500 mt-8">
          <Link href="/" className="text-stone-950 hover:underline">
            Or go back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
