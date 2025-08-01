import { isHtmx, page, make404, make500, themes } from "./html.js";
import type { Express } from "express";
import { Request } from "express";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addLiveReload } from "./livereload.js";
import { isHtmx, page } from "./html.js";
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
const addVal = (v: string, s?: string) => `value=${v}${v == s ? " selected" : ""}`;

const loggedInPage = (msg = "") => `
<div id="mainpart">
  ${msg ? `<p class="notif" id="messages">${msg}</p>` : ""}


  <fieldset class="box fill">
    <p>Authorized as administrator</p>

    <h3>Connected to manager</h3>
    <small>Manager: ${state.managerId}</small>


    <h3>Change theme</h3>
    <form hx-post="/auth/theme" hx-target="#mainpart">
    <select name="theme" id="theme">
      <option ${addVal("matrix", state.theme)}>Matrix</option>
      <option ${addVal("studio", state.theme)}>Studio</option>
    </select>
    <button type="submit">Save</button>
    </form>
  </fieldset>

  
  <section>	
  <form hx-target="body" hx-post="/auth/logout">
  <button type="submit">Logout</button>
  <a href="/"><button type="button">Show Datasets</button></a>
  </form>
  </section>
</div>
`;

const validKeys = ["0", "0500486958191779"];
const isValidKey = (k: string) => k && validKeys.includes(k);

const getAuthToken = (req: Request) => {
    if (!req.headers.cookie) return null;
    
    const match = req.headers.cookie.match(/(?:^|; )auth_token=([^;]*)/);
    return match ? match[1] : null;
};

export const addAuthRoutes = (app: Express): void => {
  app.get("/auth", async (req, res) => {
    const token = getAuthToken(req);
    if (isValidKey(token!))
      res.send(page(loggedInPage()))
    else
      res.send(page(await loginPage()));
  });

  app.post("/auth", async (req, res) => {
    const { key } = req.body;
  
    if (isValidKey(key)) {
      res.cookie('auth_token', key, {
	secure: true,        // only send cookie over HTTPS on production
	httpOnly: true,      // javascript can not read this cookie
	sameSite: 'strict',  // strict CSRF protection
	maxAge: 3600000,     // expire in an hour
      }).send(`${loggedInPage('Auth successfull')}`);
    } else {
      res.send(await loginPage("Invalid auth"));
    }
  });

  app.post("/auth/logout", async(req, res) => {
    console.log(process.env.NODE_ENV === 'production');
    const token = getAuthToken(req);      
    if (isValidKey(token!)) {
      // expire in the past removes the cookie
      res
	.cookie("auth_token", "", { expires: new Date(0) })
	.header("HX-Refresh", "true").send();

    } else {
      res.send("Not Logged in!")
    }
  });

  app.post("/auth/theme", async (req, res) => {
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
};
