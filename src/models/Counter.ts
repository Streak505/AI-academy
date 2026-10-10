import { Schema, model, models } from "mongoose";

const CounterSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    sequence: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { timestamps: true }
);

export const Counter = models.Counter || model("Counter", CounterSchema);
