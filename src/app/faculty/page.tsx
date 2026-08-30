import FacultyPage from "@/components/Faculty/FacultyPage";
import { publicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = publicMetadata("AI Academy Faculty", "Meet the AI Academy instructors bringing practical technology education and mentorship to every learner.", "/faculty");

export default function FacultyRoute() {
  return <FacultyPage />;
}
