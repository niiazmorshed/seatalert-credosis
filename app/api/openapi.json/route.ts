import { buildOpenApiSpec } from "@/lib/openapi";

export function GET() {
  return Response.json(buildOpenApiSpec());
}
