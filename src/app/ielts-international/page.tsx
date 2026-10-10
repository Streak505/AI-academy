import { ProgramDirectory } from "@/components/Academy/PublicCollections";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("IELTS & International", "Prepare for IELTS, PTE, Duolingo English tests, and study abroad with expert guidance.", "/ielts-international");
export default function InternationalProgramsPage() {
  return <ProgramDirectory group="international" />;
}
