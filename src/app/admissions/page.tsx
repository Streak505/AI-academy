import AdmissionsPage from "@/components/Admissions/AdmissionsPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Admissions", "Learn about AI Academy admissions, available programs, application steps, and how our team can help you begin.", "/admissions");

export default function AdmissionsRoute() {
  return <AdmissionsPage />;
}
