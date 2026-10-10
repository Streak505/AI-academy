import type { Metadata } from "next";
import { ProgramsPageContent } from "@/components/Academy/ProgramsPageContent";
import { publicMetadata } from "@/lib/seo";
import { getPublicPrograms } from "@/lib/public-data";

export const revalidate = 300;
export const metadata: Metadata = publicMetadata("Programs", "Explore academic coaching, career counseling, entrepreneurship, international test preparation, and professional development.", "/programs");

export default async function ProgramsRoute() {
  const result = await getPublicPrograms();
  return <ProgramsPageContent result={result} />;
}
