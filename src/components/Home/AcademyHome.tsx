import Image from "next/image";
import Link from "next/link";
import { AcademyMap } from "@/components/Academy/AcademyMap";
import { DataReadError, GalleryCards, InitiativeCards, ProgramCards } from "@/components/Academy/PublicCollections";
import { getAcademySettings } from "@/lib/academy-settings";
import { getPublicGallery, getPublicInitiatives, getPublicPrograms } from "@/lib/public-data";

export const revalidate = 300;

const modules: Record<string, string[]> = {
  career: ["Career Assessment", "Degree Selection Guidance", "University Selection Guidance", "Parent Counseling Sessions", "Scholarship Guidance", "Study Abroad Guidance"],
  entrepreneurship: ["Business Idea Development", "Digital Marketing", "Freelancing", "Leadership Skills", "Financial Literacy", "Business Planning"],
  professional: ["Spoken English", "Public Speaking", "Digital Marketing", "Graphic Design", "Computer Skills", "MS Office", "AI Fundamentals", "Content Writing", "Personality Development"],
};

const sectionClass = "px-4 py-16 sm:py-20";
const sectionInner = "mx-auto max-w-7xl";

export default async function AcademyHome() {
  const [academic, careers, enterprise, international, professional, csr, gallery, academy] = await Promise.all([
    getPublicPrograms("academic"),
    getPublicPrograms("career"),
    getPublicPrograms("entrepreneurship"),
    getPublicPrograms("international"),
    getPublicPrograms("professional"),
    getPublicInitiatives(),
    getPublicGallery(undefined, 6),
    getAcademySettings(),
  ]);
  return <main className="text-slate-900">
    <section className="bg-gradient-to-br from-royal-navy via-slate-900 to-slate-800 px-4 pb-16 pt-32 text-white sm:pb-24 sm:pt-40"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
      <div>{academy.timing.days || academy.timing.from || academy.timing.to ? <span className="inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200">{[academy.timing.days, [academy.timing.from, academy.timing.to].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</span> : null}<h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl">Build strong foundations for a brighter future.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">{academy.name} helps students excel at school, plan their careers, build practical skills, and prepare for global opportunities{academy.locality ? ` in ${academy.locality}` : ""}.</p>{academy.locality ? <p className="mt-3 text-sm font-semibold text-amber-200">Evening coaching for families in {academy.locality}.</p> : null}<div className="mt-8 flex flex-wrap gap-3"><Link href="/admissions" className="rounded-lg bg-gold px-6 py-3 font-bold text-royal-navy hover:bg-amber-300">Apply Now</Link>{/^\d{7,15}$/.test(academy.whatsappNumber.replace(/\D/g, "")) ? <a href={`https://wa.me/${academy.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${academy.name}, I would like to learn about admissions.`)}`} className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">WhatsApp us</a> : null}</div></div>
      <Image src="/images/banner/Hero.png" alt={`Students learning at ${academy.name}`} width={720} height={560} priority fetchPriority="high" sizes="(max-width: 1024px) 100vw, 50vw" className="h-auto max-h-[480px] w-full rounded-3xl object-cover shadow-2xl" />
    </div></section>
    <section className={`${sectionClass} bg-slate-50`}><div className={sectionInner}>{academic.success ? <ProgramCards programs={academic.data} title="Evening Coaching Classes" /> : <DataReadError label="academic programs" />}</div></section>
    <section className={sectionClass}><div className={sectionInner}><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-widest text-gold">Plan the next step</p><h2 className="mt-3 text-3xl font-bold">Career Counseling Services</h2><p className="mt-3 text-slate-600">Practical guidance for students and parents at every important education decision.</p><Link href="/career-counseling#booking" className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 font-semibold text-white">Book a Session</Link></div><div>{careers.success ? <ProgramCards programs={careers.data} /> : <DataReadError label="career counseling services" />}</div></div></div></section>
    <section className={`${sectionClass} bg-royal-navy text-white`}><div className={sectionInner}><p className="text-sm font-bold uppercase tracking-widest text-amber-300">Ideas into action</p><h2 className="mt-3 text-3xl font-bold">Entrepreneurship Training</h2><p className="mt-3 max-w-3xl text-slate-200">Build confidence to develop ideas, launch projects, and understand how organizations work.</p><div className="mt-6">{enterprise.success ? <ProgramCards programs={enterprise.data} /> : <DataReadError label="entrepreneurship modules" />}</div><div className="sr-only">{modules.entrepreneurship.join(", ")}</div></div></section>
    <section className={sectionClass}><div className={sectionInner}><p className="text-sm font-bold uppercase tracking-widest text-gold">Prepare for global opportunities</p><h2 className="mt-3 text-3xl font-bold">IELTS & International Test Preparation</h2>{international.success ? <ProgramCards programs={international.data} /> : <div className="mt-6"><DataReadError label="international programs" /></div>}</div></section>
    <section className={`${sectionClass} bg-slate-50`}><div className={sectionInner}><p className="text-sm font-bold uppercase tracking-widest text-gold">Skills for your future</p><h2 className="mt-3 text-3xl font-bold">Professional Courses</h2>{professional.success ? <ProgramCards programs={professional.data} /> : <div className="mt-6"><DataReadError label="professional courses" /></div>}<div className="sr-only">{modules.professional.join(", ")}</div></div></section>
    <section className={sectionClass}><div className={sectionInner}><p className="text-sm font-bold uppercase tracking-widest text-gold">Education for everyone</p><h2 className="mt-3 text-3xl font-bold">Community Support & Scholarships</h2><p className="mt-3 max-w-3xl text-slate-600">Discounts for orphan students and children of widows, merit-based scholarships, free counseling, and community programs.</p><div className="mt-6">{csr.success ? <InitiativeCards items={csr.data} /> : <DataReadError label="community initiatives" />}</div></div></section>
    <section className={`${sectionClass} bg-slate-50`}><div className={`${sectionInner} grid gap-8 md:grid-cols-2`}><div className="rounded-2xl bg-royal-navy p-7 text-white"><p className="text-sm font-semibold uppercase tracking-widest text-amber-300">Our vision</p><h2 className="mt-4 text-2xl font-bold">{academy.vision}</h2></div><div className="rounded-2xl bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">Our mission</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">{academy.mission.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
    <section className={sectionClass}><div className={sectionInner}><div className="mb-7 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-gold">Life at SRA</p><h2 className="mt-3 text-3xl font-bold">Academy Gallery</h2></div><Link href="/gallery" className="font-semibold text-primary underline">View gallery</Link></div>{gallery.success ? <GalleryCards items={gallery.data} limit={6} /> : <DataReadError label="gallery" />}</div></section>
    <section className={`${sectionClass} bg-slate-50`}><div className={`${sectionInner} grid gap-10 lg:grid-cols-2`}><div><p className="text-sm font-bold uppercase tracking-widest text-gold">Visit or reach out</p><h2 className="mt-3 text-3xl font-bold">Contact {academy.name}</h2><dl className="mt-6 space-y-4 text-slate-700">{academy.address ? <div><dt className="font-semibold">Address</dt><dd>{academy.address}</dd></div> : null}{academy.phone ? <div><dt className="font-semibold">Phone</dt><dd><a href={`tel:${academy.phone}`}>{academy.phone}</a></dd></div> : null}{academy.email ? <div><dt className="font-semibold">Email</dt><dd><a href={`mailto:${academy.email}`}>{academy.email}</a></dd></div> : null}{academy.timing.days || academy.timing.from || academy.timing.to ? <div><dt className="font-semibold">Class timing</dt><dd>{[academy.timing.days, [academy.timing.from, academy.timing.to].filter(Boolean).join("–")].filter(Boolean).join(", ")}</dd></div> : null}</dl>{/^\d+$/.test(academy.whatsappNumber) ? <a href={`https://wa.me/${academy.whatsappNumber}?text=${encodeURIComponent(`Hello ${academy.name}, I have a question.`)}`} className="mt-6 inline-flex rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">Message on WhatsApp</a> : null}</div><AcademyMap settings={academy} /></div></section>
  </main>;
}
