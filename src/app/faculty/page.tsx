import FacultyPage from "@/components/Faculty/FacultyPage";
import { publicMetadata } from "@/lib/seo";
import { academy } from "@/config/academy";

export const dynamic = "force-dynamic";

// DEPRECATED: not part of Shahzaib Royal Academy scope as a top-level destination; reachable from About.
export const metadata = publicMetadata(`${academy.name} Faculty`, `Meet the ${academy.name} instructors and mentors supporting our learners.`, "/faculty");

export default function FacultyRoute() {
  return <FacultyPage />;
}
