import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createDownloadMetadata } from "../src/lib/download-metadata.mjs";

const bytes = Buffer.from("representative download bytes");
const release = {
  shortVersionString: "1.2.7", version: 10,
  pubDate: "Sun, 06 Sep 2026 17:07:06 +0530",
  enclosure: { url: "https://tokage.app/downloads/Tokage.dmg", length: bytes.length },
  releaseNotesLink: "https://tokage.app/release-notes/1.2.7",
  download: {
    minimumMacOS: "15.6",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    notarization: "verified",
  },
};

test("latest release supplies display details and the exact download digest", () => {
  const older = { ...release, pubDate: "2025-01-01", download: undefined };
  const result = createDownloadMetadata([older, release], bytes);
  assert.equal(result.version, "1.2.7");
  assert.equal(result.minimumMacOS, "15.6");
  assert.equal(result.sha256, release.download.sha256);
  assert.equal(result.bytes, bytes.length);
  assert.equal(result.notarizationLabel, "Notarized by Apple");
});

test("changed download bytes cannot inherit verified claims, even at the same size", () => {
  const changed = Buffer.from(bytes);
  changed[0] ^= 1;
  assert.throws(() => createDownloadMetadata([release], changed), /reverify/);
});

test("missing latest metadata cannot silently fall back to an older release", () => {
  const newer = { ...release, pubDate: "2026-11-02", download: undefined };
  assert.throws(() => createDownloadMetadata([release, newer], bytes), /needs verified/);
});

test("appcast size and URL must match the shipped download", () => {
  for (const enclosure of [
    { ...release.enclosure, length: 1 },
    { ...release.enclosure, url: "https://example.com/another.dmg" },
  ]) {
    assert.throws(() => createDownloadMetadata([{ ...release, enclosure }], bytes));
  }
});

test("unknown notarization remains distinct from an explicit negative status", () => {
  for (const [notarization, expected] of [
    ["unknown", "Apple notarization: unverified"],
    ["not-notarized", "Not notarized by Apple"],
  ]) {
    const entry = { ...release, download: { ...release.download, notarization } };
    assert.equal(createDownloadMetadata([entry], bytes).notarizationLabel, expected);
  }
});
