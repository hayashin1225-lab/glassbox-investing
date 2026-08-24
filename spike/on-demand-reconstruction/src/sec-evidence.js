import { stableId } from "./util.js";

const TAGS = {
  revenue: "Revenue",
  operating_income: "ProfitLossFromOperatingActivities",
  net_income: "ProfitLossAttributableToOwnersOfParent",
  operating_cash_flow: "CashFlowsFromUsedInOperatingActivities"
};

export function extractSecEvidence(companyFacts, source) {
  const evidence = [];
  for (const [key, tag] of Object.entries(TAGS)) {
    const fact = companyFacts?.facts?.["ifrs-full"]?.[tag];
    if (!fact) continue;
    const values = Object.entries(fact.units ?? {}).flatMap(([unit, rows]) =>
      rows
        .filter((row) => row.form === "20-F" && row.start && row.end)
        .map((row) => ({ ...row, unit }))
    );
    const unique = new Map();
    for (const value of values.sort((a, b) => a.filed.localeCompare(b.filed))) {
      unique.set(`${value.start}|${value.end}`, value);
    }
    const latest = [...unique.values()].sort((a, b) => b.end.localeCompare(a.end)).slice(0, 2);
    for (const value of latest) {
      evidence.push({
        id: stableId("ev", `${source.id}|${key}|${value.start}|${value.end}`),
        key,
        value: value.val,
        unit: value.unit,
        period: `${value.start}/${value.end}`,
        source_url: source.url,
        source_id: source.id,
        source_type: source.source_type,
        retrieved_at: source.retrieved_at,
        value_kind: "actual",
        extraction_method: `sec_companyfacts:ifrs-full:${tag}`,
        filing_accession: value.accn,
        filed_at: value.filed
      });
    }
  }
  return evidence;
}
