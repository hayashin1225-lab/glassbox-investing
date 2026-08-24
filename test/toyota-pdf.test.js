import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseToyotaQuarterlySummary } from "../spike/on-demand-reconstruction/src/toyota-pdf.js";

test("extracts Toyota quarterly values without filling unavailable fields", async () => {
  const text = await readFile(new URL("./fixtures/toyota-q1-excerpt.txt", import.meta.url), "utf8");
  const source = {
    id: "src_test",
    url: "https://example.test/summary.pdf",
    source_type: "company_official",
    retrieved_at: "2026-08-24T12:00:00.000Z"
  };
  const result = parseToyotaQuarterlySummary(text, source);
  assert.equal(result.periods[0].revenue, 13_525_400);
  assert.equal(result.periods[0].operating_income, 1_063_473);
  assert.equal(result.periods[0].net_income, 1_477_044);
  assert.equal(result.periods[0].eps, 120.69);
  assert.equal(result.periods[0].operating_cash_flow, 536_551);
  assert.equal(result.periods[1].operating_cash_flow, 1_876_481);
  const forecast = result.evidence.find((item) => item.key === "operating_income" && item.value_kind === "company_forecast");
  assert.deepEqual({ value: forecast.value, yoy: forecast.yoy_percent }, { value: 3_400_000, yoy: -9.7 });
});

test("fails closed when the quarterly table is not recognized", () => {
  assert.throws(
    () => parseToyotaQuarterlySummary("not a financial summary", { id: "src", url: "x", source_type: "x", retrieved_at: "x" }),
    /refusing to infer values/
  );
});
