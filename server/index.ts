import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth/index.js";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function main() {
  await setupAuth(app);
  registerAuthRoutes(app);
  registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "../client/dist");
    app.use(express.static(clientDist));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT || "5000");
  app.listen(port, "0.0.0.0", () => {
    console.log(`NFL Pick'em server running on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
