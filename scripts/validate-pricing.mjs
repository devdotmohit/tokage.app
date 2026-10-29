import { readCatalog } from "./pricing-catalog.mjs";
const catalog = await readCatalog();
console.log(`Validated pricing ${catalog.revision}: ${Object.keys(catalog.models).length} models`);
