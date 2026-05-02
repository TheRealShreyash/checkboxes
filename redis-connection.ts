import Redis from "ioredis";

function createRedisConnection(name: string) {
  const url = process.env.REDIS_URL!;

  const client = url
    ? new Redis(url, {
        maxRetriesPerRequest: null,
        tls: { rejectUnauthorized: false },
      })
    : new Redis({ host: "localhost", port: 6379 });

  client.on("error", (err) => console.error(`[Redis:${name}] Error:`, err));
  client.on("connect", () => console.log(`[Redis:${name}] Connected`));

  return client;
}

export const publisher = createRedisConnection("publisher");
export const subscriber = createRedisConnection("subscriber");
export const redis = createRedisConnection("redis");
