// Fills the database with realistic demo data. Run with: npm run seed
// Safe to re-run: it wipes the demo collections first.
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { MockInventory } from "../models/MockInventory";
import { Notification } from "../models/Notification";
import { SeatSnapshot } from "../models/SeatSnapshot";
import { User } from "../models/User";
import { Watch } from "../models/Watch";

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
};

// Some rows have 0 seats on purpose, so the demo can "release" them and trigger an alert.
const inventory = [
  { source: "Railway", from: "Dhaka", to: "Chattogram", travelDate: daysFromNow(7), seatClass: "SNIGDHA", trainOrBus: "Subarna Express", availableSeats: 0 },
  { source: "Railway", from: "Dhaka", to: "Chattogram", travelDate: daysFromNow(7), seatClass: "SHOVAN_CHAIR", trainOrBus: "Subarna Express", availableSeats: 42 },
  { source: "Railway", from: "Dhaka", to: "Chattogram", travelDate: daysFromNow(7), seatClass: "AC_SEAT", trainOrBus: "Sonar Bangla Express", availableSeats: 0 },
  { source: "Railway", from: "Dhaka", to: "Sylhet", travelDate: daysFromNow(10), seatClass: "SNIGDHA", trainOrBus: "Parabat Express", availableSeats: 0 },
  { source: "Railway", from: "Dhaka", to: "Sylhet", travelDate: daysFromNow(10), seatClass: "AC_BERTH", trainOrBus: "Upaban Express", availableSeats: 3 },
  { source: "Railway", from: "Dhaka", to: "Rajshahi", travelDate: daysFromNow(5), seatClass: "SNIGDHA", trainOrBus: "Silk City Express", availableSeats: 18 },
  { source: "Railway", from: "Dhaka", to: "Khulna", travelDate: daysFromNow(12), seatClass: "AC_SEAT", trainOrBus: "Sundarban Express", availableSeats: 0 },
  { source: "Railway", from: "Dhaka", to: "Cox's Bazar", travelDate: daysFromNow(14), seatClass: "SNIGDHA", trainOrBus: "Cox's Bazar Express", availableSeats: 0 },
  { source: "Shohoz", from: "Dhaka", to: "Cox's Bazar", travelDate: daysFromNow(14), seatClass: "AC", trainOrBus: "Green Line Hyundai", availableSeats: 0 },
  { source: "Shohoz", from: "Dhaka", to: "Cox's Bazar", travelDate: daysFromNow(14), seatClass: "NON_AC", trainOrBus: "Shyamoli Paribahan", availableSeats: 9 },
  { source: "Shohoz", from: "Dhaka", to: "Sylhet", travelDate: daysFromNow(3), seatClass: "AC", trainOrBus: "Ena Transport", availableSeats: 0 },
  { source: "Shohoz", from: "Chattogram", to: "Cox's Bazar", travelDate: daysFromNow(6), seatClass: "NON_AC", trainOrBus: "Hanif Enterprise", availableSeats: 25 },
];

async function seed() {
  await connectDB();

  await Promise.all([User, Watch, SeatSnapshot, Notification, MockInventory].map((m) => m.deleteMany({})));
  await Promise.all([User, Watch, SeatSnapshot, Notification, MockInventory].map((m) => m.syncIndexes()));

  await MockInventory.insertMany(inventory);
  // The bot has "already checked once", so every route has a starting snapshot.
  await SeatSnapshot.insertMany(inventory);

  const user = await User.create({ name: "Demo User", email: "demo@seatalert.bd", phone: "+8801700000000" });

  console.log(`Seeded ${inventory.length} inventory rows and 1 user.`);
  console.log(`Demo userId: ${user.id}`);
  console.log(`Try watching: Railway Dhaka → Chattogram, ${daysFromNow(7)}, SNIGDHA (currently 0 seats)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
