import type { Request, Response } from "express";
import { theme as curTheme } from "./state.js";

export const isHtmx = (req: Request): boolean => !!req.headers["hx-request"];

export const themes: Map<string, string> = new Map([
  ["matrix", ""],
  ["studio", ":root {--background: #f7f4ff;  --foreground: #403352;  --accent: #6f49ab;  --light-bg: color-mix(in srgb, var(--background) 95%, white); }"],
  ["tahiti-gold", ":root {--background: #fffbf7; --foreground: #45372b; --accent: #df7020; }"],
  ["pistachio", ":root {--background: #1d2021; --foreground: #ebdbb2; --accent: #8ec07c;}"]
]);

export const page = (body: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Terminal - Effect</title>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <link rel="stylesheet" href="/css/style.css">
  ${curTheme ? `<style>${themes.get(curTheme || "default")}</style>` : ``}
  <style>

  </style>
</head>
<body>
  <header>
    <h1><a href="/">Task Terminal</a></h1>
  </header>
  ${body}

</body>
</html>
`;

export const make404 = (res: Response) => {
  res.status(404);
  res.send(page(`<h1>404</h1><h2>Not Found</h2>`));
  res.end();
};

export const make500 = (res: Response) => {
  res.status(500);
  res.send(page(`<h1>500</h1><h2>Server Error</h2>`));
  res.end();
};
