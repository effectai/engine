import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: "page",
      source: "news/**/*.md",
      schema: z.object({
        author: z.string(),
        created: z.string(),
        lastUpdated: z.string(),
        image: z.object({
          src: z.string(),
        }),
        // Optional background for the post's title area; defaults to /img/blog-header.png
        headerImage: z.string().optional(),
        published: z.boolean(),
      }),
    }),
  },
});
