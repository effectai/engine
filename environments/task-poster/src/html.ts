import type { Request } from "express";

export const isHtmx = (req: Request): boolean => !!req.headers["hx-request"];

export const page = (body: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTMX + TypeScript + Node.js Example</title>
  <!-- Include HTMX from CDN -->
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <link rel="stylesheet" href="/css/style.css">
  <style>

  </style>
</head>
<body>
  <h1><a href="/">Task Terminal</a></h1>
  ${body}

</body>
</html>
`;
