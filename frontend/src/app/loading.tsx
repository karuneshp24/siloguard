export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-yellow-500/20 border-t-yellow-500 animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
        </div>
        <div className="text-center">
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            SiloGuard
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Initialising Digital Twin…
          </p>
        </div>
      </div>
    </div>
  );
}
