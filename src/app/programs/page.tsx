import type { Metadata } from "next";
import { ProgramsPageContent } from "@/components/Academy/ProgramsPageContent";
import { publicMetadata } from "@/lib/seo";
import { getPublicPrograms } from "@/lib/public-data";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> {
  const academy = await getAcademySettings();
  return publicMetadata("Programs", `Explore academic coaching, career counseling, entrepreneurship, international test preparation, and professional development${academy.locality ? ` in ${academy.locality}` : ""}.`, "/programs");
}

export default async function ProgramsRoute() {
  const result = await getPublicPrograms();
  return <ProgramsPageContent result={result} />;
}
