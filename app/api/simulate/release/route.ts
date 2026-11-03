import { handle, ok, parseBody, requireAdmin } from "@/lib/api";
import { pickKey } from "@/lib/checker";
import { ReleaseSeatsBody } from "@/lib/schemas";
import { MockInventory } from "@/models/MockInventory";

// POST /api/simulate/release (admin) — pretend the ticket site published or
// un-cancelled seats. Creates the route in the mock inventory if it is new.
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
