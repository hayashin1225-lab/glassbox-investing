import { DETECTOR_VERSION, REQUIRED_EVIDENCE_KEYS } from "./constants.js";
import { stableId } from "./util.js";

export function runDetectors(evidence) {
  const q1 = actualQuarterPairs(evidence);
  const detectors = [];
  const currentRevenue = q1.revenue?.[0];
  const priorRevenue = q1.revenue?.[1];
  const currentOperating = q1.operating_income?.[0];
  const priorOperating = q1.operating_income?.[1];
  const currentCash = q1.operating_cash_flow?.[0];
  const priorCash = q1.operating_cash_flow?.[1];

  if (currentRevenue && priorRevenue && currentOperating && priorOperating) {
    const revenueChange = percentChange(currentRevenue.value, priorRevenue.value);
    const operatingChange = percentChange(currentOperating.value, priorOperating.value);
    detectors.push(detector({
      type: "revenue_operating_profit_divergence",
      signal: revenueChange > 0 && operatingChange < 0 ? "detected" : "not_detected",
      summary: `Quarterly revenue changed ${formatPct(revenueChange)} while operating income changed ${formatPct(operatingChange)}.`,
      severity: revenueChange > 0 && operatingChange < 0 ? 90 : 20,
      evidence_refs: [currentRevenue.id, priorRevenue.id, currentOperating.id, priorOperating.id],
      confidence_basis: "Company official values for the same quarter year-on-year.",
      failure_modes: ["Quarterly seasonality", "Accounting or consolidation-scope changes", "Currency effects"]
    }));

    const currentMargin = currentOperating.value / currentRevenue.value;
    const priorMargin = priorOperating.value / priorRevenue.value;
    const changePoints = (currentMargin - priorMargin) * 100;
    detectors.push(detector({
      type: "operating_margin_change",
      signal: changePoints < -0.5 ? "detected" : "not_detected",
      summary: `Operating margin moved from ${formatPct(priorMargin * 100)} to ${formatPct(currentMargin * 100)} (${changePoints.toFixed(2)} points).`,
      severity: changePoints < -0.5 ? 85 : 25,
      evidence_refs: [currentRevenue.id, priorRevenue.id, currentOperating.id, priorOperating.id],
      confidence_basis: "Calculated from company official revenue and operating income.",
      failure_modes: ["Financial-services mix", "Segment mix", "One-time costs", "Quarterly seasonality"]
    }));
  }

  if (currentCash && priorCash && currentOperating) {
    const cashChange = percentChange(currentCash.value, priorCash.value);
    const conversion = currentCash.value / currentOperating.value;
    detectors.push(detector({
      type: "operating_cash_flow_pressure",
      signal: cashChange < -20 || conversion < 0.7 ? "detected" : "not_detected",
      summary: `Quarterly operating cash flow changed ${formatPct(cashChange)}; cash flow / operating income was ${conversion.toFixed(2)}x.`,
      severity: cashChange < -20 || conversion < 0.7 ? 80 : 20,
      evidence_refs: [currentCash.id, priorCash.id, currentOperating.id],
      confidence_basis: "Company official quarterly cash-flow statement.",
      failure_modes: ["Working-capital timing", "Tax payment timing", "Financial-services cash-flow structure"]
    }));
  }

  return detectors.sort((a, b) => b.severity - a.severity || a.type.localeCompare(b.type));
}

export function findUnknowns(evidence, sources, retrievalLog) {
  const present = new Set(evidence.map((item) => item.key));
  const unknowns = REQUIRED_EVIDENCE_KEYS.filter((key) => !present.has(key)).map((key) => ({
    key,
    status: "unknown",
    reason: unknownReason(key, retrievalLog),
    attempted_routes: [...new Set(retrievalLog.filter((log) => log.status !== "success").map((log) => log.route))]
  }));
  if (sources.length < 2) {
    unknowns.push({
      key: "independent_source_convergence",
      status: "unknown",
      reason: "Fewer than two successfully retrieved source domains were available."
    });
  }
  return unknowns;
}

export function detectFactNarrativeGaps(detectors, narratives) {
  const divergence = detectors.find((item) => item.type === "revenue_operating_profit_divergence" && item.signal === "detected");
  const gaps = [];
  const issuerTopics = narratives.issuer_narrative.topics;
  const independentTopics = narratives.independent_public_narrative.topics;
  const independentSufficient = narratives.narrative_coverage.independent_public_status === "sufficient";

  gaps.push(...evidenceNarrativeGaps(divergence, issuerTopics, "issuer"));
  if (independentSufficient) {
    gaps.push(...evidenceNarrativeGaps(divergence, independentTopics, "independent_public"));
    gaps.push(...issuerIndependentGaps(issuerTopics, independentTopics));
  }

  const assessments = [
    assessment("evidence_issuer_narrative", "evaluated", gaps, "Issuer Narrative was available and evaluated against Evidence."),
    assessment(
      "evidence_independent_public_narrative",
      independentSufficient ? "evaluated" : "insufficient",
      gaps,
      independentSufficient ? "Independent Public Narrative met the coverage gate." : "Independent Public Narrative did not meet the coverage gate; no gap was generated."
    ),
    assessment(
      "issuer_narrative_independent_public_narrative",
      independentSufficient ? "evaluated" : "insufficient",
      gaps,
      independentSufficient ? "Both narrative layers were available for comparison." : "Independent Public Narrative did not meet the coverage gate; no cross-narrative gap was generated."
    )
  ];
  return { gaps, assessments };
}

function evidenceNarrativeGaps(divergence, topics, scope) {
  if (!divergence) return [];
  const comparisonScope = scope === "issuer" ? "evidence_issuer_narrative" : "evidence_independent_public_narrative";
  const topic = (name) => topics.find((item) => item.topic === name && item.score > 0);
  const gaps = [];
  if (topic("growth")) {
    gaps.push(gap({
      comparisonScope,
      rule: `${scope}_growth_vs_operating_profit_v2`,
      statement: scope === "issuer"
        ? "企業側が強調する成長・投資の物語と、増収でも営業減益となった本業採算を分けて見る必要がある。"
        : "独立した公開Web上の成長・投資の物語と、増収でも営業減益となった本業採算を分けて見る必要がある。",
      divergence,
      topic: topic("growth"),
      scope
    }));
  }
  if (topic("shareholder_returns")) {
    gaps.push(gap({
      comparisonScope,
      rule: `${scope}_shareholder_returns_vs_operating_profit_v2`,
      statement: scope === "issuer"
        ? "企業側が強調する株主還元と、営業利益の減少および還元余力の持続性を分けて確認する必要がある。"
        : "独立した公開Web上の株主還元の物語と、営業利益の減少および還元余力の持続性を分けて確認する必要がある。",
      divergence,
      topic: topic("shareholder_returns"),
      scope
    }));
  }
  return gaps;
}

function issuerIndependentGaps(issuerTopics, independentTopics) {
  const issuerTop = issuerTopics[0];
  const independentTop = independentTopics[0];
  if (!issuerTop || !independentTop || issuerTop.topic === independentTop.topic) return [];
  return [{
    id: stableId("gap", `issuer-independent|${issuerTop.topic}|${independentTop.topic}`),
    comparison_scope: "issuer_narrative_independent_public_narrative",
    narrative_scope: "mixed",
    rule: "issuer_independent_top_topic_divergence_v1",
    statement: `企業側は「${issuerTop.topic}」を、独立した公開Webは「${independentTop.topic}」を最上位論点としており、強調点を分けて確認する必要がある。`,
    evidence_refs: [],
    issuer_narrative_refs: issuerTop.cluster_ids,
    independent_narrative_refs: independentTop.cluster_ids,
    narrative_refs: [...new Set([...issuerTop.cluster_ids, ...independentTop.cluster_ids])],
    confidence_basis: "Comparison of independently normalized deterministic topic rankings.",
    limitations: ["Topic ranking reflects covered public metadata, not investor sentiment."]
  }];
}

function gap({ comparisonScope, rule, statement, divergence, topic, scope }) {
  const issuerRefs = scope === "issuer" ? topic.cluster_ids : [];
  const independentRefs = scope === "independent_public" ? topic.cluster_ids : [];
  return {
    id: stableId("gap", `${comparisonScope}|${rule}|${divergence.id}`),
    comparison_scope: comparisonScope,
    narrative_scope: scope,
    rule,
    statement,
    evidence_refs: divergence.evidence_refs,
    issuer_narrative_refs: issuerRefs,
    independent_narrative_refs: independentRefs,
    narrative_refs: [...issuerRefs, ...independentRefs],
    confidence_basis: "Deterministic scoped topic dictionary plus company-reported year-on-year figures.",
    limitations: scope === "issuer"
      ? ["Issuer Narrative is company-controlled and is not external market narrative."]
      : ["Independent Public Narrative is not a measure of investor sentiment."]
  };
}

function assessment(comparisonScope, status, gaps, reason) {
  return {
    comparison_scope: comparisonScope,
    status,
    gap_ids: gaps.filter((gap) => gap.comparison_scope === comparisonScope).map((gap) => gap.id),
    reason
  };
}

function detector(input) {
  return {
    id: stableId("det", `${DETECTOR_VERSION}|${input.type}|${input.evidence_refs.join("|")}`),
    applicability: "applicable",
    period: "latest available Q1 year-on-year",
    engine_version: DETECTOR_VERSION,
    narrative_refs: [],
    sector_adjustment: "none_in_spike",
    ...input
  };
}

function actualQuarterPairs(evidence) {
  const result = {};
  for (const item of evidence) {
    if (item.value_kind !== "actual" || !/^FY\d+ Q1$/.test(item.period)) continue;
    (result[item.key] ??= []).push(item);
  }
  for (const rows of Object.values(result)) {
    rows.sort((a, b) => Number(b.period.match(/\d+/)?.[0]) - Number(a.period.match(/\d+/)?.[0]));
  }
  return result;
}

function percentChange(current, prior) {
  return prior === 0 ? 0 : ((current - prior) / Math.abs(prior)) * 100;
}

function formatPct(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function unknownReason(key, retrievalLog) {
  if (["per", "pbr", "current_or_last_close", "previous_day_change", "week_52_high", "week_52_low"].includes(key)) {
    return retrievalLog.find((log) => log.route === "licensed_market_data_if_configured")?.reason ?? "No licence-cleared market-data connector was configured.";
  }
  if (key === "next_or_latest_earnings_date") {
    return "The official IR calendar did not expose a confirmed future earnings date in the extracted data. No date was inferred.";
  }
  return "No traceable value was extracted from the retrieved sources.";
}
