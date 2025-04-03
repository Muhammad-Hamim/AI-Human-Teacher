/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */
import { createServer } from "http";
import app from "./app";
import config from "./app/config";
import dbConnect from "./app/utils/dbConnect";
import { Server } from "socket.io";
import { initAIServices } from "./app/AI";
import path from "path";
import express from "express";
import ServerConfig from "./app/config/server.config";
import SpeechService from "./app/AI/services/speech.service";
import { AIFactory } from "./app/AI/aifactory/AIFactory";

async function main() {
  try {
    // Connect to database
    await dbConnect();

    // Initialize the AI Factory with poem database regardless of environment variable
    // This ensures poem access works even if the variable isn't set
    process.env.POETRY_TRAINING = "true";
    console.log("Explicitly enabling poetry training");
    await AIFactory.initialize();

    // Serve static files from 'dist' directory
    app.use("/dist", express.static(path.join(__dirname, "../dist")));

    // Create HTTP server
    const server = createServer(app);

    // Create Socket.IO server
    const io = new Server(server, {
      cors: {
        origin: ["http://localhost:5173"],
        credentials: true,
      },
    });

    // Start server
    server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);

      // Get server base URL
      const serverBaseUrl = ServerConfig.getServerBaseUrl(
        typeof config.port === "string"
          ? parseInt(config.port, 10)
          : config.port
      );
      console.log(`📢 Server accessible at: ${serverBaseUrl}`);

      // Set server URL for audio files
      SpeechService.setServerBaseUrl(serverBaseUrl);

      // Initialize AI services
      initAIServices(server, io);
    });

    // Handle server errors
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
