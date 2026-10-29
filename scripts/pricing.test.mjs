import assert from "node:assert/strict";
import test from "node:test";
import { readCatalog, validateCatalog } from "./pricing-catalog.mjs";

const catalog = await readCatalog();

test("published rates distinguish models, service tiers and long context", () => {
  const astra = catalog.models["gpt-6-astra"].service_tiers;
  const sol = catalog.models["gpt-6.1-sol"].service_tiers;
  assert.equal(astra.standard.short_context.cached_input, 1);
  assert.equal(sol.standard.short_context.cached_input, 0.1);
  assert.equal(astra.fast.short_context.cached_input, 2);
  assert.equal(sol.fast.short_context.cached_input, 0.2);
  assert.equal(astra.standard.long_context.input, 20);
  assert.equal(astra.standard.long_context.output, 75);
  assert.equal(sol.ultrafast.long_context.output, 90);
  assert.equal(catalog.long_context_above_input_tokens, 272_000);
  assert.equal(catalog.service_tier_aliases.priority, "fast");
  assert.equal(catalog.service_tier_aliases.auto, undefined);
  assert.equal(catalog.models["gpt-6-luna"].service_tiers.ultrafast, undefined);
});

test("cached-token examples reproduce the investigated costs", () => {
  const astra = catalog.models["gpt-6-astra"].service_tiers.standard.short_context;
  const sol = catalog.models["gpt-6.1-sol"].service_tiers.standard.short_context;
  const price = (tokens, rate) => tokens * rate / catalog.unit_tokens;
  assert.equal(price(7_240_576, astra.cached_input).toFixed(2), "7.24");
  assert.equal((price(224_007_040, astra.cached_input) + price(420_797_440, sol.cached_input)).toFixed(2), "266.09");
});

test("invalid downloaded catalogs are rejected", () => {
  for (const value of [null, [], "<!doctype html>"]) assert.throws(() => validateCatalog(value));
  for (const value of [-1, NaN, Infinity, "1", null, undefined]) {
    const invalid = structuredClone(catalog);
    invalid.models["gpt-6-astra"].service_tiers.standard.short_context.cached_input = value;
    assert.throws(() => validateCatalog(invalid));
  }
  const missing = structuredClone(catalog);
  delete missing.models["gpt-6-astra"].service_tiers.standard.long_context;
  assert.throws(() => validateCatalog(missing));
  assert.throws(() => validateCatalog({ ...catalog, schema_version: 2 }));
  assert.throws(() => validateCatalog({ ...catalog, models: {} }));
});
