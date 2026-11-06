import { handle, ok, parseBody, requireAdmin } from "@/lib/api";
import { pickKey } from "@/lib/checker";
import { ReleaseSeatsBody } from "@/lib/schemas";
import { MockInventory } from "@/models/MockInventory";

export const POST = handle(async (req) => {
  requireAdmin(req);
  const body = await parseBody(req, ReleaseSeatsBody);
  const row = await MockInventory.findOneAndUpdate(
    pickKey(body),
    { availableSeats: body.availableSeats, $setOnInsert: { trainOrBus: `${body.source} service` } },
    { new: true, upsert: true },
  );
  return ok(row);
});
