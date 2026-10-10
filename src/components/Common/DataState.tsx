"use client";

import { Icon } from "@iconify/react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500" role="status">
      <Icon icon="solar:restart-circle-linear" className="animate-spin text-xl text-teal-700" aria-hidden="true" />
      <span>{label}...</span>
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Icon icon="solar:inbox-line-linear" className="mx-auto text-3xl text-slate-400" aria-hidden="true" />
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message = "Unable to load this information right now.", onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center" role="alert">
      <Icon icon="solar:danger-triangle-linear" className="mx-auto text-3xl text-rose-600" aria-hidden="true" />
      <p className="mt-2 text-sm font-medium text-rose-900">{message}</p>
      <button type="button" onClick={onRetry ?? (() => window.location.reload())} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Try again</button>
    </div>
  );
}
