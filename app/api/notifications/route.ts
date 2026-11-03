import { handle, ok, parseQuery } from "@/lib/api";
import { UserIdQuery } from "@/lib/schemas";
import { Notification } from "@/models/Notification";

// GET /api/notifications?userId= — alerts for a user, newest first.
export const GET = handle(async (req) => {
  const { userId } = parseQuery(req, UserIdQuery);
  return ok(await Notification.find({ userId }).sort({ sentAt: -1 }));
});
