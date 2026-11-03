import { Schema, model, models, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  watchId: { type: Schema.Types.ObjectId, ref: "Watch", required: true },
  snapshotId: { type: Schema.Types.ObjectId, ref: "SeatSnapshot", required: true },
  channel: { type: String, enum: ["log", "email"], default: "log" },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
});

// The database guarantees one notification per watch per snapshot,
// so running the checker twice can never alert the same user twice.
notificationSchema.index({ watchId: 1, snapshotId: 1 }, { unique: true });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;
export const Notification =
  models.Notification || model("Notification", notificationSchema, "notifications");
