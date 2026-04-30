import { createServer } from "node:http";
import path from "node:path";
import "dotenv/config";
import express from "express";
import { Server } from "socket.io";
import { publisher, redis, subscriber } from "./redis-connection";
import authRouter from "./modules/auth/auth.routes";

const CHECKBOX_SIZE = 1000;
const CHECKBOX_STATE_KEY = "checkbox-state";
const rateLimitingHashMap = new Map();

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
  io.on("connection", (socket) => {
    console.log(`Socket connected ${{ id: socket.id }}`);

    io.emit("server:client:count", { count: io.engine.clientsCount });

    socket.on("disconnect", () => {
      rateLimitingHashMap.delete(socket.id);
      io.emit("server:client:count", { count: io.engine.clientsCount });
    });

    socket.on("client:checkbox:changed", async (data) => {
      console.log(`[Socket: ${socket.id}]`, data);

      const lastOperationTime = rateLimitingHashMap.get(socket.id);
      if (lastOperationTime) {
        const timeElapsed = Date.now() - lastOperationTime;
        if (timeElapsed < 5.5 * 1000) {
          socket.emit("server:error", {
            error: `Please wait`,
            code: "RATE_LIMIT",
          });

          rateLimitingHashMap.set(socket.id, Date.now());
          return;
        }
      }
      rateLimitingHashMap.set(socket.id, Date.now());

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
  // app.use(express.static(path.resolve("./public")));
  app.use("/auth", authRouter);

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

  app.get("/callback", async (req, res) => {
    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const storedState = sessionStorage.getItem("oauth_state");

    if (state !== storedState) {
      res.status(500).json({ error: "Invalid state" });
    }

    sessionStorage.removeItem("oauth_state");

    const response = await fetch("http://localhost:9090/auth/token", {
      method: "POST",
      body: JSON.stringify({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        code,
      }),
    });

    const tokens = await response.json();

    const { accessToken, refreshToken } = tokens as {
      accessToken: string;
      refreshToken: string;
    };

    res.redirect("/");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    localStorage.setItem("accessToken", accessToken);
  });

  app.get("/state", async (req, res) => {
    const existingState = await redis.get(CHECKBOX_STATE_KEY);
    if (existingState) {
      const rawData = JSON.parse(existingState);
      res.json({ checkboxes: rawData });
    } else {
      res.json({ checkboxes: new Array(CHECKBOX_SIZE).fill(false) });
    }
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
