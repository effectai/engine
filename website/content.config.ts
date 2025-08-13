import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: "page",
      source: "**/*.md",
      schema: z.object({
        author: z.string(),
        lastUpdated: z.string(),
        image: z.object({
          src: z.string(),
        }),
        published: z.boolean(),
      }),
    }),
  },
});
