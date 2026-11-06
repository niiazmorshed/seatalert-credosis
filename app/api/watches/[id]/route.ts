import { ApiError, handle, ok } from "@/lib/api";
import { IdParam } from "@/lib/schemas";
import { Watch } from "@/models/Watch";

export const DELETE = handle(async (_req, ctx: RouteContext<"/api/watches/[id]">) => {
  const { id } = IdParam.parse(await ctx.params);
  const watch = await Watch.findOneAndUpdate({ _id: id, active: true }, { active: false }, { new: true });
  if (!watch) throw new ApiError(404, "NOT_FOUND", "Active watch not found");
  return ok(watch);
});
