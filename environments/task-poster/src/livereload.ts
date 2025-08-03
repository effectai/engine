import path from "path";
import { fileURLToPath } from "url";
import type { Express } from "express";

export const addLiveReload = async (app: Express) => {
  console.log("LiveReload is enabled");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Dynamic imports
  const livereload = await import("livereload");
  const connectLivereload = await import("connect-livereload");

  // Create LiveReload server
  const liveReloadServer = livereload.default.createServer({
    exts: ["html", "css", "js"],
    debug: true,
  });

  liveReloadServer.watch([
    path.join(__dirname, "..", "public"),
    path.join(__dirname, "..", "src"),
  ]);

  liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
      liveReloadServer.refresh("/");
    }, 100);
  });

  app.use(connectLivereload.default());
};
