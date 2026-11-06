import { handle, ok, requireAdmin } from "@/lib/api";
import { runChecker } from "@/lib/checker";


export const POST = handle(async (req) => {
  requireAdmin(req);
  return ok(await runChecker());
});
