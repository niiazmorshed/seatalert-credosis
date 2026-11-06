import { Schema, model, models, type InferSchemaType } from "mongoose";
import { SEAT_CLASSES, SOURCES, STATIONS } from "@/lib/constants";

const watchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    source: { type: String, enum: SOURCES, required: true },
    from: { type: String, enum: STATIONS, required: true },
    to: { type: String, enum: STATIONS, required: true },
    travelDate: { type: String, required: true }, // YYYY-MM-DD
    seatClass: { type: String, enum: SEAT_CLASSES, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

watchSchema.index(
  { userId: 1, source: 1, from: 1, to: 1, travelDate: 1, seatClass: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);

export type WatchDoc = InferSchemaType<typeof watchSchema>;
export const Watch = models.Watch || model("Watch", watchSchema, "watches");
