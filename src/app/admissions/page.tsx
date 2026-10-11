import AdmissionsPage from "@/components/Admissions/AdmissionsPage";
import { publicMetadata } from "@/lib/seo";
import { getPublicPrograms } from "@/lib/public-data";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata("Admissions", `Learn about ${academy.name} admissions, available programs, application steps, and how our team can help you begin.`, "/admissions");
}

export default async function AdmissionsRoute({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const [{ program = "" }, result, academy] = await Promise.all([searchParams, getPublicPrograms(), getAcademySettings()]);
  return <AdmissionsPage initialProgram={program} initialPrograms={result.success ? result.data : []} programLoadError={!result.success} academyName={academy.name} whatsappNumber={academy.whatsappNumber} />;
}
