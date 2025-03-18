import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";

//create express app
const app = express();

//add parser
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

//router
app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

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
