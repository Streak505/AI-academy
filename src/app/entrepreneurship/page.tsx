import { ProgramGroupContent } from "@/components/Academy/ProgramsPageContent";
import { getPublicPrograms } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";

export const revalidate = 300;
export const metadata = publicMetadata("Entrepreneurship", "Build business, leadership, and financial skills at Shahzaib Royal Academy.", "/entrepreneurship");
export default async function EntrepreneurshipPage() {
  const result = await getPublicPrograms("entrepreneurship");
  return <ProgramGroupContent result={result} title="Entrepreneurship Training" intro="Build practical business, digital, financial, and leadership skills through guided modules and real-world projects." />;
}
