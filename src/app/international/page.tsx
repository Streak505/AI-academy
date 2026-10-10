import { ProgramGroupContent } from "@/components/Academy/ProgramsPageContent";
import { getPublicPrograms } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = publicMetadata("IELTS, PTE & Duolingo Preparation", "Prepare for IELTS, PTE, and Duolingo English tests at Shahzaib Royal Academy.", "/international");

export default async function InternationalPage() {
  const result = await getPublicPrograms("international");
  return <><ProgramGroupContent result={result} title="IELTS & International Test Preparation" intro="Prepare for IELTS, PTE, and Duolingo English Test with certified instruction, mock tests, and study-abroad guidance." /><section className="bg-slate-50 px-4 pb-20"><div className="mx-auto max-w-7xl rounded-2xl bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">Flexible preparation, practical assessment</h2><p className="mt-3 leading-7 text-slate-600">Programs may be offered online, in person, or in a hybrid format; check each course for its current delivery mode. Preparation includes practice tests and performance feedback to help you focus your study plan.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/admissions" className="rounded-lg bg-primary px-5 py-3 font-semibold text-white">Enroll now</a><a href="/career-counseling#booking" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-800">Book a free assessment</a></div></div></section></>;
}
