import mongoose from "mongoose";

// Every document is returned to clients as { id, ...fields } instead of { _id, __v, ...fields }.
mongoose.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = String(ret._id);
    delete ret._id;
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
    globalThis.mongooseConn = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((err) => {
      globalThis.mongooseConn = undefined; // let the next request retry
      throw err;
    });
  }
  return globalThis.mongooseConn;
}
