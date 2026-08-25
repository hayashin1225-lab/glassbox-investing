export function renderReport(review) {
  const lines = [
    `# Glassbox 30-second review: ${review.company_identity.symbol} ${review.company_identity.name}`,
    "",
    `- Data as of: ${review.data_as_of}`,
    `- Engine / Rule Set: ${review.engine_version} / ${review.rule_set}`,
    "- Boundary: research support only; no Buy / Sell conclusion.",
    "",
    "## Three points to inspect now",
    ""
  ];
  review.top_issues.forEach((item, index) => lines.push(`${index + 1}. ${item.title} — ${item.reason}`));
  lines.push("", "## Fact–Narrative Gap", "");
  if (review.fact_narrative_gaps.length) {
    review.fact_narrative_gaps.forEach((gap) => lines.push(
      `- [${gap.comparison_scope}] ${gap.statement} (${refs(gap)})`
    ));
  } else {
    lines.push("- No deterministic gap rule fired. This is not evidence that no gap exists.");
  }
  lines.push("", "### Gap direction coverage", "");
  review.fact_narrative_gap_assessments.forEach((assessment) =>
    lines.push(`- ${assessment.comparison_scope}: ${assessment.status} — ${assessment.reason}`)
  );

  const coverage = review.narrative_coverage;
  lines.push("", "## Narrative Coverage", "",
    `- narrative_scope: ${review.narrative_scope}`,
    `- Issuer Narrative: ${coverage.issuer_status}; ${coverage.issuer_domain_count} domain(s), ${coverage.issuer_cluster_count} cluster(s)`,
    `- Independent Public Narrative: ${coverage.independent_public_status}; ${coverage.independent_domain_count} domain(s), ${coverage.independent_cluster_count} cluster(s)`,
    `- Original clusters: ${coverage.original_cluster_count}`,
    `- Covered period: ${coverage.covered_period ? `${coverage.covered_period.from} to ${coverage.covered_period.to}` : "Unknown"}`
  );

  lines.push("", "## Issuer Narrative", "");
  if (review.issuer_narrative.topics.length) appendTopics(lines, review.issuer_narrative.topics);
  else lines.push("- No issuer topic could be established from the retrieved metadata.");

  lines.push("", "## Independent Public Narrative", "");
  if (review.independent_public_narrative.status !== "sufficient") {
    lines.push("- insufficient — independent coverage did not pass the deterministic gate; no Public Narrative was generated from issuer material.");
  } else {
    appendTopics(lines, review.independent_public_narrative.topics);
  }
  lines.push("", "## Unknowns", "");
  review.unknowns.forEach((unknown) => lines.push(`- ${unknown.key}: ${unknown.reason}`));
  lines.push("", "## Major sources", "");
  review.sources.forEach((source) => lines.push(
    `- [${source.source_type}] ${source.url} — role: ${source.source_role ?? "unspecified"}; narrative_scope: ${source.narrative_scope ?? "not_applicable"}; policy: ${source.source_usage_policy.status}`
  ));
  lines.push("", "## Retrieval failures / constraints", "");
  review.retrieval_log.filter((row) => row.status !== "success").forEach((row) =>
    lines.push(`- ${row.route}: ${row.status} — ${row.reason}`)
  );
  lines.push("", "All references and structured records are in `review.json`.", "");
  return lines.join("\n");
}

function appendTopics(lines, topics) {
  topics.slice(0, 8).forEach((topic) =>
    lines.push(`- ${topic.topic}: score ${topic.score.toFixed(3)}, ${topic.cluster_ids.length} normalized cluster(s), ${topic.domains.length} domain(s)`)
  );
}

function refs(gap) {
  return [
    `evidence: ${gap.evidence_refs.join(", ") || "none"}`,
    `issuer clusters: ${gap.issuer_narrative_refs.join(", ") || "none"}`,
    `independent clusters: ${gap.independent_narrative_refs.join(", ") || "none"}`
  ].join("; ");
}
