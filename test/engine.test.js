import test from "node:test";
import assert from "node:assert/strict";
import { runEngine } from "../spike/on-demand-reconstruction/src/engine.js";

test("same saved input and rule set produce byte-equivalent review state", () => {
  const input = fixtureInput();
  const first = runEngine(structuredClone(input));
  const second = runEngine(structuredClone(input));
  assert.deepEqual(first, second);
  assert.equal(first.detectors.filter((item) => item.signal === "detected").length, 3);
  assert.ok(first.fact_narrative_gaps.length >= 1);
  assert.ok(first.fact_narrative_gaps.every((gap) => gap.comparison_scope === "evidence_issuer_narrative"));
  assert.equal(first.narrative_scope, "insufficient");
  assert.equal(first.independent_public_narrative.status, "insufficient");
  assert.deepEqual(first.fact_narrative_gap_assessments.map((row) => row.status), ["evaluated", "insufficient", "insufficient"]);
  assert.equal(first.top_issues.length, 3);
  assert.ok(first.unknowns.some((item) => item.key === "current_or_last_close"));
  assert.ok(first.unknowns.some((item) => item.key === "independent_public_narrative" && item.status === "insufficient"));
  assertReferencesResolve(first);
});

test("sufficient independent coverage enables independent and cross-layer gap directions", () => {
  const input = fixtureInput();
  input.sources.push(
    { id: "ind1", url: "https://one.example", source_usage_policy: { status: "test" } },
    { id: "ind2", url: "https://two.example", source_usage_policy: { status: "test" } }
  );
  input.narrative_items.push(
    narrative("n2", "Independent growth outlook for Toyota", "one.example", "independent_public", "ind1"),
    narrative("n3", "Toyota growth investment faces profit pressure", "two.example", "independent_public", "ind2")
  );
  const review = runEngine(input);
  assert.equal(review.narrative_scope, "mixed");
  assert.equal(review.independent_public_narrative.status, "sufficient");
  assert.ok(review.fact_narrative_gaps.some((gap) => gap.comparison_scope === "evidence_independent_public_narrative"));
  assert.deepEqual(review.fact_narrative_gap_assessments.map((row) => row.status), ["evaluated", "evaluated", "evaluated"]);
  assertReferencesResolve(review);
});

function fixtureInput() {
  const rows = [
    ["revenue", 13525400, "FY2027 Q1"], ["revenue", 12253326, "FY2026 Q1"],
    ["operating_income", 1063473, "FY2027 Q1"], ["operating_income", 1166141, "FY2026 Q1"],
    ["operating_cash_flow", 536551, "FY2027 Q1"], ["operating_cash_flow", 1876481, "FY2026 Q1"]
  ];
  return {
    company_identity: { symbol: "7203", name: "Toyota Motor Corporation" },
    search_plan: {},
    retrieved_at: "2026-08-24T00:00:00Z",
    sources: [{ id: "src", url: "https://global.toyota/", source_usage_policy: { status: "uncertain_for_product" } }],
    evidence: rows.map(([key, value, period], index) => ({ id: `ev${index}`, key, value, period, value_kind: "actual", source_id: "src" })),
    narrative_items: [narrative("n1", "Toyota accelerates growth investment and shareholder returns with buyback", "toyotatimes.jp", "issuer", "src")],
    retrieval_log: [{ route: "licensed_market_data_if_configured", status: "blocked", reason: "contract required" }]
  };
}

function narrative(id, title, domain, narrative_scope, source_id) {
  return { id, title, domain, narrative_scope, published_at: "2026-08-07", retrieved_at: "2026-08-24T00:00:00Z", url: `https://${domain}/${id}`, source_id, source_type: narrative_scope === "issuer" ? "company_official" : "news_metadata" };
}

function assertReferencesResolve(review) {
  const evidenceIds = new Set(review.evidence.map((row) => row.id));
  const clusterIds = new Set(review.narrative_clusters.map((row) => row.id));
  const sourceIds = new Set(review.sources.map((row) => row.id));
  for (const row of review.evidence) assert.ok(sourceIds.has(row.source_id));
  for (const detector of review.detectors) detector.evidence_refs.forEach((id) => assert.ok(evidenceIds.has(id)));
  for (const gap of review.fact_narrative_gaps) {
    gap.evidence_refs.forEach((id) => assert.ok(evidenceIds.has(id)));
    gap.issuer_narrative_refs.forEach((id) => assert.ok(clusterIds.has(id)));
    gap.independent_narrative_refs.forEach((id) => assert.ok(clusterIds.has(id)));
  }
}
