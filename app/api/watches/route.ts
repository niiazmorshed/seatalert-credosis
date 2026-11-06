import { ApiError, handle, ok, parseBody, parseQuery } from "@/lib/api";
import { latestSnapshot, pickKey } from "@/lib/checker";
import { CreateWatchBody, UserIdQuery } from "@/lib/schemas";
import { User } from "@/models/User";
import { Watch } from "@/models/Watch";
export const POST = handle(async (req) => {
  const body = await parseBody(req, CreateWatchBody);
  if (!(await User.exists({ _id: body.userId }))) {
    throw new ApiError(404, "NOT_FOUND", "User not found");
  }
  const watch = await Watch.create(body);
  return ok(watch, 201);
});


export const GET = handle(async (req) => {
  const { userId } = parseQuery(req, UserIdQuery);
  const watches = await Watch.find({ userId }).sort({ createdAt: -1 });
  const data = await Promise.all(
    watches.map(async (w) => {
      const snap = await latestSnapshot(pickKey(w));
      const latestStatus = snap ? { availableSeats: snap.availableSeats, checkedAt: snap.checkedAt } : null;
      return { ...w.toJSON(), latestStatus };
    }),
  );
  return ok(data);
});
