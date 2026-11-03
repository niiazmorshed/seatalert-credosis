import { MockInventory } from "@/models/MockInventory";
import { Notification } from "@/models/Notification";
import { SeatSnapshot } from "@/models/SeatSnapshot";
import { Watch } from "@/models/Watch";

export type RouteKey = {
  source: string;
  from: string;
  to: string;
  travelDate: string;
  seatClass: string;
};

export function pickKey(obj: RouteKey): RouteKey {
  const { source, from, to, travelDate, seatClass } = obj;
  return { source, from, to, travelDate, seatClass };
}

// The core decision. Seats "opened" when they went from none to some.
// `previous` is null when the route has never been checked before.
export function seatsOpened(previous: number | null, current: number): boolean {
  return current > 0 && (previous === null || previous === 0);
}

export function latestSnapshot(key: RouteKey) {
  return SeatSnapshot.findOne(key).sort({ checkedAt: -1 });
}

export async function runChecker() {
  const watches = await Watch.find({ active: true });

  // Group watches by route so each route is checked once, however many people watch it.
  const byRoute = new Map<string, typeof watches>();
  for (const w of watches) {
    const k = JSON.stringify(pickKey(w));
    byRoute.set(k, [...(byRoute.get(k) ?? []), w]);
  }

  let routesOpened = 0;
  let notificationsCreated = 0;

  for (const routeWatches of byRoute.values()) {
    const key = pickKey(routeWatches[0]);
    const inventory = await MockInventory.findOne(key);
    if (!inventory) continue; // the "ticket site" does not list this route

    const previous = await latestSnapshot(key);
    const snapshot = await SeatSnapshot.create({
      ...key,
      trainOrBus: inventory.trainOrBus,
      availableSeats: inventory.availableSeats,
    });

    if (!seatsOpened(previous?.availableSeats ?? null, inventory.availableSeats)) continue;
    routesOpened++;

    const message =
      `${inventory.availableSeats} ${key.seatClass} seat(s) opened on ${key.source} ` +
      `${key.from} → ${key.to} (${inventory.trainOrBus}) for ${key.travelDate}`;

    for (const w of routeWatches) {
      try {
        await Notification.create({
          userId: w.userId,
          watchId: w._id,
          snapshotId: snapshot._id,
          channel: "log",
          status: "sent",
          message,
        });
        notificationsCreated++;
      } catch (err) {
        // Unique index (watchId, snapshotId): already notified for this snapshot.
        if ((err as { code?: number }).code !== 11000) throw err;
      }
    }
  }

  return { routesChecked: byRoute.size, routesOpened, notificationsCreated };
}
