import { Schema, model, models, type InferSchemaType } from "mongoose";

// Stands in for the real ticket website. The checker reads availability from
// here, and the admin "simulate release" endpoint writes to it.
const mockInventorySchema = new Schema({
  source: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  travelDate: { type: String, required: true },
  seatClass: { type: String, required: true },
  trainOrBus: { type: String, required: true },
  availableSeats: { type: Number, required: true, min: 0 },
});

mockInventorySchema.index(
  { source: 1, from: 1, to: 1, travelDate: 1, seatClass: 1 },
  { unique: true },
);

export type MockInventoryDoc = InferSchemaType<typeof mockInventorySchema>;
export const MockInventory =
  models.MockInventory || model("MockInventory", mockInventorySchema, "mock_inventory");
