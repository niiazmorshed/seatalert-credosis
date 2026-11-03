import { SEAT_CLASSES, SOURCES, STATIONS } from "@/lib/constants";
import { ok } from "@/lib/api";

// GET /api/stations — the allowed values for watch requests. No DB needed.
export function GET() {
  return ok({ stations: STATIONS, seatClasses: SEAT_CLASSES, sources: SOURCES });
}
