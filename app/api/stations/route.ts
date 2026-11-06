import { SEAT_CLASSES, SOURCES, STATIONS } from "@/lib/constants";
import { ok } from "@/lib/api";

export function GET() {
  return ok({ stations: STATIONS, seatClasses: SEAT_CLASSES, sources: SOURCES });
}
