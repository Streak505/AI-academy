import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { connectDB } from "@/lib/db";
import { Admission } from "@/models/Admission";
import { isValidObjectId } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string; docIndex: string }> };

function contentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ success: false, message: "Administrator authentication is required." }, { status: 401 });
    const token = process.env.BLOB_PRIVATE_READ_WRITE_TOKEN?.trim();
    if (!token) return NextResponse.json({ success: false, message: "Private document storage is not configured." }, { status: 503 });

    const { id, docIndex } = await params;
    if (!isValidObjectId(id) || !/^\d+$/.test(docIndex)) {
      return NextResponse.json({ success: false, message: "Invalid document request." }, { status: 400 });
    }

    await connectDB();
    const application = await Admission.findById(id).select("documents").lean();
    const document = application?.documents[Number(docIndex)];
    if (!document) return NextResponse.json({ success: false, message: "Document not found." }, { status: 404 });

    const blob = await get(document.url, { access: "private", token, useCache: false });
    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ success: false, message: "Document could not be retrieved." }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(blob.blob.size),
        "Content-Disposition": contentDisposition(document.filename),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("GET /api/admissions/[id]/documents/[docIndex] failed:", error);
    return NextResponse.json({ success: false, message: "Unable to open this document." }, { status: 500 });
  }
}
