import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SEAT_CLASSES, SOURCES, STATIONS } from "./constants";

extendZodWithOpenApi(z);

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character ObjectId")
  .openapi({ example: "665f1c2e8b3a4d001c9f1a2b" });

export function todayInDhaka(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

const MAX_DAYS_AHEAD = 30;

export const travelDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format")
  .refine(
    (d) => new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d,
    "Not a real date",
  )
  .refine((d) => d >= todayInDhaka(), "Travel date cannot be in the past")
  .refine(
    (d) =>
      (Date.parse(d) - Date.parse(todayInDhaka())) / 86_400_000 <=
      MAX_DAYS_AHEAD,
    `Travel date must be within the next ${MAX_DAYS_AHEAD} days`,
  )
  .openapi({ example: "2026-11-20" });

const routeFields = {
  source: z.enum(SOURCES).openapi({ example: "Railway" }),
  from: z.enum(STATIONS).openapi({ example: "Dhaka" }),
  to: z.enum(STATIONS).openapi({ example: "Chattogram" }),
  travelDate,
  seatClass: z.enum(SEAT_CLASSES).openapi({ example: "SNIGDHA" }),
};

const differentStations = (d: { from: string; to: string }) => d.from !== d.to;
const differentStationsMsg = {
  message: "from and to must be different stations",
  path: ["to"],
};

export const CreateUserBody = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .openapi({ example: "Niaz Morshed" }),
    email: z.email().openapi({ example: "niaz@example.com" }),
    phone: z
      .string()
      .regex(/^\+?\d{10,15}$/, "Must be 10-15 digits, optional leading +")
      .optional()
      .openapi({ example: "+8801700000000" }),
  })
  .openapi("CreateUserBody");

export const CreateWatchBody = z
  .object({ userId: objectId, ...routeFields })
  .refine(differentStations, differentStationsMsg)
  .openapi("CreateWatchBody");

export const ReleaseSeatsBody = z
  .object({
    ...routeFields,
    availableSeats: z.int().min(0).max(1000).openapi({ example: 12 }),
  })
  .refine(differentStations, differentStationsMsg)
  .openapi("ReleaseSeatsBody");

export const UserIdQuery = z.object({ userId: objectId });
export const IdParam = z.object({ id: objectId });

const timestamps = {
  createdAt: z.string().openapi({ example: "2026-11-03T10:00:00.000Z" }),
  updatedAt: z.string().openapi({ example: "2026-11-03T10:00:00.000Z" }),
};

export const UserResponse = z
  .object({
    id: objectId,
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    ...timestamps,
  })
  .openapi("User");

export const SeatStatus = z
  .object({
    availableSeats: z.int().openapi({ example: 0 }),
    checkedAt: z.string().openapi({ example: "2026-11-03T10:00:00.000Z" }),
  })
  .nullable()
  .openapi("SeatStatus", {
    description: "Latest snapshot for the route, or null if never checked",
  });

export const WatchResponse = z
  .object({
    id: objectId,
    userId: objectId,
    ...routeFields,
    active: z.boolean(),
    ...timestamps,
  })
  .openapi("Watch");

export const WatchWithStatusResponse = WatchResponse.extend({
  latestStatus: SeatStatus,
}).openapi("WatchWithStatus");

export const NotificationResponse = z
  .object({
    id: objectId,
    userId: objectId,
    watchId: objectId,
    snapshotId: objectId,
    channel: z.enum(["log", "email"]),
    status: z.enum(["sent", "failed"]),
    message: z
      .string()
      .openapi({
        example:
          "12 SNIGDHA seat(s) opened on Railway Dhaka → Chattogram for 2026-11-20",
      }),
    sentAt: z.string(),
  })
  .openapi("Notification");

export const InventoryResponse = z
  .object({
    id: objectId,
    ...routeFields,
    trainOrBus: z.string().openapi({ example: "Subarna Express" }),
    availableSeats: z.int(),
  })
  .openapi("Inventory");

export const CheckerSummary = z
  .object({
    routesChecked: z.int().openapi({ example: 3 }),
    routesOpened: z.int().openapi({ example: 1 }),
    notificationsCreated: z.int().openapi({ example: 1 }),
  })
  .openapi("CheckerSummary");

export const StationsResponse = z
  .object({
    stations: z.array(z.enum(STATIONS)),
    seatClasses: z.array(z.enum(SEAT_CLASSES)),
    sources: z.array(z.enum(SOURCES)),
  })
  .openapi("Stations");

export const HealthResponse = z
  .object({
    api: z.literal("ok"),
    database: z.enum(["ok", "down"]),
    time: z.string(),
  })
  .openapi("Health");
