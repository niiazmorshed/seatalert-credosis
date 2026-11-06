import mongoose from "mongoose";

mongoose.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret: Record<string, unknown>) => {
    const { _id, ...rest } = ret;
    return { id: String(_id), ...rest };
  },
});

declare global {
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

export function connectDB(): Promise<typeof mongoose> {
  if (!globalThis.mongooseConn) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    const options = { dbName: "seatalert", serverSelectionTimeoutMS: 5000 };
    globalThis.mongooseConn = mongoose.connect(uri, options).catch((err) => {
      globalThis.mongooseConn = undefined;
      throw err;
    });
  }
  return globalThis.mongooseConn;
}
