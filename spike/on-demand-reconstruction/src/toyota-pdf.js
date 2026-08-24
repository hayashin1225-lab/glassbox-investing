import { PDFParse } from "pdf-parse";
import { numberFromText, stableId } from "./util.js";

const VALUE = "([\\d,.()\u2212-]+)";

export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text;
  } finally {
    await parser.destroy();
  }
}

export function parseToyotaQuarterlySummary(text, source) {
  const cleaned = String(text).replace(/\r/g, "");
  const dateMatch = cleaned.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})/);
  const publicationDate = dateMatch ? `${dateMatch[3]}-${String(new Date(`${dateMatch[1]} 1, 2000`).getMonth() + 1).padStart(2, "0")}-${String(dateMatch[2]).padStart(2, "0")}` : null;
  const periodMatch = cleaned.match(/\((April 1, 20\d{2}) through (June 30, 20\d{2})\)/);
  const rows = [...cleaned.matchAll(new RegExp(
    `FY(\\d+) first quarter\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}`,
    "gi"
  ))];

  if (rows.length < 2) {
    throw new Error("Toyota quarterly result table was not recognized; refusing to infer values.");
  }

  const periods = rows.slice(0, 2).map((row) => ({
    fiscal_year: Number(row[1]),
    period: `FY${row[1]} Q1`,
    revenue: numberFromText(row[2]),
    revenue_yoy_percent: numberFromText(row[3]),
    operating_income: numberFromText(row[4]),
    operating_income_yoy_percent: numberFromText(row[5]),
    net_income: numberFromText(row[10]),
    net_income_yoy_percent: numberFromText(row[11])
  }));

  const cashFlowMatch = cleaned.match(new RegExp(
    `Net cash provided by \\(used in\\) operating activities\\s+${VALUE}\\s+${VALUE}`,
    "i"
  ));
  if (!cashFlowMatch) {
    throw new Error("Toyota operating cash-flow row was not recognized; refusing to infer values.");
  }

  // The statement presents prior-year then current-year columns.
  periods[1].operating_cash_flow = numberFromText(cashFlowMatch[1]);
  periods[0].operating_cash_flow = numberFromText(cashFlowMatch[2]);

  const epsStart = cleaned.indexOf("Earnings per share attributable to");
  const firstTableEnd = cleaned.indexOf("(2) Consolidated financial position", epsStart);
  const epsSection = epsStart >= 0 ? cleaned.slice(epsStart, firstTableEnd >= 0 ? firstTableEnd : undefined) : "";
  for (const period of periods) {
    const eps = epsSection.match(new RegExp(`FY${period.fiscal_year} first quarter\\s+([\\d,.]+)\\s+[\\d,.]+`, "i"));
    period.eps = eps ? numberFromText(eps[1]) : null;
  }

  const evidence = [];
  for (const period of periods) {
    for (const [key, unit] of [
      ["revenue", "JPY million"],
      ["operating_income", "JPY million"],
      ["net_income", "JPY million"],
      ["eps", "JPY/share"],
      ["operating_cash_flow", "JPY million"]
    ]) {
      if (period[key] == null) continue;
      evidence.push({
        id: stableId("ev", `${source.id}|${key}|${period.period}`),
        key,
        value: period[key],
        unit,
        period: period.period,
        source_url: source.url,
        source_id: source.id,
        source_type: source.source_type,
        retrieved_at: source.retrieved_at,
        value_kind: "actual",
        extraction_method: "pdf_text_regex:toyota_quarterly_summary_v1"
      });
    }
  }

  const forecast = cleaned.match(new RegExp(
    `Full-year\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}\\s+${VALUE}`,
    "i"
  ));
  if (forecast) {
    const fy = periods[0].fiscal_year;
    for (const [key, valueIndex, yoyIndex, unit] of [
      ["revenue", 1, 2, "JPY million"],
      ["operating_income", 3, 4, "JPY million"],
      ["net_income", 7, 8, "JPY million"],
      ["eps", 9, null, "JPY/share"]
    ]) {
      evidence.push({
        id: stableId("ev", `${source.id}|${key}|FY${fy} forecast`),
        key,
        value: numberFromText(forecast[valueIndex]),
        unit,
        period: `FY${fy} forecast`,
        source_url: source.url,
        source_id: source.id,
        source_type: source.source_type,
        retrieved_at: source.retrieved_at,
        value_kind: "company_forecast",
        extraction_method: "pdf_text_regex:toyota_quarterly_forecast_v1",
        yoy_percent: yoyIndex ? numberFromText(forecast[yoyIndex]) : null
      });
    }
  }
  if (publicationDate) {
    evidence.push({
      id: stableId("ev", `${source.id}|next_or_latest_earnings_date|${publicationDate}`),
      key: "next_or_latest_earnings_date",
      value: publicationDate,
      unit: "ISO-8601 date",
      period: periods[0].period,
      source_url: source.url,
      source_id: source.id,
      source_type: source.source_type,
      retrieved_at: source.retrieved_at,
      value_kind: "actual",
      extraction_method: "pdf_text_regex:publication_date_v1"
    });
  }

  return {
    publication_date: publicationDate,
    covered_period: periodMatch ? `${periodMatch[1]} through ${periodMatch[2]}` : periods[0].period,
    periods,
    evidence
  };
}
