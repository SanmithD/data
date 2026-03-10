import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://127.0.0.1:7000"
});

redisClient.on("connect", () => {
  console.error("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

export const connectRedis = async () => {
  await redisClient.connect();
};

export default redisClient;