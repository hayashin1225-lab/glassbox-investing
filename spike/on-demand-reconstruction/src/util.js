import { createHash } from "node:crypto";

export function stableId(prefix, value) {
  return `${prefix}_${createHash("sha256").update(String(value)).digest("hex").slice(0, 12)}`;
}

export function canonicalJson(value) {
  return JSON.stringify(sortDeep(value), null, 2) + "\n";
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])])
    );
  }
  return value;
}

export function numberFromText(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  const negative = raw.startsWith("(") && raw.endsWith(")");
  const number = Number(raw.replace(/[(),]/g, ""));
  if (!Number.isFinite(number)) return null;
  return negative ? -number : number;
}

export function htmlText(value) {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeUrl(href, base) {
  return new URL(href, base).toString();
}
