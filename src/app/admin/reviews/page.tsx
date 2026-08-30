import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { Review } from "@/models/Review";
import { ReviewActions } from "@/components/Admin/ReviewActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review Moderation" };

export default async function AdminReviewsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  await connectToDatabase();
  const reviews = await Review.find().populate("course", "title").sort({ createdAt: -1 }).lean();
  return <main className="min-h-screen bg-slate-100 p-4 text-slate-800 sm:p-6"><div className="mx-auto max-w-6xl"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Reviews</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Review moderation</h1><p className="mt-2 text-slate-600">Approve genuine learner feedback before it appears publicly.</p></div><div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">{reviews.length === 0 ? <p className="p-8 text-slate-600">No reviews have been submitted.</p> : <table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 font-semibold">Reviewer</th><th className="px-4 py-3 font-semibold">Course</th><th className="px-4 py-3 font-semibold">Rating</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{reviews.map((review) => <tr key={String(review._id)}><td className="px-4 py-4"><p className="font-semibold text-slate-900">{review.name}</p><p className="mt-1 max-w-md text-slate-600">{review.review}</p></td><td className="px-4 py-4 text-slate-600">{typeof review.course === "object" && review.course ? review.course.title : "Course"}</td><td className="px-4 py-4 text-amber-600">{review.rating}/5</td><td className="px-4 py-4"><span className={review.isPublished ? "text-emerald-700" : "text-slate-500"}>{review.isPublished ? "Published" : "Pending"}</span></td><td className="px-4 py-4"><ReviewActions id={String(review._id)} isPublished={Boolean(review.isPublished)} isFeatured={Boolean(review.isFeatured)} /></td></tr>)}</tbody></table>}</div></div></main>;
}
