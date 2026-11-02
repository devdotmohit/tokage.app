import { createHash } from "node:crypto";

// The content schema validates release fields. Bind the latest release's
// manually verified compatibility and notarization claims to the shipped bytes.
export function createDownloadMetadata(releases, bytes) {
  const release = [...releases].sort(
    (a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate),
  )[0];
  if (!release?.download) {
    throw new Error("The latest release needs verified download metadata.");
  }
  if (release.enclosure.url !== "https://tokage.app/downloads/Tokage.dmg") {
    throw new Error("The latest release must point to the shipped Tokage.dmg.");
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== release.download.sha256) {
    throw new Error("Tokage.dmg changed: reverify and update its download metadata.");
  }
  if (bytes.length !== release.enclosure.length) {
    throw new Error("Tokage.dmg size does not match the latest appcast enclosure.");
  }
  const notarizationLabels = {
    verified: "Notarized by Apple",
    "not-notarized": "Not notarized by Apple",
    unknown: "Apple notarization: unverified",
  };
  return {
    version: release.shortVersionString,
    build: String(release.version),
    url: "/downloads/Tokage.dmg",
    releaseNotesLink: release.releaseNotesLink,
    minimumMacOS: release.download.minimumMacOS,
    size: `${(bytes.length / 1_000_000).toFixed(2)} MB`,
    bytes: bytes.length,
    sha256,
    notarizationLabel: notarizationLabels[release.download.notarization],
  };
}
