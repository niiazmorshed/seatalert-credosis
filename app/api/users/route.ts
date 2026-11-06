import { handle, ok, parseBody, requireAdmin } from "@/lib/api";
import { CreateUserBody } from "@/lib/schemas";
import { User } from "@/models/User";

// POST /api/users — create a user. Duplicate email → 409 via the unique index.
export const POST = handle(async (req) => {
  const body = await parseBody(req, CreateUserBody);
  const user = await User.create(body);
  return ok(user, 201);
});

// GET /api/users (admin) — list every user, newest first.
// Admin only, because it returns everyone's email and phone number.
export const GET = handle(async (req) => {
  requireAdmin(req);
  return ok(await User.find().sort({ createdAt: -1 }));
});
