import { handle, ok, parseBody } from "@/lib/api";
import { CreateUserBody } from "@/lib/schemas";
import { User } from "@/models/User";

// POST /api/users — create a user. Duplicate email → 409 via the unique index.
export const POST = handle(async (req) => {
  const body = await parseBody(req, CreateUserBody);
  const user = await User.create(body);
  return ok(user, 201);
});
