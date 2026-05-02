import { createServer } from "node:http";
import path from "node:path";
import "dotenv/config";
import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import { publisher, redis, subscriber } from "./redis-connection";
import authRouter from "./modules/auth/auth.routes";
import checkboxRouter from "./modules/checkbox/checkbox.routes";
import { verifyAccessToken } from "./modules/auth/utils/token";

const CHECKBOX_SIZE = parseInt(process.env.CHECKBOX_SIZE!) || 1000;
const CHECKBOX_STATE_KEY = process.env.CHECKBOX_STATE_KEY! || "checkbox-state";
const RATE_LIMIT_TTL = 6;
const RATE_LIMIT_KEY = (userId: string) =>
  `${process.env.RATE_LIMIT_KEY || "rate-limited"}-${userId}`;

async function main() {
  const PORT = process.env.PORT ?? 8080;
  const app = express();
  const server = createServer(app);
  const io = new Server();

  io.attach(server);

  await subscriber.subscribe("internal-server:checkbox:changed");
  subscriber.on("message", (channel, message) => {
    if (channel === "internal-server:checkbox:changed") {
      const { index, checked } = JSON.parse(message);

      io.emit("server:checkbox:changed", { index, checked });
    }
  });
  // Socket handlers
  io.on("connection", async (socket) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");

    const accessToken = cookies["accessToken"];

    if (!accessToken) {
      return socket.disconnect();
    }

    let userId: string;

    try {
      const user = await verifyAccessToken(accessToken);
      userId = user.sub;
    } catch (error) {
      return socket.disconnect();
    }

    console.log(`Socket connected ${socket.id}`);

    io.emit("server:client:count", { count: io.engine.clientsCount });

    socket.on("disconnect", () => {
      io.emit("server:client:count", { count: io.engine.clientsCount });
    });

    socket.on("client:checkbox:changed", async (data) => {
      console.log(`[Socket: ${socket.id}]`, data);

      const rateLimitKey = RATE_LIMIT_KEY(userId);

      const isRateLimited = await redis.get(rateLimitKey);

      if (isRateLimited)
        return socket.emit("server:error", {
          error: `Please wait`,
          code: "RATE_LIMIT",
        });

      await redis.set(rateLimitKey, "1", "EX", RATE_LIMIT_TTL);

      const existingState = await redis.get(CHECKBOX_STATE_KEY);

      if (existingState) {
        const rawData = JSON.parse(existingState);
        rawData[data.index] = data.checked;
        redis.set(CHECKBOX_STATE_KEY, JSON.stringify(rawData));
      } else {
        redis.set(
          CHECKBOX_STATE_KEY,
          JSON.stringify(new Array(CHECKBOX_SIZE).fill(false)),
        );
      }

      publisher.publish(
        "internal-server:checkbox:changed",
        JSON.stringify(data),
      );
    });
  });

  // Express handlers
  app.use(
    cors({
      origin: [
        `${process.env.IRIS_AUTH_URL!}`,
        `${process.env.BASE_URL_1!}`,
        `${process.env.BASE_URL_2!}`,
      ],
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use("/auth", authRouter);
  app.use("/checkbox", checkboxRouter);

  app.get("/health", (req, res) => {
    res.json({ healthy: true });
  });

  app.get("/", (req, res) => {
    res.sendFile(path.resolve("./public/index.html"));
  });

  app.get("/login", (req, res) => {
    res.sendFile(path.resolve("./public/login.html"));
  });
  app.get("/signup", (req, res) => {
    res.sendFile(path.resolve("./public/signup.html"));
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
