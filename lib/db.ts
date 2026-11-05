import mongoose from "mongoose";

// Every document is returned to clients as { id, ...fields } instead of { _id, __v, ...fields }.
mongoose.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    const { _id, ...rest } = ret;
    return { id: String(_id), ...rest };
  },
});

// Vercel runs each API route as a serverless function. Module state can survive
// between invocations, so we cache the connection promise on globalThis and
// reuse it instead of opening a new connection on every request.
declare global {
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

export function connectDB(): Promise<typeof mongoose> {
  if (!globalThis.mongooseConn) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    // dbName is fixed because the cluster also holds other projects' databases.
    // Whatever the URI says, this app (and the seed's wipe) only touches "seatalert".
    const options = { dbName: "seatalert", serverSelectionTimeoutMS: 5000 };
    globalThis.mongooseConn = mongoose.connect(uri, options).catch((err) => {
      globalThis.mongooseConn = undefined; // let the next request retry
      throw err;
    });
  }
  return globalThis.mongooseConn;
}
