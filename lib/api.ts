import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { connectDB } from "./db";

// Thrown by route handlers for expected failures (404, 401, ...).
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Every response in the API has one of these two shapes.
export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

// Wraps a route handler: connects to the DB, then turns any thrown error into
// the standard error response. Route handlers never need their own try/catch.
export function handle<C>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      await connectDB();
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.code, err.message);
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
        return fail(400, "VALIDATION_ERROR", "Request validation failed", details);
      }
      if (isDuplicateKey(err)) {
        const fields = Object.keys(err.keyValue).join(", ");
        return fail(409, "CONFLICT", `A record with the same ${fields} already exists`);
      }
      if ((err as Error).name === "MongooseServerSelectionError") {
        return fail(503, "SERVICE_UNAVAILABLE", "Database is unavailable, try again shortly");
      }
      console.error(err); // full error goes to the server log, never to the client
      return fail(500, "INTERNAL_ERROR", "Something went wrong");
    }
  };
}

// MongoDB raises code 11000 when a unique index is violated.
function isDuplicateKey(err: unknown): err is { keyValue: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

export function requireAdmin(req: NextRequest) {
  const key = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid x-admin-key header");
  }
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Request body must be valid JSON");
  }
  return schema.parse(json);
}

export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}
