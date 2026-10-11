"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { EmptyState, ErrorState } from "@/components/Common/DataState";
import {
  ADMISSION_DOCUMENT_KINDS,
  ADMISSION_MAX_DOCUMENTS,
  ADMISSION_MAX_DOCUMENT_SIZE,
  admissionSubmissionSchema,
  type AdmissionSubmission,
} from "@/lib/validations";

type AdmissionProgram = { id: string; title: string; slug: string; group: string };
type StoredDocument = AdmissionSubmission["documents"][number];
type FormInput = AdmissionSubmission;

const steps = ["Student details", "Guardian details", "Concession request", "Documents", "Review & submit"];
const labels: Record<(typeof ADMISSION_DOCUMENT_KINDS)[number], string> = {
  student_identity: "Student B-Form / CNIC",
  guardian_identity: "Father / Guardian CNIC",
  previous_result: "Previous result card",
  passport_photo: "Passport photo",
  death_certificate: "Death certificate",
  other: "Other",
};
const textClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20";
const stepFields = [
  ["student.fullName", "student.fatherName", "student.dob", "student.gender", "student.program", "student.previousSchool", "student.address"],
  ["guardian.name", "guardian.cnic", "guardian.phone", "guardian.whatsapp", "guardian.email", "guardian.occupation"],
  ["concessionRequest.type", "concessionRequest.note"],
  ["documents"],
  ["consent"],
] as const;

const defaults = (program = ""): FormInput => ({
  student: { fullName: "", fatherName: "", dob: "", gender: "Other", program, previousSchool: "", address: "" },
  guardian: { name: "", cnic: "", phone: "", whatsapp: "", email: "", occupation: "" },
  concessionRequest: { type: "none", note: "" },
  documents: [],
  consent: false,
  website: "",
});

function getAllowedMimeType(file: File): StoredDocument["mimeType"] | null {
  const extension = file.name.toLowerCase().split(".").pop();
  if (file.size < 1 || file.size > ADMISSION_MAX_DOCUMENT_SIZE) return null;
  if (extension === "pdf" && file.type === "application/pdf") return "application/pdf";
  if (["jpg", "jpeg"].includes(extension ?? "") && file.type === "image/jpeg") return "image/jpeg";
  if (extension === "png" && file.type === "image/png") return "image/png";
  return null;
}

function getProgramLabel(programs: AdmissionProgram[], slug: string) {
  return programs.find((program) => program.slug === slug)?.title || slug || "Not selected";
}

export default function AdmissionsPage({
  initialProgram = "",
  initialPrograms = [],
  programLoadError = false,
  academyName,
  whatsappNumber: configuredWhatsapp,
}: {
  initialProgram?: string;
  initialPrograms?: AdmissionProgram[];
  programLoadError?: boolean;
  academyName: string;
  whatsappNumber: string;
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [programs] = useState(initialPrograms);
  const [isUploading, setIsUploading] = useState(false);
  const [fileKind, setFileKind] = useState<(typeof ADMISSION_DOCUMENT_KINDS)[number]>("student_identity");
  const [uploadError, setUploadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submittedReference, setSubmittedReference] = useState("");
  const [initializedDraft, setInitializedDraft] = useState(false);
  const form = useForm<FormInput>({
    resolver: zodResolver(admissionSubmissionSchema),
    mode: "onTouched",
    defaultValues: defaults(initialProgram),
  });
  const documents = form.watch("documents");
  const concessionType = form.watch("concessionRequest.type");
  const progress = Math.round(((activeStep + 1) / steps.length) * 100);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("sra-admission-draft");
      if (saved) {
        const draft = JSON.parse(saved) as { step?: unknown; fields?: Partial<FormInput> };
        if (draft.fields && typeof draft.fields === "object") {
          form.reset({ ...defaults(initialProgram), ...draft.fields, documents: [] });
        }
        if (typeof draft.step === "number" && Number.isInteger(draft.step)) {
          setActiveStep(Math.min(steps.length - 1, Math.max(0, draft.step)));
        }
      }
    } catch {
      sessionStorage.removeItem("sra-admission-draft");
    }
    setInitializedDraft(true);
  }, [form, initialProgram]);

  useEffect(() => {
    if (!initializedDraft || submittedReference) return;
    const subscription = form.watch((values) => {
      const { documents: _documents, ...fields } = values;
      try {
        sessionStorage.setItem("sra-admission-draft", JSON.stringify({ step: activeStep, fields }));
      } catch (error) {
        console.error("Unable to save admission draft:", error);
      }
    });
    return () => subscription.unsubscribe();
  }, [activeStep, form, initializedDraft, submittedReference]);

  useEffect(() => {
    if (initializedDraft) {
      try {
        const saved = sessionStorage.getItem("sra-admission-draft");
        if (saved) {
          const draft = JSON.parse(saved);
          sessionStorage.setItem("sra-admission-draft", JSON.stringify({ ...draft, step: activeStep }));
        }
      } catch {
        sessionStorage.removeItem("sra-admission-draft");
      }
    }
  }, [activeStep, initializedDraft]);

  async function moveToStep(nextStep: number) {
    if (nextStep > activeStep) {
      const valid = await form.trigger([...stepFields[activeStep]]);
      if (!valid) return;
    }
    setActiveStep(Math.max(0, Math.min(steps.length - 1, nextStep)));
    window.scrollTo({ top: document.getElementById("admission-form")?.offsetTop ?? 0, behavior: "smooth" });
  }

  async function uploadFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) return;
    setUploadError("");
    const currentDocuments = form.getValues("documents");
    if (currentDocuments.length + files.length > ADMISSION_MAX_DOCUMENTS) {
      setUploadError(`You can upload up to ${ADMISSION_MAX_DOCUMENTS} documents.`);
      return;
    }
    const contentTypes = files.map(getAllowedMimeType);
    const invalidIndex = contentTypes.findIndex((mimeType) => mimeType === null);
    if (invalidIndex !== -1) {
      setUploadError(`${files[invalidIndex].name}: choose a PDF, JPG, JPEG, or PNG file no larger than 4 MB.`);
      return;
    }

    setIsUploading(true);
    try {
      for (const [index, file] of files.entries()) {
        const mimeType = contentTypes[index];
        if (!mimeType) throw new Error("The selected file type is not supported.");
        const formData = new FormData();
        formData.set("file", file);
        formData.set("kind", fileKind);
        const response = await fetch("/api/uploads/token", { method: "POST", body: formData });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to upload this document.");
        const document: StoredDocument = {
          kind: result.data.kind,
          uploadId: result.data.uploadId,
          filename: result.data.filename,
          size: result.data.size,
          mimeType: result.data.mimeType,
        };
        form.setValue("documents", [...form.getValues("documents"), document], { shouldValidate: true, shouldDirty: true });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to upload this document.");
    } finally {
      setIsUploading(false);
    }
  }

  async function submitApplication(values: FormInput) {
    setSubmitError("");
    try {
      const response = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to submit the application.");
      setSubmittedReference(result.data.applicationRef || "");
      sessionStorage.removeItem("sra-admission-draft");
      form.reset(defaults(initialProgram));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit the application.");
    }
  }

  const whatsappText = encodeURIComponent(`Hello ${academyName}, my admission application reference is ${submittedReference}.`);
  const whatsappNumber = configuredWhatsapp.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${whatsappNumber.length >= 10 ? whatsappNumber : ""}?text=${whatsappText}`;

  if (submittedReference) {
    return (
      <main className="bg-slate-50 px-4 py-24 text-slate-900">
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-lg sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700" aria-hidden="true">✓</div>
          <h1 className="mt-6 text-3xl font-bold">Application submitted</h1>
          <p className="mt-3 text-slate-600">We have received your application. Keep this reference number for future communication.</p>
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 font-mono text-xl font-bold text-slate-900">{submittedReference}</p>
          <div className="mt-6 text-left">
            <h2 className="font-semibold">What happens next?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Our admissions team will review your details and documents, then contact your guardian about the next steps. Classes run Monday–Saturday, 5:00 PM–8:00 PM.</p>
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800">Contact us on WhatsApp</a>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-slate-50 text-slate-900">
      <section className="bg-slateGray px-4 pb-12 pt-28 sm:pt-32">
        <div className="container-standard mx-auto max-w-5xl">
          <p className="landing-pill mb-4">Admissions</p>
          <h1 className="hero-title text-4xl sm:text-5xl">Apply to Shahzaib Royal Academy</h1>
          <p className="hero-subtitle mt-5 max-w-2xl text-slate-700">Complete the application in five steps. Classes are Monday–Saturday, 5:00 PM–8:00 PM.</p>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16">
        <div id="admission-form" className="container-standard mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-9">
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Step {activeStep + 1} of {steps.length}: {steps[activeStep]}</p>
              <p className="text-sm text-slate-600" aria-live="polite">{progress}% complete</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Application progress">
              <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <ol className="mt-5 grid grid-cols-5 gap-2" aria-label="Application steps">
              {steps.map((step, index) => (
                <li key={step}>
                  <button type="button" onClick={() => index <= activeStep && setActiveStep(index)} aria-current={index === activeStep ? "step" : undefined} className={`w-full border-t-2 pt-2 text-left text-xs ${index <= activeStep ? "border-teal-700 font-semibold text-teal-800" : "border-slate-200 text-slate-500"}`}>
                    <span className="hidden sm:inline">{step}</span><span className="sm:hidden">{index + 1}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {programLoadError ? <div className="mb-5"><ErrorState message="Unable to load programs. Please retry before applying." /></div> : null}
          {!programLoadError && programs.length === 0 ? <div className="mb-5"><EmptyState title="No programs available" message="Admissions are unavailable until a program is published." /></div> : null}
          <form onSubmit={form.handleSubmit(submitApplication)} noValidate>
            {activeStep === 0 ? (
              <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="mb-4 text-xl font-bold">Student details</legend>
                <label className="text-sm font-medium">Student full name<input className={textClass} autoComplete="name" {...form.register("student.fullName")} />{form.formState.errors.student?.fullName ? <span className="text-sm text-rose-700">{form.formState.errors.student.fullName.message}</span> : null}</label>
                <label className="text-sm font-medium">Father&apos;s name<input className={textClass} {...form.register("student.fatherName")} />{form.formState.errors.student?.fatherName ? <span className="text-sm text-rose-700">{form.formState.errors.student.fatherName.message}</span> : null}</label>
                <label className="text-sm font-medium">Date of birth<input className={textClass} type="date" max={new Date().toISOString().slice(0, 10)} {...form.register("student.dob")} />{form.formState.errors.student?.dob ? <span className="text-sm text-rose-700">{form.formState.errors.student.dob.message}</span> : null}</label>
                <label className="text-sm font-medium">Gender<select className={textClass} {...form.register("student.gender")}><option>Female</option><option>Male</option><option>Other</option></select></label>
                <label className="text-sm font-medium sm:col-span-2">Class / program applying for<select className={textClass} disabled={programLoadError || programs.length === 0} {...form.register("student.program")}><option value="">Select a program</option>{programs.map((program) => <option key={program.id} value={program.slug}>{program.title}</option>)}</select>{form.formState.errors.student?.program ? <span className="text-sm text-rose-700">{form.formState.errors.student.program.message}</span> : null}</label>
                <label className="text-sm font-medium">Previous school (optional)<input className={textClass} {...form.register("student.previousSchool")} /></label>
                <label className="text-sm font-medium sm:col-span-2">Home address<textarea className={textClass} rows={3} {...form.register("student.address")} />{form.formState.errors.student?.address ? <span className="text-sm text-rose-700">{form.formState.errors.student.address.message}</span> : null}</label>
              </fieldset>
            ) : null}

            {activeStep === 1 ? (
              <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className="mb-4 text-xl font-bold">Guardian details</legend>
                <label className="text-sm font-medium">Guardian full name<input className={textClass} autoComplete="name" {...form.register("guardian.name")} />{form.formState.errors.guardian?.name ? <span className="text-sm text-rose-700">{form.formState.errors.guardian.name.message}</span> : null}</label>
                <label className="text-sm font-medium">CNIC<input className={textClass} inputMode="numeric" placeholder="12345-1234567-1" {...form.register("guardian.cnic")} />{form.formState.errors.guardian?.cnic ? <span className="text-sm text-rose-700">{form.formState.errors.guardian.cnic.message}</span> : null}</label>
                <label className="text-sm font-medium">Phone<input className={textClass} type="tel" autoComplete="tel" {...form.register("guardian.phone")} />{form.formState.errors.guardian?.phone ? <span className="text-sm text-rose-700">{form.formState.errors.guardian.phone.message}</span> : null}</label>
                <label className="text-sm font-medium">WhatsApp<input className={textClass} type="tel" {...form.register("guardian.whatsapp")} /></label>
                <label className="text-sm font-medium">Email<input className={textClass} type="email" autoComplete="email" {...form.register("guardian.email")} />{form.formState.errors.guardian?.email ? <span className="text-sm text-rose-700">{form.formState.errors.guardian.email.message}</span> : null}</label>
                <label className="text-sm font-medium">Occupation<input className={textClass} {...form.register("guardian.occupation")} /></label>
              </fieldset>
            ) : null}

            {activeStep === 2 ? (
              <fieldset className="grid gap-5">
                <legend className="text-xl font-bold">Concession request</legend>
                <label className="text-sm font-medium">Request type<select className={textClass} {...form.register("concessionRequest.type")}><option value="none">No concession</option><option value="orphan">Orphan student</option><option value="widow_child">Child of a widow</option><option value="merit">Merit scholarship</option><option value="other">Other</option></select></label>
                <label className="text-sm font-medium">Additional details<textarea className={textClass} rows={4} maxLength={1000} {...form.register("concessionRequest.note")} /></label>
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Concession requests require supporting proof documents. The academy reviews every request; submission does not guarantee approval.</p>
                {concessionType !== "none" ? <p className="text-sm font-semibold text-slate-700">You must upload proof in the next step. Orphan / widow requests also require a death certificate.</p> : null}
              </fieldset>
            ) : null}

            {activeStep === 3 ? (
              <fieldset>
                <legend className="text-xl font-bold">Supporting documents</legend>
                <p className="mt-2 text-sm text-slate-600">PDF, JPG, JPEG, or PNG only. Maximum 4 MB each and 6 files total. Documents upload to private storage and are not saved in your browser draft.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr]">
                  <label className="text-sm font-medium">Document type<select className={textClass} value={fileKind} onChange={(event) => setFileKind(event.target.value as typeof fileKind)}>{ADMISSION_DOCUMENT_KINDS.map((kind) => <option key={kind} value={kind}>{labels[kind]}</option>)}</select></label>
                  <label className="text-sm font-medium">Choose document<input className={`${textClass} file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:font-semibold file:text-white`} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple disabled={isUploading || documents.length >= ADMISSION_MAX_DOCUMENTS} onChange={uploadFiles} /></label>
                </div>
                {isUploading ? <p className="mt-4 text-sm text-teal-800" role="status">Uploading document…</p> : null}
                {uploadError ? <p className="mt-3 text-sm text-rose-700" role="alert">{uploadError}</p> : null}
                {form.formState.errors.documents?.message ? <p className="mt-3 text-sm text-rose-700">{form.formState.errors.documents.message}</p> : null}
                <ul className="mt-5 space-y-2">
                  {documents.map((document, index) => (
                    <li key={`${document.uploadId}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                      <span className="min-w-0 truncate"><strong>{labels[document.kind]}</strong> · {document.filename} ({(document.size / 1024 / 1024).toFixed(2)} MB)</span>
                      <button type="button" onClick={() => form.setValue("documents", documents.filter((_, documentIndex) => documentIndex !== index), { shouldValidate: true })} className="shrink-0 rounded-lg px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50" aria-label={`Remove ${document.filename}`}>Remove</button>
                    </li>
                  ))}
                </ul>
                {!documents.length ? <p className="mt-4 text-sm text-slate-600">At least one supporting document is required.</p> : null}
              </fieldset>
            ) : null}

            {activeStep === 4 ? (
              <fieldset className="space-y-5">
                <legend className="mb-4 text-xl font-bold">Review your application</legend>
                <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <div><dt className="font-semibold">Student</dt><dd>{form.getValues("student.fullName")} · {form.getValues("student.fatherName")}</dd></div>
                  <div><dt className="font-semibold">Date of birth / gender</dt><dd>{form.getValues("student.dob")} · {form.getValues("student.gender")}</dd></div>
                  <div><dt className="font-semibold">Program</dt><dd>{getProgramLabel(programs, form.getValues("student.program"))}</dd></div>
                  <div><dt className="font-semibold">Previous school</dt><dd>{form.getValues("student.previousSchool") || "Not provided"}</dd></div>
                  <div><dt className="font-semibold">Guardian</dt><dd>{form.getValues("guardian.name")} · {form.getValues("guardian.phone")}</dd></div>
                  <div><dt className="font-semibold">Guardian email</dt><dd>{form.getValues("guardian.email")}</dd></div>
                  <div><dt className="font-semibold">Address</dt><dd>{form.getValues("student.address")}</dd></div>
                  <div><dt className="font-semibold">Concession</dt><dd>{form.getValues("concessionRequest.type")}{form.getValues("concessionRequest.note") ? ` — ${form.getValues("concessionRequest.note")}` : ""}</dd></div>
                </dl>
                <div><h2 className="font-semibold">Documents ({documents.length})</h2><ul className="mt-2 list-inside list-disc text-sm text-slate-700">{documents.map((document, index) => <li key={`${document.uploadId}-${index}`}>{labels[document.kind]} — {document.filename}</li>)}</ul></div>
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm leading-6"><input type="checkbox" className="mt-1 h-4 w-4 accent-teal-700" {...form.register("consent")} /><span>I confirm that the information and documents provided are accurate, and I consent to the academy contacting my guardian about this application.</span></label>
                {form.formState.errors.consent?.message ? <p className="text-sm text-rose-700">{form.formState.errors.consent.message}</p> : null}
                {submitError ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{submitError}</p> : null}
              </fieldset>
            ) : null}

            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[10000px] h-px w-px" {...form.register("website")} />
            <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={() => moveToStep(activeStep - 1)} disabled={activeStep === 0 || isUploading} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50">Back</button>
              {activeStep < steps.length - 1 ? (
                <button type="button" onClick={() => moveToStep(activeStep + 1)} disabled={(programLoadError || programs.length === 0) && activeStep === 0 || isUploading} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50">Continue</button>
              ) : (
                <button type="submit" disabled={form.formState.isSubmitting || isUploading} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{form.formState.isSubmitting ? "Submitting…" : "Submit application"}</button>
              )}
            </div>
          </form>
        </div>
      </section>

      <div className="pb-12 text-center"><Link href="/programs" className="font-semibold text-teal-800 underline">View available programs</Link></div>
    </main>
  );
}
