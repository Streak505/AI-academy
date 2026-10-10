import AdmissionsPage from "@/components/Admissions/AdmissionsPage";
import { publicMetadata } from "@/lib/seo";
import { academy } from "@/config/academy";
import { getPublicPrograms } from "@/lib/public-data";

export const revalidate = 300;
export const metadata = publicMetadata("Admissions", `Learn about ${academy.name} admissions, available programs, application steps, and how our team can help you begin.`, "/admissions");

export default async function AdmissionsRoute({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const [{ program = "" }, result] = await Promise.all([searchParams, getPublicPrograms()]);
  return <AdmissionsPage initialProgram={program} initialPrograms={result.success ? result.data : []} programLoadError={!result.success} />;
}
