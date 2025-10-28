import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import { isHtmx, make404, make500, page, themes } from "./html.js";
import { addLiveReload } from "./livereload.js";
import * as state from "./state.js";

const loginPage = async (msg = "") => `
<form hx-post="/auth">
  ${msg ? `<p class="notif" id="messages">${msg}</p>` : ""}
  <fieldset class="box narrow">
    <h3>Log in</h3>
    <input
      placeholder="Auth key"
      type="password"
      id="key"
      name="key"/>
      <button type="submit">Login</button>
  </fieldset>
</form>
`;

// little shorthand that selects a value if it matches a string
const addVal = (v: string, s?: string) =>
  `value=${v}${v === s ? " selected" : ""}`;

const loggedInPage = (msg = "") => `
<div id="mainpart">
  ${msg ? `<p class="notif" id="messages">${msg}</p>` : ""}


  <fieldset class="box">
    <h3>Status</h3>

    <p>Authorized as administrator</p>

    <h3>Connected to manager</h3>
    Manager: ${state.managerId}

    <h3>Change theme</h3>
    <form hx-post="/auth/theme" hx-target="#mainpart">
    <select name="theme" id="theme">
      <option ${addVal("matrix", state.theme)}>Matrix</option>
      <option ${addVal("studio", state.theme)}>Studio</option>
      <option ${addVal("tahiti-gold", state.theme)}>Tahiti Gold</option>
      <option ${addVal("pistachio", state.theme)}>Pistachio</option>
    </select>
    <button type="submit">Save</button>
    </form>
  </fieldset>


  <section class="button-bar">
    <form hx-target="body" hx-post="/auth/logout">
      <button type="submit">Logout</button>
    </form>
    <a href="/"><button type="button">Datasets</button></a>
    <a href="/templates"><button type="button">Templates</button></a>
  </section>
</div>
`;

// configure valid auth keys here
// TODO: move to config
const validKeys = (process.env.AUTH_KEYS || "0").split(",");

const isValidKey = (k: string | null) => k && validKeys.includes(k);

const getAuthToken = (req: Request) => {
  if (!req.headers.cookie) return null;

  const match = req.headers.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  return match ? match[1] : null;
};

// auth middleware for Express routes
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getAuthToken(req);
  if (isValidKey(token)) {
    next();
  } else {
    res.status(401).send(page(await loginPage(`Auth Required`)));
  }
};

export const hasAuth = (req: Request) =>
  isValidKey(getAuthToken(req));

export const addAuthRoutes = (app: Express): void => {
  app.get("/auth", async (req, res) => {
    const token = getAuthToken(req);
    if (isValidKey(token!)) res.send(page(loggedInPage()));
    else res.send(page(await loginPage()));
  });

  app.post("/auth", async (req, res) => {
    const { key } = req.body;

    const isProd = (process.env.NODE_ENV === "production");

    if (isValidKey(key)) {
      res
        .cookie("auth_token", key, {
          secure: isProd, // only send cookie over HTTPS on production
          httpOnly: true, // javascript can not read this cookie
          sameSite: "strict", // strict CSRF protection
          maxAge: 3600000, // expire in an hour
        })
        .send(`${loggedInPage("Auth successfull")}`);
    } else {
      res.send(await loginPage("Invalid auth"));
    }
  });

  app.post("/auth/logout", requireAuth, async (req, res) => {
    console.log(process.env.NODE_ENV === "production");
    const token = getAuthToken(req);
    if (isValidKey(token!)) {
      // expire in the past removes the cookie
      res
        .cookie("auth_token", "", { expires: new Date(0) })
        .header("HX-Refresh", "true")
        .send();
    } else {
      res.send("Not Logged in!");
    }
  });

  app.post("/auth/theme", requireAuth, async (req, res) => {
    const { theme } = req.body;
    var msg = `Theme switched to ${theme}`;
    if (themes.has(theme)) {
      state.setTheme(theme);
      res.header("HX-Refresh", "true");
    } else {
      msg = `Invalid theme`;
    }
    res.send(loggedInPage(msg));
  });

  // TODO: manager selection on longer needed? remove
  //   app.get("/select-manager", async (req, res) => {
  //     res.send(
  //       page(`
  // <p>Select a manager:</p>
  // <form action="/m" method="post" hx-post="/m">
  //   <select name="manager" style="width: 100%;">
  //     <option value="${state.managerId}">
  //       /ip4/127.0.0.1/tcp/11995/ws/p2p/12D3K..f9cPb
  //     </option>
  //   </select>

  //   <button style="display: block; margin-left: auto; margin-top: 25px">Continue</button>
  // </form>
  // `),
  //     );
  //   });

  // app.post("/m", (req, res) => {
  //   const dst = `/m/${req.body.manager}`;
  //   if (isHtmx(req)) {
  //     res.setHeader("HX-Redirect", dst);
  //     res.end();
  //   } else {
  //     res.redirect(dst);
  //   }
  // });
};
