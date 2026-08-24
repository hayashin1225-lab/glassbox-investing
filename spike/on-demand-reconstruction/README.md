# Issue #14 On-Demand Evidence Reconstruction Spike

Status: implementation spike, not product code

This directory implements one deterministic path from a ticker symbol to a traceable review. It follows the repository canon: Evidence, Issuer Narrative, and Independent Public Narrative stay separate; the engine does not call an AI service; unavailable or insufficient layers remain explicit; and no Buy / Sell output is produced.

## Flow

```text
symbol
  -> identity catalog
  -> search plan / source routes
  -> official IR + public filing + open-news metadata retrieval
  -> Evidence / Issuer Narrative / Independent Public Narrative extraction
  -> scope-preserving normalization + Narrative Coverage gate
  -> three evidence detectors
  -> three-direction Fact–Narrative Gap assessment
  -> deterministic priority router
  -> JSON state + 30-second Markdown report
```

The ticker boundary is `catalog/companies.json`; adding another company does not require changing the engine. The current source-specific PDF extractor is deliberately named and fail-closed. It throws instead of guessing when the Toyota table layout is not recognized.

## Run

Requirements: Node.js 20.16+ or 22.3+.

```powershell
npm install
npm test
npm run spike:7203
```

The live run writes ignored working artifacts under `runs/7203/`:

- `retrieved-input.json`: saved retrieval result, before detector execution
- `review.json`: normalized evidence, narratives, detectors, gaps, unknowns, and logs
- `report.md`: 30-second view

Replay without network access:

```powershell
node spike/on-demand-reconstruction/src/cli.js `
  --replay spike/on-demand-reconstruction/runs/7203/retrieved-input.json `
  --out spike/on-demand-reconstruction/runs/7203-replay
```

## 7203 live proof (2026-08-24)

The narrative-scope correction run at `2026-08-24T14:20:59.151Z` completed from symbol input to report output.

- Company identity: `7203 Toyota Motor Corporation`
- Successfully retrieved sources: Toyota financial-results index, Toyota FY2027 Q1 Financial Summary PDF, Toyota IR news index, SEC Company Facts API
- Structured evidence: 23 records
- Narrative metadata: 20 issuer-controlled items, normalized to 20 clusters
- Narrative Coverage: `narrative_scope: issuer`; Issuer `available` (2 domains / 20 clusters), Independent Public `insufficient` (0 domains / 0 clusters)
- Issuer topics: shareholder returns, earnings, EV, growth
- Independent Public topics: none generated because coverage failed closed
- Evidence detectors: 3 executed, 3 detected
- Fact–Narrative Gap rules: 2 `Evidence ↔ Issuer Narrative` gaps detected
- Gap direction assessments: Evidence↔Issuer `evaluated`; Evidence↔Independent `insufficient`; Issuer↔Independent `insufficient`
- Unknowns: 6 price/valuation fields plus Independent Public Narrative `insufficient`; the latest earnings publication date was obtained
- Replay SHA-256: `EB12F6AF9C3CD8053BA0A8EA6BD1C3C118BC62C656369CDB42875B3EAC5E7BAB` for both original and replayed `review.json`

Observed FY2027 Q1 evidence from the Toyota summary:

- Sales revenue: JPY 13,525,400 million, +10.4% year on year
- Operating income: JPY 1,063,473 million, -8.8% year on year
- Net income attributable to Toyota: JPY 1,477,044 million, +75.6% year on year
- Basic EPS: JPY 120.69
- Operating cash flow: JPY 536,551 million versus JPY 1,876,481 million in the prior-year quarter
- FY2027 company forecast operating income: JPY 3,400,000 million, -9.7% year on year

The engine therefore surfaced revenue / operating-profit divergence, operating-margin compression, and operating-cash-flow pressure. The two generated gaps explicitly compare Evidence with Issuer Narrative. No Evidence↔Independent or Issuer↔Independent gap was manufactured. They remain `insufficient`, not clean results.

## What did not work, by design or in practice

### Price and valuation

Current/last price, daily change, 52-week high/low, PER, and PBR remain `Unknown`. JPX's official OHLC and delayed-price routes require an application/contract and may add redistribution terms. No credential was available, and Yahoo Finance was not substituted as an unapproved canonical source.

### Independent Narrative coverage

GDELT DOC 2.0 was selected because GDELT Project data is open with attribution, but the final HTTPS runtime request timed out. The engine recorded `UND_ERR_CONNECT_TIMEOUT`, did not downgrade transport, and did not retry aggressively. The resulting Narrative sample is therefore explicitly Issuer Narrative. Independent Public Narrative is `insufficient`, not an external view of public attention and not a sentiment measure.

Google News RSS was probed but rejected: its feed notice limits use to rendering in personal feed readers. The code does not use or persist that feed.

### Source rights and stability

- Toyota official pages/PDFs: usable for this research spike; product storage and redistribution rights are not confirmed.
- SEC Company Facts: public API with identification and fair-access conditions; product handling still needs review.
- GDELT Project: open with attribution, while rights in linked article content remain separate.
- HTML/PDF layouts and GDELT availability are operationally unstable. Retrieval failures are first-class log entries.
- The SEC comparison path returned annual facts only through FY2025 in this run, so it does not independently confirm Toyota's FY2027 Q1 values.

## Technical assessment

The deterministic reconstruction core is viable: saved evidence can be normalized, checked, routed, and reproduced without an AI runtime. The dangerous part is not the detector code. It is obtaining sufficiently current, independent, licence-cleared price and narrative inputs. The spike should not be called product-ready until those two acquisition paths are solved.

Concrete next candidates, kept outside this issue's implementation:

1. Add a contracted J-Quants/JPX connector and encode its storage/redistribution rights in source policy.
2. Add a rate-controlled GDELT cache or another explicitly licensed news-metadata connector, then test source independence and duplicate clustering.
3. Replace issuer-specific PDF regexes with a small filing-adapter interface and regression fixtures for a second ticker before generalizing further.
