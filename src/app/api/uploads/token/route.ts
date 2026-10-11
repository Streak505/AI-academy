import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { ADMISSION_DOCUMENT_KINDS, ADMISSION_MAX_DOCUMENT_SIZE } from "@/lib/validations";
import { getPrivateBlobToken } from "@/lib/blob";

export const runtime = "nodejs";

type AllowedMimeType = "application/pdf" | "image/jpeg" | "image/png";
const MAX_REQUEST_SIZE = Math.floor(4.5 * 1024 * 1024);

function getFileMimeType(file: File): AllowedMimeType | null {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "pdf" && file.type === "application/pdf") return "application/pdf";
  if (["jpg", "jpeg"].includes(extension ?? "") && file.type === "image/jpeg") return "image/jpeg";
  if (extension === "png" && file.type === "image/png") return "image/png";
  return null;
}

function hasValidSignature(bytes: Uint8Array, mimeType: AllowedMimeType) {
  if (mimeType === "application/pdf") return new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
}

export async function POST(request: NextRequest) {
  try {
    const token = getPrivateBlobToken();
    const requestSize = Number(request.headers.get("content-length") || 0);
    if (requestSize > MAX_REQUEST_SIZE) {
      return NextResponse.json({ success: false, message: "The upload request exceeds the 4.5 MB server limit." }, { status: 413 });
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = checkRateLimit(`admission-upload:${ip}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, message: "Too many document uploads. Please try again later." }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");
    if (!(file instanceof File) || typeof kind !== "string" || !ADMISSION_DOCUMENT_KINDS.includes(kind as (typeof ADMISSION_DOCUMENT_KINDS)[number])) {
      return NextResponse.json({ success: false, message: "Choose a valid document and document type." }, { status: 400 });
    }
    if (!Number.isInteger(file.size) || file.size < 1 || file.size > ADMISSION_MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ success: false, message: "Each document must be no larger than 4 MB." }, { status: 413 });
    }
    const mimeType = getFileMimeType(file);
    if (!mimeType) {
      return NextResponse.json({ success: false, message: "Only PDF, JPG, JPEG, and PNG files are allowed." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasValidSignature(bytes, mimeType)) {
      return NextResponse.json({ success: false, message: "The file content does not match its file type." }, { status: 400 });
    }

    const safeFilename = file.name.replace(/[/\\]/g, "_").replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 150);
    const blob = await put(`admissions/${randomUUID()}/${safeFilename}`, Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: true,
      contentType: mimeType,
      token,
      cacheControlMaxAge: 60,
    });

    return NextResponse.json({
      success: true,
      data: { uploadId: blob.pathname, kind, filename: safeFilename, size: file.size, mimeType },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/uploads/token failed:", error);
    return NextResponse.json({ success: false, message: "Unable to upload this document." }, { status: 500 });
  }
}
