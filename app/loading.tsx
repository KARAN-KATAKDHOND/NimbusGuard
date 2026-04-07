import { Cloud, CloudLightning } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center px-6 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_34%),linear-gradient(180deg,#07111f_0%,#050b14_100%)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[6%] top-[14%] text-sky-400/25 animate-cloud-drift">
          <Cloud className="h-24 w-24 fill-current" />
        </div>
        <div className="absolute right-[12%] top-[20%] text-blue-500/20 animate-cloud-drift" style={{ animationDelay: '1.5s' }}>
          <Cloud className="h-32 w-32 fill-current" />
        </div>
        <div className="absolute bottom-[18%] left-[18%] text-indigo-400/20 animate-cloud-drift" style={{ animationDelay: '3s' }}>
          <Cloud className="h-40 w-40 fill-current" />
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[2rem] border border-white/60 bg-white/80 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/75 animate-fade-rise">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 animate-float-gentle">
          <CloudLightning className="h-10 w-10" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600 dark:text-sky-400">
          NimbusGuard
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Loading your cloud dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Preparing live billing insights, anomaly signals, and workspace controls.
        </p>
        <div className="mt-8 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-soft-pulse" />
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-soft-pulse" style={{ animationDelay: '0.2s' }} />
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-soft-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}