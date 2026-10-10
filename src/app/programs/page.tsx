import ProgramsPage from "@/components/Programs/ProgramsPage";
import { publicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = publicMetadata("AI & Technology Programs", "Explore AI Academy programs in artificial intelligence, machine learning, data science, web development, and more.", "/programs");

export default function ProgramsRoute() {
  return <ProgramsPage />;
}
