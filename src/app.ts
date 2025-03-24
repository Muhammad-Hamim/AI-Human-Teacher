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

// CORS configuration with more flexible options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
    ];

    // Check if the origin is allowed
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV !== "production"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  exposedHeaders: ["Content-Type", "Content-Length", "Content-Disposition"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

//add parser
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cors(corsOptions));

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
