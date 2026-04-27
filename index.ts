import { createServer } from "node:http";
import express from "express";
import "dotenv/config";

async function main() {
  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT ?? 8080;

  app.get("/health", (req, res) => {
    res.json({ healthy: true });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main()