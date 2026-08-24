import test from "node:test";
import assert from "node:assert/strict";
import { classifyNarrativeScope, normalizeNarratives, parseGdeltArticles } from "../spike/on-demand-reconstruction/src/narrative.js";

test("deduplicates titles, caps one-domain weight, and extracts topics deterministically", () => {
  const items = [
    item("1", "Toyota accelerates HEV investment and shareholder returns", "a.example", "2026-08-20"),
    item("2", "Toyota accelerates HEV investment and shareholder returns - Wire", "b.example", "2026-08-20"),
    item("3", "Toyota announces buyback", "a.example", "2026-08-19"),
    item("4", "Toyota treasury stock update", "a.example", "2026-08-18"),
    item("5", "Toyota dividend update", "a.example", "2026-08-17"),
    item("6", "Toyota shareholder return update", "a.example", "2026-08-16")
  ];
  const first = normalizeNarratives(items, "2026-08-24T00:00:00Z");
  const second = normalizeNarratives(items, "2026-08-24T00:00:00Z");
  assert.deepEqual(first, second);
  assert.equal(first.narrative_clusters[0].duplicate_count, 1);
  const returns = first.narrative_topics.find((topic) => topic.topic === "shareholder_returns");
  assert.equal(returns.score, 3); // duplicate cross-domain copies remain one cluster/one vote
  assert.equal(returns.domains.length, 2);
  assert.equal(first.narrative_scope, "independent_public");
  assert.equal(first.narrative_coverage.narrative_scope, "independent_public");
  assert.equal(first.narrative_coverage.independent_public_status, "sufficient");
});

test("issuer-only input reports issuer scope while Independent Public Narrative remains insufficient", () => {
  const result = normalizeNarratives([
    item("1", "Toyota accelerates HEV investment", "global.toyota", "2026-08-20", "issuer"),
    item("2", "Toyota announces shareholder returns", "toyotatimes.jp", "2026-08-19", "issuer")
  ], "2026-08-24T00:00:00Z");
  assert.equal(result.narrative_scope, "issuer");
  assert.equal(result.narrative_coverage.narrative_scope, "issuer");
  assert.equal(result.narrative_coverage.issuer_status, "available");
  assert.equal(result.narrative_coverage.independent_domain_count, 0);
  assert.equal(result.independent_public_narrative.status, "insufficient");
  assert.deepEqual(result.independent_public_narrative.topics, []);
  assert.ok(result.issuer_narrative.topics.length > 0);
  assert.ok(result.narrative_items.every((row) => row.narrative_scope === "issuer"));
});

test("empty input reports insufficient narrative scope", () => {
  const result = normalizeNarratives([], "2026-08-24T00:00:00Z");
  assert.equal(result.narrative_scope, "insufficient");
  assert.equal(result.narrative_coverage.narrative_scope, "insufficient");
  assert.equal(result.narrative_coverage.issuer_status, "empty");
  assert.equal(result.independent_public_narrative.status, "insufficient");
});

test("GDELT items retain issuer origin instead of treating all aggregator results as independent", () => {
  const source = { id: "gdelt", retrieved_at: "2026-08-24T00:00:00Z" };
  const rows = parseGdeltArticles({ articles: [
    { title: "Official update", url: "https://global.toyota/en/ir/x", domain: "global.toyota", seendate: "20260820000000" },
    { title: "Independent analysis", url: "https://news.example/toyota", domain: "news.example", seendate: "20260819000000" }
  ] }, source, ["global.toyota", "toyotatimes.jp"]);
  assert.deepEqual(rows.map((row) => row.narrative_scope), ["issuer", "independent_public"]);
  assert.equal(classifyNarrativeScope("sub.toyotatimes.jp", ["toyotatimes.jp"]), "issuer");
});

function item(id, title, domain, published_at, narrative_scope = "independent_public") {
  return { id, title, domain, published_at, narrative_scope, retrieved_at: "2026-08-24T00:00:00Z", url: `https://${domain}/${id}`, source_id: domain, source_type: "news_metadata" };
}
