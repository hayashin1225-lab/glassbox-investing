import { ENGINE_VERSION, RULE_SET } from "./constants.js";
import { normalizeNarratives } from "./narrative.js";
import { detectFactNarrativeGaps, findUnknowns, runDetectors } from "./detectors.js";

export function runEngine(input) {
  const evidence = [...input.evidence].sort((a, b) => a.id.localeCompare(b.id));
  const narratives = normalizeNarratives(input.narrative_items, input.retrieved_at);
  const detectors = runDetectors(evidence);
  const gapResult = detectFactNarrativeGaps(detectors, narratives);
  const unknowns = findUnknowns(evidence, input.sources, input.retrieval_log);
  if (narratives.narrative_coverage.independent_public_status === "insufficient") {
    unknowns.push({
      key: "independent_public_narrative",
      status: "insufficient",
      reason: `Independent coverage is ${narratives.narrative_coverage.independent_domain_count} domain(s) / ${narratives.narrative_coverage.independent_cluster_count} cluster(s); no Independent Public Narrative or related gap was generated.`
    });
  }
  const topIssues = routePriorities(gapResult.gaps, detectors, unknowns);
  return {
    schema_version: "issue-14-review-v2",
    engine_version: ENGINE_VERSION,
    rule_set: RULE_SET,
    data_as_of: input.retrieved_at,
    company_identity: input.company_identity,
    search_plan: input.search_plan,
    sources: input.sources,
    evidence,
    narrative_scope: narratives.narrative_scope,
    narrative_coverage: narratives.narrative_coverage,
    narrative_items: narratives.narrative_items,
    narrative_clusters: narratives.narrative_clusters,
    narrative_topics: narratives.narrative_topics,
    issuer_narrative: narratives.issuer_narrative,
    independent_public_narrative: narratives.independent_public_narrative,
    fact_narrative_gaps: gapResult.gaps,
    fact_narrative_gap_assessments: gapResult.assessments,
    detectors,
    unknowns,
    retrieval_log: input.retrieval_log,
    top_issues: topIssues
  };
}

function routePriorities(gaps, detectors, unknowns) {
  const candidates = [
    ...gaps.map((gap, index) => ({
      kind: "fact_narrative_gap",
      ref: gap.id,
      title: gap.statement,
      reason: "Fact–Narrative Gap detected by a versioned rule.",
      priority: 200 - index
    })),
    ...detectors.filter((item) => item.signal === "detected").map((item) => ({
      kind: "detector",
      ref: item.id,
      title: item.summary,
      reason: `${item.type} was detected from traceable evidence.`,
      priority: item.severity
    })),
    ...unknowns.map((item, index) => ({
      kind: "unknown",
      ref: item.key,
      title: `${item.key}: ${item.status === "insufficient" ? "insufficient" : "Unknown"}`,
      reason: item.reason,
      priority: item.key === "independent_public_narrative" ? 150 : 40 - index
    }))
  ];
  const selected = [];
  const seenKinds = new Set();
  for (const candidate of candidates.sort((a, b) => b.priority - a.priority || a.ref.localeCompare(b.ref))) {
    const family = candidate.kind === "detector" ? candidate.ref : candidate.kind;
    if (seenKinds.has(family)) continue;
    selected.push(candidate);
    seenKinds.add(family);
    if (selected.length === 3) break;
  }
  return selected;
}
