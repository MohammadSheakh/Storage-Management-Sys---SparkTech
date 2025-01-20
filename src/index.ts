import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import bodyParser from "body-parser";

import path from "path";
import cookieParser from "cookie-parser";
import router from "./routes";
import connectToMongoDB from "./config/MongoDBConfig";

dotenv.config();

const app = express();
app.use(express.json());

app.use(bodyParser.json());

app.use(
  cors()
  //   {
  //   credentials: true,
  // }
);
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  // res.status(200).json({ status: "UP" });

  const htmlPath = path.join(__dirname, "../src/views/index.html");
  res.sendFile(htmlPath);
});

const port = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not defined");
}
connectToMongoDB(process.env.MONGO_URL);

app.use("/", router());

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Not Found",
      code: 404,
    },
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message,
      code: err.status || 500,
    },
  });
});
