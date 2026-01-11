import { defineCollection, z } from "astro:content";

const appcastChannel = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    link: z.string().url(),
    description: z.string(),
    language: z.string().optional().default("en"),
  }),
});

const appcast = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    version: z.union([z.string(), z.number()]),
    shortVersionString: z.string(),
    pubDate: z.string(),
    enclosure: z.object({
      url: z.string().url(),
      length: z.number().int().nonnegative(),
      type: z.string(),
      edSignature: z.string(),
    }),
    releaseNotesLink: z.string().url(),
  }),
});

const releaseNotes = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  appcastChannel,
  appcast,
  "release-notes": releaseNotes,
};
