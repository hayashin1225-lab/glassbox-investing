# 7203 Glassbox Preview sample

Open `report.html` directly in a browser. It is a self-contained Glassbox Preview 0.1 generated from the Issue #14 Engine's structured `review.json` on 2026-08-25.

The committed sample contains derived review output and provenance links only. It does not contain retrieved source HTML, PDF bytes, article bodies, or `retrieved-input.json`.

Generation command:

```powershell
npm run preview:7203
```

The command writes the working report to `spike/on-demand-reconstruction/runs/7203/report.html`. The committed sample was generated from that run with:

```powershell
node spike/on-demand-reconstruction/src/preview-cli.js `
  spike/on-demand-reconstruction/runs/7203/review.json `
  spike/on-demand-reconstruction/samples/7203/report.html
```

SHA-256:

`0C90314BA6428DE353008D25543A646F7D2E4D0C3FD0B068739A2ACCD2855234`
