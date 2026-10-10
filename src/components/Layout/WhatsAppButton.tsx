"use client";

import { usePathname } from "next/navigation";
import { academy } from "@/config/academy";

export default function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/student") || pathname.startsWith("/parent")) return null;
  const number = academy.whatsappNumber;
  if (!/^\d+$/.test(number)) return null;
  const message = encodeURIComponent(`Hello ${academy.name}, I would like to learn more about your programs.`);
  return <a href={`https://wa.me/${number}?text=${message}`} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp" className="fixed bottom-5 right-5 z-40 inline-flex items-center rounded-full bg-green-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">WhatsApp</a>;
}
