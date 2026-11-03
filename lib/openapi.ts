import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  CheckerSummary,
  CreateUserBody,
  CreateWatchBody,
  HealthResponse,
  IdParam,
  InventoryResponse,
  NotificationResponse,
  ReleaseSeatsBody,
  StationsResponse,
  UserIdQuery,
  UserResponse,
  WatchResponse,
  WatchWithStatusResponse,
} from "./schemas";

// The OpenAPI spec is built from the same Zod schemas that validate requests,
// so the docs at /docs can never drift from what the API actually accepts.

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "AdminKey", {
  type: "apiKey",
  in: "header",
  name: "x-admin-key",
  description: "Must match the ADMIN_KEY environment variable",
});

const ErrorResponse = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: "VALIDATION_ERROR" }),
      message: z.string().openapi({ example: "Request validation failed" }),
      details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    }),
  })
  .openapi("ErrorResponse");

const success = (schema: z.ZodType, description: string) => ({
  description,
  content: { "application/json": { schema: z.object({ success: z.literal(true), data: schema }) } },
});
const error = (description: string) => ({
  description,
  content: { "application/json": { schema: ErrorResponse } },
});
const json = (schema: z.ZodType) => ({ content: { "application/json": { schema } } });

registry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["Reference"],
  summary: "API and database status",
  responses: { 200: success(HealthResponse, "Status") },
});

registry.registerPath({
  method: "get",
  path: "/api/stations",
  tags: ["Reference"],
  summary: "Allowed stations, seat classes and sources",
  responses: { 200: success(StationsResponse, "Reference data") },
});

registry.registerPath({
  method: "post",
  path: "/api/users",
  tags: ["Users"],
  summary: "Create a user",
  request: { body: json(CreateUserBody) },
  responses: {
    201: success(UserResponse, "User created"),
    400: error("Validation error"),
    409: error("Email already registered"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/watches",
  tags: ["Watches"],
  summary: "Start watching a route",
  description:
    "travelDate must be today or later (Asia/Dhaka) and within the next 30 days. " +
    "from and to must be different stations from /api/stations.",
  request: { body: json(CreateWatchBody) },
  responses: {
    201: success(WatchResponse, "Watch created"),
    400: error("Validation error"),
    404: error("User not found"),
    409: error("The same active watch already exists"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/watches",
  tags: ["Watches"],
  summary: "List a user's watches with latest seat status",
  request: { query: UserIdQuery },
  responses: {
    200: success(z.array(WatchWithStatusResponse), "Watches, newest first"),
    400: error("Validation error"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/watches/{id}",
  tags: ["Watches"],
  summary: "Stop a watch (soft delete)",
  request: { params: IdParam },
  responses: {
    200: success(WatchResponse, "Watch deactivated"),
    400: error("Invalid id"),
    404: error("Active watch not found"),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/notifications",
  tags: ["Notifications"],
  summary: "List a user's alerts, newest first",
  request: { query: UserIdQuery },
  responses: {
    200: success(z.array(NotificationResponse), "Notifications"),
    400: error("Validation error"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/simulate/release",
  tags: ["Admin"],
  summary: "Simulate the ticket site releasing seats",
  description: "Sets the available seat count in the mock inventory. Stands in for the real ticket website.",
  security: [{ AdminKey: [] }],
  request: { body: json(ReleaseSeatsBody) },
  responses: {
    200: success(InventoryResponse, "Inventory updated"),
    400: error("Validation error"),
    401: error("Missing or invalid admin key"),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/checker/run",
  tags: ["Admin"],
  summary: "Run the seat checker once",
  description:
    "Core feature. For every watched route: read the mock inventory, compare with the last snapshot, " +
    "save a new snapshot, and create a notification for each active watch when seats opened (0 → more than 0). " +
    "A unique index on (watchId, snapshotId) guarantees no duplicate alerts.",
  security: [{ AdminKey: [] }],
  responses: {
    200: success(CheckerSummary, "Run summary"),
    401: error("Missing or invalid admin key"),
  },
});

export function buildOpenApiSpec() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.3",
    info: {
      title: "SeatAlert BD API",
      version: "1.0.0",
      description:
        "Watches train and bus ticket availability in Bangladesh and alerts users when seats open, " +
        "so they can buy the ticket themselves. No login in this demo: create a user, then pass its id.",
    },
    tags: [
      { name: "Users" },
      { name: "Watches" },
      { name: "Notifications" },
      { name: "Admin", description: "Require the x-admin-key header" },
      { name: "Reference" },
    ],
  });
}
