import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import streamErrorHandler from "./app/middlewares/streamErrorHandler";
import bodyParser from "body-parser";
import path from "path";

//create express app
const app = express();

// Configure CORS
app.use(
  cors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      // Allow all origins
      callback(null, true);
    },
    credentials: true,
  })
);

//add parser
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Serve static files from dist directory for TTS audio
app.use(
  "/dist",
  express.static(path.join(__dirname, "../dist"), {
    setHeaders: (res, path) => {
      // Set appropriate headers for audio files
      if (path.endsWith(".wav")) {
        res.setHeader("Content-Type", "audio/wav");
        // Allow any origin to access the audio files
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    },
  })
);

//router
app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("AI Human Teacher API");
});

// Streaming error handler (must come before global error handler)
app.use(streamErrorHandler);

// Global error handler
app.use(globalErrorHandler);

// Handle Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API Not Found",
      },
    ],
  });
});

export default app;
