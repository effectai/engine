import { createRequestHandler } from "@remix-run/express";
import { NextFunction, Request, Response } from "express";
import path from "node:path";
import { ManagerContext } from "../main";

export const setupManagerDashboard = async ({
  context,
}: {
  context: ManagerContext;
}) => {
  const username = "admin";
  const password = process.env.MANAGER_DASHBOARD_PASSWORD || "admin";

  function basicAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Remix App"');
      return res.status(401).send("Authentication required.");
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii",
    );
    const [inputUser, inputPass] = credentials.split(":");

    if (inputUser === username && inputPass === password) {
      return next();
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="Remix App"');
    return res.status(401).send("Invalid credentials.");
  }

  async function setupRemix(app: any, context: ManagerContext) {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);

    const build = await import(
      require.resolve("../admin/build/server/index.js")
    );

    const remixHandler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV,
      getLoadContext: () => context,
    });

    app.use((req: any, _res: any, next: any) => {
      (req as any).remixContext = context;
      next();
    });

    app.all("*", remixHandler);
  }

  //init express server
  const express = await import("express");
  const cors = await import("cors");

  const app = express.default();
  app.use(cors.default());
  app.use(basicAuth);

  app.use(
    express.default.static(path.join(__dirname, "../admin/build/client")),
  );

  app.get("/favicon.ico", (_req: any, res: any) => {
    res.status(204).end();
  });

  app.use(express.default.json());

  setupRemix(app, context);

  const server = app.listen(9000, () => {
    console.log("Manager Dashboard started on port 9000");
  });

  const tearDown = async () => {
    console.log("Tearing down manager dashboard");
    server.close();
  };

  return { tearDown };
};
