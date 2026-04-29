import { createServer } from "node:http";
import path from "node:path";
import "dotenv/config";
import express from "express";
import { Server } from "socket.io";
import { publisher, redis, subscriber } from "./redis-connection";

const CHECKBOX_SIZE = 1000;
const CHECKBOX_STATE_KEY = "checkbox-state";

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

      // state.checkboxes[index] = checked;

      io.emit("server:checkbox:changed", { index, checked });
    }
  });
  // Socket handlers
  io.on("connection", (socket) => {
    console.log(`Socket connected ${{ id: socket.id }}`);
    socket.on("client:checkbox:changed", async (data) => {
      console.log(`[Socket: ${socket.id}]`, data);

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
  app.use(express.static(path.resolve("./public")));

  app.get("/health", (req, res) => {
    res.json({ healthy: true });
  });

  app.get("/", (req, res) => {
    res.sendFile("index.html");
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
