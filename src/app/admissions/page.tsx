import AdmissionsPage from "@/components/Admissions/AdmissionsPage";
import { publicMetadata } from "@/lib/seo";
import { getPublicPrograms } from "@/lib/public-data";
import { getAcademySettings } from "@/lib/academy-settings";
import { breadcrumbSchema } from "@/lib/seo";
import { FaqSection, StructuredData } from "@/components/Seo/StructuredData";

const admissionFaqs = [
  { question: "How do I apply?", answer: "Complete the online application, choose an available program, upload the requested supporting document, and submit your consent." },
  { question: "How will I know my application was received?", answer: "The admissions team will review your application and contact the guardian using the details provided." },
  { question: "Can I request a concession?", answer: "Yes. Select the relevant concession type, add a short note, and provide the supporting documents requested in the application." },
];

export const revalidate = 300;
export async function generateMetadata() {
  const academy = await getAcademySettings();
  return publicMetadata("Admissions", `Learn about ${academy.name} admissions, available programs, application steps, and how our team can help you begin.`, "/admissions");
}

export default async function AdmissionsRoute({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const [{ program = "" }, result, academy] = await Promise.all([searchParams, getPublicPrograms(), getAcademySettings()]);
  return <><StructuredData data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Admissions", path: "/admissions" }])} />{academy.locality ? <p className="mx-auto max-w-7xl px-4 pt-28 text-sm text-slate-600">Admissions are open for learners in {academy.locality} and nearby communities.</p> : null}<AdmissionsPage initialProgram={program} initialPrograms={result.success ? result.data : []} programLoadError={!result.success} academyName={academy.name} whatsappNumber={academy.whatsappNumber} /><FaqSection items={admissionFaqs} /></>;
}
