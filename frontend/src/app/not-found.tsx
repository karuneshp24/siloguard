import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-slate-700">404</p>
        <p className="text-slate-400 text-sm">Page not found</p>
        <Link
          href="/"
          className="inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
