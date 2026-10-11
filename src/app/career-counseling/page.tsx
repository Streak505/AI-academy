import { ProgramGroupContent } from "@/components/Academy/ProgramsPageContent";
import CounselingBookingForm from "@/components/Academy/CounselingBookingForm";
import { getPublicPrograms } from "@/lib/public-data";
import { publicMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { getAcademySettings } from "@/lib/academy-settings";

export const revalidate = 300;
export const metadata = publicMetadata("Career Counseling", "Career assessment and education guidance for students and families.", "/career-counseling");
export default async function CareerCounselingPage() {
  const [result, session, academy] = await Promise.all([
    getPublicPrograms("career"),
    getCurrentUser().then((user) => ({ success: true as const, user })).catch((error) => {
      console.error("Unable to read counseling form session:", error);
      return { success: false as const };
    }),
    getAcademySettings(),
  ]);
  const initialValues = session.success && session.user ? { name: session.user.name, email: session.user.email, phone: "" } : undefined;
  return <><ProgramGroupContent result={result} title="Career Counseling" intro="Personalized guidance for students and parents to make informed education and career decisions." /><section className="bg-slate-50 px-4 pb-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h2 className="text-3xl font-bold text-slate-900">Who can book?</h2><p className="mt-4 leading-7 text-slate-600">Students planning their next steps and parents supporting their children are welcome. A limited number of free career counseling sessions are offered through our community initiatives.</p>{academy.timing.days || academy.timing.from || academy.timing.to ? <p className="mt-4 text-sm text-slate-600">Available {[academy.timing.days, [academy.timing.from, academy.timing.to].filter(Boolean).join("–")].filter(Boolean).join(", ")} Pakistan time.</p> : null}{!session.success ? <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">Unable to load your signed-in details. You can still request a session by entering your contact information.</p> : null}</div><CounselingBookingForm initialValues={initialValues} /></div></section></>;
}
