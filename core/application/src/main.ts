import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import type { EffectApplication } from "./types";
import { z } from "zod";

const SAFE_KEY_RE = /^[a-zA-Z0-9._-]+$/;

export const EffectApplicationSchema: z.ZodType<EffectApplication> = z.object({
  name: z
    .string()
    .min(1, "name is required")
    .regex(SAFE_KEY_RE, "name may only contain letters, numbers, ., _, -"),
  peerId: z.string().min(1, "peerId is required"),
  createdAt: z.number().int().nonnegative(),
  url: z.string().url("url must be a valid URL"),
  description: z.string().max(500).optional(),
  icon: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  steps: z.array(
    z.object({
      templateId: z.string().min(1, "templateId is required"),
      description: z.string().max(500).optional(),
      capabilities: z.array(z.string()).optional(),
      delegation: z.enum(["round-robin", "random", "single", "all"]).optional(),
      type: z.enum(["html", "docker", "python", "bash", "text"]),
      data: z.string().min(1, "data is required"),
      createdAt: z.number().int().nonnegative(),
    }),
  ),
  updatedAt: z.number().int().nonnegative(),
});

export function verifyApplication(
  input: unknown,
): { ok: true; data: EffectApplication } | { ok: false; errors: string[] } {
  const parsed = EffectApplicationSchema.safeParse(input);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );

    return { ok: false, errors };
  }

  return { ok: true, data: parsed.data };
}

export function assertValidApplication(input: unknown): EffectApplication {
  return EffectApplicationSchema.parse(input);
}

export const initApplicationLayer = () => {
  //initialize the application manager
  const storage = createStorage();
  storage.mount("output", fsDriver({ base: "./tmp/application/output" }));

  //register a new application
  const register = async (application: EffectApplication) => {
    const result = verifyApplication(application);

    if (!result.ok) {
      throw new Error(`Invalid application: ${result.errors.join(", ")}`);
    }

    //TODO:: match on-chain values when they become available
    await storage.setItem(application.name, application);
  };

  const update = async (appId: string, newApplication: EffectApplication) => {
    const result = verifyApplication(newApplication);

    if (!result.ok) {
      throw new Error(`Invalid application: ${result.errors.join(", ")}`);
    }

    const app = await storage.getItem<EffectApplication>(appId);

    if (!app) throw new Error("Application not found");
    newApplication.updatedAt = Date.now();

    await storage.setItem(`output/${appId}`, newApplication);
    return newApplication;
  };

  //load an application by name
  const load = async (appId: string) => {
    const app = await storage.getItem<EffectApplication>(appId);

    if (!app) throw new Error("Application not found");
    return app;
  };

  return { register, update, load };
};
