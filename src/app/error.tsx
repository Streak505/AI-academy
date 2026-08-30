"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">AI Academy</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">Something went wrong</h1>
        <p className="mt-3 text-slate-600">This page could not be loaded. Try again or return to the academy homepage.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => reset()} className="rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">Try again</button>
          <Link href="/" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 no-underline hover:border-teal-700 hover:text-teal-700">Go home</Link>
        </div>
      </div>
    </main>
  );
}
