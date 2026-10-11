import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { calculateLateFee } from "@/lib/fees";
import { FeeChallan } from "@/models/FeeChallan";

export async function GET(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET?.trim();
    if (!secret) return NextResponse.json({ success: false, message: "Fee cron is not configured." }, { status: 503 });
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }
    await connectDB();
    const now = new Date();
    const overdue = await FeeChallan.find({
      status: { $in: ["Unpaid", "Overdue"] },
      dueDate: { $lt: now },
    }).select("_id subtotal discount dueDate").limit(1000);
    for (const challan of overdue) {
      const lateFee = calculateLateFee(challan.dueDate, now);
      await FeeChallan.updateOne({ _id: challan._id, status: { $in: ["Unpaid", "Overdue"] } }, {
        $set: { status: "Overdue", lateFee, total: Math.max(0, challan.subtotal - challan.discount + lateFee) },
      });
    }
    return NextResponse.json({ success: true, data: { overdue: overdue.length } });
  } catch (error) {
    console.error("GET /api/cron/fees failed:", error);
    return NextResponse.json({ success: false, message: "Unable to update overdue challans." }, { status: 500 });
  }
}
