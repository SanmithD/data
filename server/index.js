import cors from 'cors';
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import { connectRedis } from './config/redis.js';
import cardRoutes from "./routes/cardRoutes.js";
import timeRouter from './routes/timelineCardRoutes.js';
import pageTitleRouter from './routes/pageTitleRoutes.js';
import heroSliderRoutes from './routes/heroSliderRoutes.js';
import timelineDetailRoutes from './routes/timelineDetailRoutes.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "https://data-beta-six.vercel.app",
    "https://data-ochre-six.vercel.app",
    "https://data-e2zh.vercel.app",
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get('/', (req, res) => {
  res.send({
    message: "Hello world"
  })
})

app.use("/api", cardRoutes);
app.use("/api", timeRouter);
app.use("/api/page", pageTitleRouter);
app.use("/api/hero-slider", heroSliderRoutes);
app.use("/api/timeline-detail", timelineDetailRoutes);

const PORT = process.env.PORT;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();