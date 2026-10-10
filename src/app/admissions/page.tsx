import AdmissionsPage from "@/components/Admissions/AdmissionsPage";
import { publicMetadata } from "@/lib/seo";
import { academy } from "@/config/academy";

export const metadata = publicMetadata("Admissions", `Learn about ${academy.name} admissions, available programs, application steps, and how our team can help you begin.`, "/admissions");

export default function AdmissionsRoute() {
  return <AdmissionsPage />;
}
