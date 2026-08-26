# Pre-Purchase Check MVP UX Prototype

Issue: #8 — 「その銘柄、本物ですか？」注文前30秒チェック

## Purpose

This is a deliberately narrow UX prototype for validating one behavior:

> A retail investor already has a stock candidate, hesitates before buying, and chooses to do one quick check instead of pressing the order button immediately.

The prototype tests whether Glassbox can receive that moment with almost no friction.

## What this prototype validates

- one-screen ticker entry
- optional source / concern capture
- three-item first response instead of a long research report
- progressive disclosure into deeper research
- pre/post purchase-intent capture
- repeat-another-stock flow
- local-only session logging for prototype observation

## Important limitation

**No real market or financial data is connected yet.**

The three checks are UX placeholders that describe the intended inspection categories. They must not be used for investment decisions.

No buy/sell recommendation or score is produced.

## Run locally

Open `index.html` directly in a browser, or serve this directory with any static HTTP server.

Example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Next implementation gate

Do not add broad product features yet. The next step should be the minimum real-data adapter required to replace the three placeholder checks while preserving the current first-screen flow.
