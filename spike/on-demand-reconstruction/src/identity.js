import { readFile } from "node:fs/promises";

const catalogUrl = new URL("../catalog/companies.json", import.meta.url);

export async function resolveIdentity(symbol, catalogPath = catalogUrl) {
  const normalized = String(symbol ?? "").trim().toUpperCase();
  if (!/^[0-9A-Z.-]{1,16}$/.test(normalized)) {
    throw new Error(`Invalid symbol: ${symbol}`);
  }

  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const identity = catalog[normalized];
  if (!identity) {
    throw new Error(
      `Unknown symbol ${normalized}. Add a source-routed identity entry to ${catalogPath.pathname ?? catalogPath}.`
    );
  }
  return structuredClone(identity);
}
