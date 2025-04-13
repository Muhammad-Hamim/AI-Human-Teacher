import mongoose from "mongoose";
import config from "../config";

const dbConnect = async (): Promise<void> => {
  try {
    if (!config.database_url) {
      throw new Error("Database URL is not defined in environment variables");
    }

    await mongoose.connect(config.database_url, {
      serverSelectionTimeoutMS: 60000, // Increase timeout to 60 seconds
      socketTimeoutMS: 45000, // Socket timeout
      connectTimeoutMS: 60000, // Connection timeout
      heartbeatFrequencyMS: 5000, // Heartbeat frequency
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    console.log("🔗 Database connection established");
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error connecting to database:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    } else {
      console.error("❌ Unknown error connecting to database:", error);
    }
    process.exit(1);
  }
};

export default dbConnect;
