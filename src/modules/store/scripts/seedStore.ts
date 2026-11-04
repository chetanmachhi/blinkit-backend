import mongoose from "mongoose";
import { User, Store, Role, StoreRole, hashPassword } from "../../../shared";
import config from "../config/env";

const seedStore = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("[SeedStore] Connected to MongoDB");

    let store = await Store.findById(config.DEFAULT_STORE_ID);
    if (!store) {
      store = await Store.findOne({ isActive: true });
    }

    if (!store) {
      console.error(
        "[SeedStore] Error: No store found in database. Run the customer backend seed first."
      );
      process.exit(1);
    }

    const ownerEmail = config.STORE_OWNER_EMAIL.toLowerCase().trim();
    const ownerPassword = config.STORE_OWNER_PASSWORD;
    if (!ownerPassword) {
      console.error("[SeedStore] STORE_OWNER_PASSWORD is required to seed the store owner.");
      process.exit(1);
    }
    const ownerHash = await hashPassword(ownerPassword);

    let owner = await User.findOne({ email: ownerEmail });
    if (!owner) {
      owner = await User.create({
        name: "Store Owner",
        phone: "9888888888",
        email: ownerEmail,
        passwordHash: ownerHash,
        role: Role.ADMIN,
        storeRole: StoreRole.OWNER,
        storeIds: [store._id],
        isActive: true,
        isPhoneVerified: true,
      });
      console.log(`[SeedStore] Created Store Owner: ${owner.email}`);
    } else {
      owner.role = Role.ADMIN;
      owner.storeRole = StoreRole.OWNER;
      owner.passwordHash = ownerHash;
      if (!owner.storeIds.some((id) => id.toString() === store!._id.toString())) {
        owner.storeIds.push(store._id);
      }
      owner.isActive = true;
      await owner.save();
      console.log(`[SeedStore] Updated Store Owner: ${owner.email}`);
    }

    const staffEmail = "staff@blinkit.com";
    const staffPassword = "Staff@123456";
    const staffHash = await hashPassword(staffPassword);

    let staff = await User.findOne({ email: staffEmail });
    if (!staff) {
      staff = await User.create({
        name: "Vadodara Staff Member",
        phone: "9777777777",
        email: staffEmail,
        passwordHash: staffHash,
        role: Role.ADMIN,
        storeRole: StoreRole.STAFF,
        storeIds: [store._id],
        isActive: true,
        isPhoneVerified: true,
      });
      console.log(`[SeedStore] Created Store Staff: ${staff.email}`);
    } else {
      staff.role = Role.ADMIN;
      staff.storeRole = StoreRole.STAFF;
      staff.passwordHash = staffHash;
      if (!staff.storeIds.some((id) => id.toString() === store!._id.toString())) {
        staff.storeIds.push(store._id);
      }
      staff.isActive = true;
      await staff.save();
      console.log(`[SeedStore] Updated Store Staff: ${staff.email}`);
    }

    console.log("==================================================");
    console.log("STORE CREDENTIALS READY:");
    console.log(`Store: ${store.name} (${store._id})`);
    console.log(`Owner: Email: ${ownerEmail} | Password: ${ownerPassword}`);
    console.log(`Staff: Email: ${staffEmail} | Password: ${staffPassword}`);
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[SeedStore] Seed failed:", error);
    process.exit(1);
  }
};

seedStore();
