import { Schema, model, models, type InferSchemaType } from "mongoose";


const seatSnapshotSchema = new Schema({
  source: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  travelDate: { type: String, required: true },
  seatClass: { type: String, required: true },
  trainOrBus: { type: String, required: true },
  availableSeats: { type: Number, required: true, min: 0 },
  checkedAt: { type: Date, default: Date.now },
});


seatSnapshotSchema.index({ source: 1, from: 1, to: 1, travelDate: 1, seatClass: 1, checkedAt: -1 });

export type SeatSnapshotDoc = InferSchemaType<typeof seatSnapshotSchema>;
export const SeatSnapshot =
  models.SeatSnapshot || model("SeatSnapshot", seatSnapshotSchema, "seat_snapshots");
