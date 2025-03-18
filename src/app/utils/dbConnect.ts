import mongoose from "mongoose";
import config from "../config";

const dbConnect = async (): Promise<void> => {
  try {
    if (!config.database_url) {
      throw new Error("Database URL is not defined in environment variables");
    }

    await mongoose.connect(config.database_url);
    console.log("🔗 Database connection established");
  } catch (error) {
    console.error("❌ Error connecting to database:", error);
    process.exit(1);
  }
};

export default dbConnect;
