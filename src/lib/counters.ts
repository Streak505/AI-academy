import type { ClientSession } from "mongoose";
import { Counter } from "@/models/Counter";

export async function nextCounterValue(key: string, session?: ClientSession) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 }, $setOnInsert: { key } },
    { new: true, upsert: true, ...(session ? { session } : {}) }
  );
  return counter.sequence as number;
}
