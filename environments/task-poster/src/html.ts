import type { Request, Response } from "express";


export const isHtmx = (req: Request): boolean => !!req.headers["hx-request"];

export const page = (body: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Terminal - Effect</title>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <link rel="stylesheet" href="/css/style.css">
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
