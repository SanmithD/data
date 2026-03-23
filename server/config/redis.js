import { createClient } from "redis";

let redisClient;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379"
    });

    redisClient.on("error", (err) =>
      console.log("Redis Error:", err.message)
    );

    await redisClient.connect();

    console.log("Redis Connected");
  } catch (error) {
    console.log("Redis connection failed ❌");
  }
};

export const getRedis = () => redisClient;