import { assert, describe, expect, test } from "vitest";
import { initApplicationLayer } from "../src/main";
import type { Step } from "../src/types";
import { HelloWorldApp } from "../src/constants/example";

//a valid task on protocol level would have to contain the applicationId and the templateId

describe("application", () => {
  test("registers an application", async () => {
    const { register, load } = initApplicationLayer();
    register(HelloWorldApp);

    //load the application
    const app = await load(HelloWorldApp.name);

    expect(app.name).toBe(HelloWorldApp.name);
  });
});
