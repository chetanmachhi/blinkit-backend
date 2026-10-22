import mongoose from "mongoose";
import config from "./env";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("[DB] Connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
