import express from "express";
import cors from "cors";
import router from "./routes";

//create express app
const app = express();

//add parser
app.use(express.json());
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

export default app;
