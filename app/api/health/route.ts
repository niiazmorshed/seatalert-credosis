import mongoose from "mongoose";
import { ok } from "@/lib/api";
import { connectDB } from "@/lib/db";

// GET /api/health — always 200 from the API; reports whether the DB answered a ping.
export async function GET() {
  let database: "ok" | "down" = "down";
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();
    database = "ok";
  } catch (err) {
    console.error("health: database ping failed", err);
  }
  return ok({ api: "ok", database, time: new Date().toISOString() });
}
