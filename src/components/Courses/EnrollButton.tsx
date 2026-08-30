"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnrollButton({ courseId, courseSlug }: { courseId: string; courseSlug: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [message, setMessage] = useState("");

  async function enroll() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.push(`/signin?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
        return;
      }
      if (response.status === 403) throw new Error("Only student accounts can enroll in courses.");
      if (!response.ok || !data.success) throw new Error(data.message || "Enrollment failed");
      setStatus("success");
      setMessage("You are enrolled. View it in your dashboard.");
    } catch (error) {
      setStatus("idle");
      setMessage(error instanceof Error ? error.message : "Enrollment failed");
    }
  }

  return (
    <div>
      <button type="button" onClick={enroll} disabled={status === "loading" || status === "success"} className="block w-full rounded-full bg-teal-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70">
        {status === "loading" ? "Enrolling..." : status === "success" ? "Enrolled" : "Enroll now"}
      </button>
      {message ? <p className={`mt-3 text-center text-sm ${status === "success" ? "text-emerald-600" : "text-rose-600"}`}>{message}</p> : null}
    </div>
  );
}
