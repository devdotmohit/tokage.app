import { readFile } from "node:fs/promises";

const rateKeys = ["input", "cached_input", "output", "cache_write_30m", "cache_write_12h"];
const tiers = new Set(["standard", "batch", "flex", "fast", "ultrafast"]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const requireValue = (condition, message) => {
  if (!condition) throw new Error(`Invalid pricing catalog: ${message}`);
};

export function validateCatalog(catalog) {
  requireValue(object(catalog), "expected a JSON object");
  requireValue(catalog.schema_version === 1, "unsupported schema_version");
  requireValue(/^\d{4}-\d{2}-\d{2}\.\d+$/.test(catalog.revision ?? ""), "invalid revision");
  for (const field of ["published_at", "verified_at"]) {
    requireValue(typeof catalog[field] === "string" && Number.isFinite(Date.parse(catalog[field])), `invalid ${field}`);
  }
  requireValue(catalog.pricing_basis === "current_api_list_prices", "unsupported pricing basis");
  requireValue(catalog.currency === "USD" && catalog.unit_tokens === 1_000_000, "invalid units");
  requireValue(Number.isSafeInteger(catalog.long_context_above_input_tokens) && catalog.long_context_above_input_tokens > 0, "invalid context threshold");
  requireValue(catalog.unknown_model_policy === "unavailable" && catalog.unknown_service_tier_policy === "unavailable", "unknown prices must be unavailable");
  requireValue(Array.isArray(catalog.sources) && catalog.sources.length > 0 && catalog.sources.every((url) => typeof url === "string" && url.startsWith("https://developers.openai.com/")), "missing official sources");
  requireValue(Array.isArray(catalog.notes) && catalog.notes.every((note) => typeof note === "string"), "invalid notes");
  requireValue(object(catalog.service_tier_aliases), "invalid tier aliases");
  for (const [alias, tier] of Object.entries(catalog.service_tier_aliases)) {
    requireValue(alias.length > 0 && alias !== "auto" && tiers.has(tier), `invalid tier alias ${alias}`);
  }
  requireValue(object(catalog.models) && Object.keys(catalog.models).length > 0, "no models");
  for (const [id, model] of Object.entries(catalog.models)) {
    requireValue(/^[a-z0-9][a-z0-9.-]+$/.test(id) && object(model), `invalid model ${id}`);
    requireValue(typeof model.display_name === "string" && model.display_name.length > 0, `${id}: missing name`);
    requireValue(typeof model.source_url === "string" && model.source_url.startsWith("https://developers.openai.com/"), `${id}: missing source`);
    requireValue(object(model.service_tiers) && object(model.service_tiers.standard), `${id}: missing Standard rates`);
    for (const [tier, contexts] of Object.entries(model.service_tiers)) {
      requireValue(tiers.has(tier) && object(contexts), `${id}: invalid tier ${tier}`);
      for (const context of ["short_context", "long_context"]) {
        const rates = contexts[context];
        requireValue(object(rates), `${id}/${tier}: missing ${context}`);
        requireValue(Object.keys(rates).length === rateKeys.length, `${id}/${tier}/${context}: unexpected rate fields`);
        for (const key of rateKeys) {
          requireValue(Number.isFinite(rates[key]) && rates[key] >= 0, `${id}/${tier}/${context}: invalid ${key}`);
        }
        requireValue(rates.cached_input <= rates.input, `${id}/${tier}/${context}: cache rate exceeds input`);
      }
    }
  }
  return catalog;
}

export async function readCatalog(url = new URL("../public/pricing/v1.json", import.meta.url)) {
  return validateCatalog(JSON.parse(await readFile(url, "utf8")));
}
