import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { getPublicBlobToken } from "@/lib/blob";

export const runtime = "nodejs";
const maxImageSize = 5 * 1024 * 1024;

function validImage(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return mimeType === "image/webp" && bytes.length >= 12
    && new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP";
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    if (!auth.authorized) return auth.response;
    const requestSize = Number(request.headers.get("content-length") || 0);
    if (requestSize > maxImageSize + 64 * 1024) return NextResponse.json({ success: false, message: "The image is larger than 5 MB." }, { status: 413 });
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > maxImageSize || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ success: false, message: "Choose a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validImage(bytes, file.type)) return NextResponse.json({ success: false, message: "The file content does not match an image type." }, { status: 400 });
    const safeFilename = file.name.replace(/[/\\]/g, "_").replace(/[^\p{L}\p{N}._-]/gu, "_").slice(0, 120);
    const blob = await put(`admin-gallery/${randomUUID()}/${safeFilename}`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      cacheControlMaxAge: 60,
      token: getPublicBlobToken(),
    });
    return NextResponse.json({ success: true, data: { url: blob.url, filename: safeFilename, size: file.size, mimeType: file.type } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/gallery/upload failed:", error);
    return NextResponse.json({ success: false, message: "Unable to upload this image." }, { status: 500 });
  }
}
