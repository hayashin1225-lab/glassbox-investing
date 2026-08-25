import test from "node:test";
import assert from "node:assert/strict";
import { renderPreview } from "../spike/on-demand-reconstruction/src/preview.js";

test("renders the same preview bytes from the same review", () => {
  const review = fixtureReview();
  const first = renderPreview(review);
  const second = renderPreview(structuredClone(review));
  assert.equal(first, second);
  assert.match(first, /いま見るべき3点/);
  assert.match(first, /Fundamental · 主要数値/);
  assert.match(first, /Evidence Detector · 検出結果/);
  assert.match(first, /Fact–Narrative Gap · 照合結果/);
  assert.match(first, /Sources \/ Provenance · 出典/);
  assert.match(first, /narrative_scope[\s\S]*issuer/);
  assert.match(first, /独立した外部の語り[\s\S]*insufficient/);
  assert.match(first, /href="https:\/\/example\.com\/filing"/);
});

test("escapes review text and rejects unsafe source protocols", () => {
  const review = fixtureReview();
  review.top_issues[0].title = '<script>alert("x")</script>';
  review.sources[0].url = "javascript:alert(1)";
  const html = renderPreview(review);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /href="#"/);
});

function fixtureReview() {
  return {
    company_identity: { symbol: "7203", name: "Toyota Motor Corporation", name_ja: "トヨタ自動車" },
    data_as_of: "2026-08-24T14:20:59.151Z",
    engine_version: "spike-2026.3",
    rule_set: "issue-14-v3",
    narrative_scope: "issuer",
    narrative_coverage: {
      narrative_scope: "issuer",
      issuer_status: "available",
      issuer_domain_count: 2,
      issuer_cluster_count: 20,
      independent_public_status: "insufficient",
      independent_domain_count: 0,
      independent_cluster_count: 0
    },
    top_issues: [
      { title: "企業側の成長物語と営業減益を分けて見る。", reason: "Fact–Narrative Gap detected by a versioned rule." },
      { title: "Independent Public Narrative: insufficient", reason: "Independent coverage is insufficient." },
      { title: "売上と営業利益の方向が異なる。", reason: "Detector result." }
    ],
    evidence: [
      { id: "ev1", key: "revenue", period: "FY2027 Q1", value: 13525400, unit: "JPY million", value_kind: "actual", source_id: "src1" },
      { id: "ev2", key: "operating_income", period: "FY2027 Q1", value: 1063473, unit: "JPY million", value_kind: "actual", source_id: "src1" }
    ],
    detectors: [{ signal: "detected", type: "revenue_operating_profit_divergence", summary: "Revenue rose while operating income fell.", period: "FY2027 Q1", evidence_refs: ["ev1", "ev2"] }],
    issuer_narrative: { status: "available", topics: [{ topic: "growth", score: 1, cluster_ids: ["cluster1"], domains: ["example.com"] }] },
    independent_public_narrative: { status: "insufficient", topics: [] },
    fact_narrative_gaps: [{ comparison_scope: "evidence_issuer_narrative", statement: "企業側の成長物語と営業減益を分けて見る。", evidence_refs: ["ev1", "ev2"], issuer_narrative_refs: ["cluster1"], independent_narrative_refs: [] }],
    fact_narrative_gap_assessments: [{ comparison_scope: "evidence_issuer_narrative", status: "evaluated", reason: "Issuer Narrative was available." }],
    unknowns: [{ key: "current_or_last_close", status: "unknown", reason: "Licensed price source is not configured." }],
    sources: [{ id: "src1", domain: "example.com", url: "https://example.com/filing", source_type: "company_official", source_role: "evidence_origin", retrieved_at: "2026-08-24T14:20:59.151Z", source_usage_policy: { status: "uncertain_for_product" } }],
    retrieval_log: [{ route: "licensed_market_data", status: "blocked", reason: "Contract required." }]
  };
}
