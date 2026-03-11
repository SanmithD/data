import cors from 'cors';
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
// import { connectRedis } from './config/redis.js';
import cardRoutes from "./routes/cardRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://data-beta-six.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

connectDB();
// await connectRedis();

app.use("/api", cardRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});