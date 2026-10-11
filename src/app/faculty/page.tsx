import { FacultyCards } from "@/components/Academy/FacultyCards";
import { getPublicInstructors } from "@/lib/public-data";
import { getAcademySettings } from "@/lib/academy-settings";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;

// DEPRECATED: not part of Shahzaib Royal Academy scope as a top-level destination; reachable from About.
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata(`${academy.name} Faculty`, `Meet the ${academy.name} instructors and mentors${academy.locality ? ` in ${academy.locality}` : ""} supporting our learners.`, "/faculty");
}

export default async function FacultyRoute() {
  const [result, academy] = await Promise.all([getPublicInstructors(), getAcademySettings()]);
  return <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-32"><div className="mx-auto max-w-7xl"><h1 className="text-4xl font-bold text-slate-900">Faculty at {academy.name}</h1><p className="mt-4 max-w-3xl text-slate-600">Meet the teachers and mentors supporting students through academic coaching and skill development.</p><div className="mt-8"><FacultyCards result={result} /></div></div></main>;
}
