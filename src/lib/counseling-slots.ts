import { connectDB } from "@/lib/db";
import { CounselingBooking } from "@/models/CounselingBooking";
import { CounselingSettings } from "@/models/CounselingSettings";
import { CounselingSlot } from "@/models/CounselingSlot";

function slotKey(date: Date, slot: string) {
  return `${date.toISOString().slice(0, 10)}:${slot}`;
}

export async function reserveCounselingSlot(date: Date, slot: string) {
  await connectDB();
  const settings = await CounselingSettings.findOne({ key: "default" }).lean();
  const capacity = settings?.capacityPerSlot ?? 1;
  const key = slotKey(date, slot);
  const existing = await CounselingSlot.findOne({ slotKey: key }).lean();
  if (existing) {
    const reserved = await CounselingSlot.findOneAndUpdate(
      { slotKey: key, bookedCount: { $lt: capacity } },
      { $inc: { bookedCount: 1 } },
      { new: true }
    );
    return Boolean(reserved);
  }

  const currentBookings = await CounselingBooking.countDocuments({
    preferredDate: date,
    preferredSlot: slot,
    status: { $ne: "Cancelled" },
  });
  if (currentBookings >= capacity) return false;

  try {
    await CounselingSlot.create({ slotKey: key, bookedCount: currentBookings + 1 });
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const reserved = await CounselingSlot.findOneAndUpdate(
        { slotKey: key, bookedCount: { $lt: capacity } },
        { $inc: { bookedCount: 1 } },
        { new: true }
      );
      return Boolean(reserved);
    }
    throw error;
  }
}

export async function releaseCounselingSlot(date: Date, slot: string) {
  await CounselingSlot.updateOne(
    { slotKey: slotKey(date, slot), bookedCount: { $gt: 0 } },
    { $inc: { bookedCount: -1 } }
  );
}
