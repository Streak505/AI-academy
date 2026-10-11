import Link from "next/link";

export function AdminPagination({
  page,
  pages,
  href,
  query = {},
}: {
  page: number;
  pages: number;
  href: string;
  query?: Record<string, string>;
}) {
  function pageHref(targetPage: number) {
    const params = new URLSearchParams({ ...query, page: String(targetPage) });
    return `${href}?${params.toString()}`;
  }

  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-lg border bg-white px-3 py-2">Previous</Link> : <span className="rounded-lg border bg-slate-100 px-3 py-2 text-slate-400">Previous</span>}
        {page < pages ? <Link href={pageHref(page + 1)} className="rounded-lg border bg-white px-3 py-2">Next</Link> : <span className="rounded-lg border bg-slate-100 px-3 py-2 text-slate-400">Next</span>}
      </div>
    </nav>
  );
}
