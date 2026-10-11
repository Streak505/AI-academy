"use client";

import { ErrorState } from "@/components/Common/DataState";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="p-4 sm:p-6"><ErrorState message="Unable to load this admin page." onRetry={reset} /></main>;
}
