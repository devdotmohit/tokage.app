import { getCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDownloadMetadata } from "./download-metadata.mjs";

export async function getLatestDownload() {
  const [entries, bytes] = await Promise.all([
    getCollection("appcast"),
    readFile(resolve("public/downloads/Tokage.dmg")),
  ]);
  return createDownloadMetadata(entries.map(({ data }) => data), bytes);
}
