import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

async function seed() {
  await connectDb();

  const existing = await User.findOne({ email: env.adminEmail });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  await User.create({
    name: "Arpan Jain",
    email: env.adminEmail,
    password: env.adminPassword,
    location: "Delhi",
    workType: "OTHER",
    role: "ADMIN",
    accountType: "PLATFORM",
    organizationName: "TrustShield AI",
    status: "ACTIVE"
  });

  console.log("Admin seeded successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
