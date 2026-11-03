import { handle, ok, requireAdmin } from "@/lib/api";
import { runChecker } from "@/lib/checker";

// POST /api/checker/run (admin) — one pass of the background bot.
// In production this would run on a cron schedule; here it is triggered by hand for the demo.
export const POST = handle(async (req) => {
  requireAdmin(req);
  return ok(await runChecker());
});
