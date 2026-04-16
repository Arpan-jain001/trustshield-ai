import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(env.mongodbUri, {
    dbName: "trustshield-ai"
  });
}
