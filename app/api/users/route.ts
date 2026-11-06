import { handle, ok, parseBody, requireAdmin } from "@/lib/api";
import { CreateUserBody } from "@/lib/schemas";
import { User } from "@/models/User";

export const POST = handle(async (req) => {
  const body = await parseBody(req, CreateUserBody);
  const user = await User.create(body);
  return ok(user, 201);
});

export const GET = handle(async (req) => {
  requireAdmin(req);
  return ok(await User.find().sort({ createdAt: -1 }));
});
