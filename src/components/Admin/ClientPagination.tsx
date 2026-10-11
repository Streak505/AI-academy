"use client";

export function ClientPagination({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border bg-white px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400">Previous</button>
        <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="rounded-lg border bg-white px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400">Next</button>
      </div>
    </nav>
  );
}
