"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function WhatsAppButton({ initialNumber, academyName }: { initialNumber: string; academyName: string }) {
  const pathname = usePathname();
  const [whatsappNumber, setWhatsappNumber] = useState(initialNumber);
  const [name, setAcademyName] = useState(academyName);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/academy", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load academy contact details.");
        if (active) {
          setWhatsappNumber(payload.data.whatsappNumber);
          setAcademyName(payload.data.name || academyName);
        }
      } catch (error) {
        console.error("Unable to refresh WhatsApp contact details:", error);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [academyName]);
  if (pathname.startsWith("/admin") || pathname.startsWith("/student") || pathname.startsWith("/parent")) return null;
  const number = whatsappNumber.replace(/\D/g, "");
  if (!/^\d+$/.test(number)) return null;
  const message = encodeURIComponent(`Hello ${name}, I would like to learn more about your programs.`);
  return <a href={`https://wa.me/${number}?text=${message}`} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp" className="fixed bottom-5 right-5 z-40 inline-flex items-center rounded-full bg-green-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">WhatsApp</a>;
}
