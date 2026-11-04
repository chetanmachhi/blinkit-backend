import mongoose from "mongoose";
import config from "../config/env";
import { DEMO_RIDERS, ensureDemoRiders } from "../services/demoRiders.service";

const run = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI);
    const created = await ensureDemoRiders(config.DEMO_RIDER_PASSWORD);
    console.log(`[SeedRiders] Created ${created}, total demo riders ${DEMO_RIDERS.length}`);
    DEMO_RIDERS.forEach((r) => console.log(`  - ${r.name}: phone ${r.phone}`));
    console.log("  Password: value of DEMO_RIDER_PASSWORD (default Rider@123)");
  } catch (error) {
    console.error("[SeedRiders] Failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    // ts-node-dev keeps watching otherwise
    process.exit(process.exitCode ?? 0);
  }
};

run();
