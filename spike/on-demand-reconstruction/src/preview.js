const FUNDAMENTAL_KEYS = ["revenue", "operating_income", "net_income", "eps", "operating_cash_flow"];

const LABELS = {
  revenue: "売上収益",
  operating_income: "営業利益",
  net_income: "純利益",
  eps: "基本EPS",
  operating_cash_flow: "営業キャッシュフロー",
  current_or_last_close: "現在値 / 直近終値",
  previous_day_change: "前日比",
  week_52_high: "52週高値",
  week_52_low: "52週安値",
  per: "PER",
  pbr: "PBR",
  independent_public_narrative: "独立した外部の語り",
  shareholder_returns: "株主還元",
  earnings: "業績",
  ev: "EV / 電動化",
  growth: "成長・投資",
  china: "中国",
  fx: "為替",
  tariffs: "関税",
  production: "生産",
  misconduct: "不祥事・認証",
  valuation: "バリュエーション"
};

export function renderPreview(review) {
  const company = review.company_identity ?? {};
  const identity = [company.symbol, company.name_ja || company.name].filter(Boolean).join(" ");
  const subname = company.name_ja && company.name ? company.name : "銘柄査読レポート";
  const fundamentals = selectFundamentals(review.evidence ?? []);
  const gaps = review.fact_narrative_gaps ?? [];
  const detectors = review.detectors ?? [];
  const unknowns = review.unknowns ?? [];
  const coverage = review.narrative_coverage ?? {};
  const sources = review.sources ?? [];
  const topIssues = review.top_issues ?? [];
  const primaryGap = gaps[0];
  const independentInsufficient = review.independent_public_narrative?.status !== "sufficient";

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Glassbox Preview 0.1 — ${escapeHtml(identity)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172033;
      --ink-soft: #4c586f;
      --muted: #718096;
      --line: #dce2ea;
      --line-strong: #c6ced9;
      --paper: #ffffff;
      --canvas: #f3f5f8;
      --navy: #17243d;
      --blue: #315b88;
      --blue-soft: #eef4fa;
      --amber: #a06514;
      --amber-soft: #fff8e8;
      --shadow: 0 14px 40px rgba(23, 32, 51, .08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--canvas);
      color: var(--ink);
      font-family: "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.65;
    }
    a { color: var(--blue); text-underline-offset: 3px; }
    .shell { max-width: 1180px; margin: 0 auto; padding: 0 28px 72px; }
    .topbar {
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      color: #fff;
    }
    .topbar-wrap { background: var(--navy); }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; letter-spacing: .02em; }
    .brand-mark { width: 30px; height: 30px; border: 1px solid rgba(255,255,255,.55); border-radius: 8px; display: grid; place-items: center; font-size: 13px; }
    .version { color: #c9d3e2; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
    .hero { padding: 42px 0 26px; }
    .eyebrow { margin: 0 0 8px; color: var(--blue); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(30px, 5vw, 48px); line-height: 1.18; letter-spacing: -.035em; }
    .company-sub { margin: 7px 0 0; color: var(--ink-soft); font-size: 16px; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 22px; color: var(--ink-soft); font-size: 13px; }
    .meta strong { color: var(--ink); font-weight: 650; }
    .boundary { margin: 18px 0 0; color: var(--muted); font-size: 12px; }
    .summary-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(300px, .8fr); gap: 18px; align-items: start; }
    .panel { background: var(--paper); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow); }
    .panel-pad { padding: 26px; }
    .section-kicker { margin: 0 0 14px; color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    h2 { margin: 0 0 18px; font-size: 22px; letter-spacing: -.02em; }
    h3 { margin: 0 0 8px; font-size: 16px; line-height: 1.45; }
    p { margin: 0; }
    .issues { display: grid; gap: 12px; }
    .issue { display: grid; grid-template-columns: 34px 1fr; gap: 13px; padding: 15px 0; border-top: 1px solid var(--line); }
    .issue:first-child { border-top: 0; padding-top: 0; }
    .issue-index { width: 30px; height: 30px; border-radius: 9px; background: var(--navy); color: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 700; }
    .issue p { color: var(--ink-soft); font-size: 13px; }
    .coverage { display: grid; gap: 14px; }
    .scope-line { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
    .scope-value { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 700; color: var(--blue); }
    .coverage-row { padding: 13px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fafbfd; }
    .coverage-row.warn { border-color: #ead5aa; background: var(--amber-soft); }
    .coverage-label { display: flex; justify-content: space-between; gap: 8px; font-weight: 650; }
    .coverage-note { margin-top: 5px; color: var(--ink-soft); font-size: 12px; }
    .status { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; font-weight: 700; }
    .status.warn { color: var(--amber); }
    .gap-callout { margin-top: 18px; padding: 20px 22px; border-left: 4px solid var(--blue); background: var(--blue-soft); border-radius: 4px 13px 13px 4px; }
    .gap-callout .label { color: var(--blue); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .gap-callout p { margin-top: 7px; font-size: 17px; font-weight: 650; line-height: 1.55; }
    .warning { margin-top: 18px; padding: 15px 18px; border: 1px solid #ead5aa; background: var(--amber-soft); border-radius: 12px; color: #6e4d17; }
    .warning strong { color: #56390c; }
    .detail-heading { margin: 44px 0 16px; display: flex; align-items: end; justify-content: space-between; gap: 20px; }
    .detail-heading p { color: var(--muted); font-size: 13px; }
    .detail-stack { display: grid; gap: 14px; }
    details { background: var(--paper); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
    summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 19px 22px; font-weight: 700; }
    summary::-webkit-details-marker { display: none; }
    summary::after { content: "+"; color: var(--blue); font-size: 22px; font-weight: 400; }
    details[open] summary::after { content: "−"; }
    details[open] summary { border-bottom: 1px solid var(--line); }
    .detail-body { padding: 22px; }
    .fundamentals { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .metric { min-height: 118px; padding: 15px; background: #f8fafc; border: 1px solid var(--line); border-radius: 11px; }
    .metric-label { color: var(--muted); font-size: 12px; }
    .metric-value { margin-top: 9px; font-size: 21px; font-weight: 720; letter-spacing: -.02em; }
    .metric-period { margin-top: 5px; color: var(--ink-soft); font-size: 11px; }
    .table-wrap { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { color: var(--muted); font-size: 11px; text-align: left; letter-spacing: .05em; text-transform: uppercase; }
    th, td { padding: 11px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
    tbody tr:last-child td { border-bottom: 0; }
    .signal { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; font-weight: 700; color: var(--blue); }
    .topic-list { display: flex; flex-wrap: wrap; gap: 9px; }
    .topic { padding: 8px 11px; background: var(--blue-soft); border: 1px solid #d8e4f0; border-radius: 9px; }
    .topic strong { display: block; font-size: 13px; }
    .topic span { color: var(--ink-soft); font-size: 11px; }
    .empty { padding: 16px; border: 1px dashed var(--line-strong); border-radius: 10px; color: var(--ink-soft); }
    .gap-list, .unknown-list, .source-list { display: grid; gap: 10px; }
    .record { padding: 15px 16px; border: 1px solid var(--line); border-radius: 11px; }
    .record-meta { margin-top: 6px; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; overflow-wrap: anywhere; }
    .source { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: start; }
    .source a { overflow-wrap: anywhere; font-weight: 650; }
    .source-meta { color: var(--ink-soft); font-size: 12px; }
    .policy { white-space: nowrap; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; }
    footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--line-strong); color: var(--muted); font-size: 12px; }
    @media (max-width: 900px) {
      .summary-grid { grid-template-columns: 1fr; }
      .fundamentals { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 600px) {
      .shell { padding-left: 17px; padding-right: 17px; }
      .version { display: none; }
      .hero { padding-top: 30px; }
      .panel-pad { padding: 20px; }
      .fundamentals { grid-template-columns: 1fr; }
      .detail-heading { align-items: start; flex-direction: column; }
      .source { grid-template-columns: 1fr; }
    }
    @media print {
      body { background: #fff; }
      .topbar-wrap { background: #fff; border-bottom: 1px solid var(--line); }
      .topbar, .brand { color: var(--ink); }
      .version { color: var(--muted); }
      .panel { box-shadow: none; }
      details { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="topbar-wrap">
    <div class="shell topbar">
      <div class="brand"><span class="brand-mark">GB</span><span>Glassbox Investing</span></div>
      <div class="version">Preview 0.1 · deterministic review</div>
    </div>
  </div>
  <main class="shell">
    <header class="hero">
      <p class="eyebrow">Stock review · 30-second view</p>
      <h1>${escapeHtml(identity)}</h1>
      <p class="company-sub">${escapeHtml(subname)}</p>
      <div class="meta">
        <span>Data as of <strong>${escapeHtml(formatDateTime(review.data_as_of))}</strong></span>
        <span>Engine <strong>${escapeHtml(review.engine_version ?? "Unknown")}</strong></span>
        <span>Rule Set <strong>${escapeHtml(review.rule_set ?? "Unknown")}</strong></span>
      </div>
      <p class="boundary">確認可能な事実・企業側の語り・独立した外部の語りを分けて確認するための調査支援です。投資助言や売買判断を提供するものではありません。</p>
    </header>

    <section class="summary-grid" aria-label="30秒ビュー">
      <div class="panel panel-pad">
        <p class="section-kicker">Priority router</p>
        <h2>いま見るべき3点</h2>
        <div class="issues">${topIssues.slice(0, 3).map(renderIssue).join("") || renderEmpty("前面表示する論点がありません。")}</div>
        <div class="gap-callout">
          <div class="label">Primary Fact–Narrative Gap</div>
          <p>${escapeHtml(primaryGap?.statement ?? "決定論的なGapルールは発火していません。これはGapが存在しないことの証明ではありません。")}</p>
        </div>
        ${unknowns.length ? `<div class="warning"><strong>未確認・不足が ${unknowns.length} 項目あります。</strong> 重要な空白を結論で埋めず、詳細で取得理由を確認してください。</div>` : ""}
      </div>

      <aside class="panel panel-pad" aria-label="Narrative Coverage">
        <p class="section-kicker">Narrative coverage</p>
        <h2>語りの観測範囲</h2>
        <div class="coverage">
          <div class="scope-line"><span>narrative_scope</span><span class="scope-value">${escapeHtml(review.narrative_scope ?? "insufficient")}</span></div>
          <div class="coverage-row">
            <div class="coverage-label"><span>企業側の語り</span><span class="status">${escapeHtml(coverage.issuer_status ?? "empty")}</span></div>
            <div class="coverage-note">${number(coverage.issuer_domain_count)} domains · ${number(coverage.issuer_cluster_count)} clusters</div>
          </div>
          <div class="coverage-row${independentInsufficient ? " warn" : ""}">
            <div class="coverage-label"><span>独立した外部の語り</span><span class="status${independentInsufficient ? " warn" : ""}">${escapeHtml(coverage.independent_public_status ?? "insufficient")}</span></div>
            <div class="coverage-note">${number(coverage.independent_domain_count)} domains · ${number(coverage.independent_cluster_count)} clusters</div>
          </div>
          ${independentInsufficient ? `<p class="coverage-note">独立ソースのCoverageを満たしていないため、企業公式情報を外部Narrativeとして代用していません。</p>` : ""}
        </div>
      </aside>
    </section>

    <div class="detail-heading">
      <div><p class="section-kicker">Trace the review</p><h2>根拠と詳細</h2></div>
      <p>各セクションを開くと、判定からEvidenceとSourceへ降りられます。</p>
    </div>

    <section class="detail-stack" aria-label="査読詳細">
      <details open>
        <summary>Fundamental · 主要数値</summary>
        <div class="detail-body">
          <div class="fundamentals">${fundamentals.map(renderMetric).join("") || renderEmpty("表示可能な主要数値がありません。")}</div>
          <div class="table-wrap" style="margin-top:18px">${renderEvidenceTable(review.evidence ?? [], sources)}</div>
        </div>
      </details>

      <details>
        <summary>Evidence Detector · 検出結果</summary>
        <div class="detail-body">${renderDetectorTable(detectors)}</div>
      </details>

      <details>
        <summary>Narrative · 企業側 / 独立外部</summary>
        <div class="detail-body">
          <h3>企業側の語り</h3>
          <div class="topic-list">${(review.issuer_narrative?.topics ?? []).map(renderTopic).join("") || renderEmpty("企業側のNarrative topicは確認できませんでした。")}</div>
          <h3 style="margin-top:24px">独立した外部の語り</h3>
          ${independentInsufficient ? renderEmpty("insufficient — 独立した外部ソースのCoverageが不足しています。Public Narrativeは生成していません。") : `<div class="topic-list">${(review.independent_public_narrative?.topics ?? []).map(renderTopic).join("")}</div>`}
        </div>
      </details>

      <details>
        <summary>Fact–Narrative Gap · 照合結果</summary>
        <div class="detail-body">
          <div class="gap-list">${gaps.map(renderGap).join("") || renderEmpty("決定論的なGapルールは発火していません。")}</div>
          <div class="table-wrap" style="margin-top:18px">${renderAssessmentTable(review.fact_narrative_gap_assessments ?? [])}</div>
        </div>
      </details>

      <details>
        <summary>Unknowns · 未確認 / 不足</summary>
        <div class="detail-body"><div class="unknown-list">${unknowns.map(renderUnknown).join("") || renderEmpty("未確認項目はありません。")}</div></div>
      </details>

      <details id="sources">
        <summary>Sources / Provenance · 出典</summary>
        <div class="detail-body">
          <div class="source-list">${sources.map(renderSource).join("") || renderEmpty("Source情報がありません。")}</div>
          ${renderRetrievalConstraints(review.retrieval_log ?? [])}
        </div>
      </details>
    </section>
  </main>
  <footer class="shell">Generated deterministically from <code>review.json</code>. Glassbox Preview 0.1 does not fetch, infer, or rewrite review evidence.</footer>
</body>
</html>
`;
}

function renderIssue(item, index) {
  return `<article class="issue"><div class="issue-index">${index + 1}</div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.reason)}</p></div></article>`;
}

function selectFundamentals(evidence) {
  return FUNDAMENTAL_KEYS.flatMap((key) => {
    const candidates = evidence
      .filter((row) => row.key === key && row.value_kind === "actual")
      .sort((a, b) => periodScore(b.period) - periodScore(a.period) || String(b.period).localeCompare(String(a.period)) || a.id.localeCompare(b.id));
    return candidates.length ? [candidates[0]] : [];
  });
}

function periodScore(period) {
  const value = String(period ?? "");
  const fy = value.match(/FY(\d{4})\s+Q(\d)/i);
  if (fy) return Number(fy[1]) * 10 + Number(fy[2]);
  const date = Date.parse(value.split("/").at(-1));
  return Number.isFinite(date) ? Math.floor(date / 86400000) : 0;
}

function renderMetric(row) {
  return `<div class="metric"><div class="metric-label">${escapeHtml(label(row.key))}</div><div class="metric-value">${escapeHtml(formatValue(row))}</div><div class="metric-period">${escapeHtml(row.period ?? "期間不明")}${row.yoy_percent == null ? "" : ` · YoY ${signed(row.yoy_percent)}%`}</div></div>`;
}

function renderEvidenceTable(evidence, sources) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const rows = [...evidence]
    .sort((a, b) => String(a.key).localeCompare(String(b.key)) || String(b.period).localeCompare(String(a.period)))
    .map((row) => {
      const source = sourceById.get(row.source_id);
      const sourceLabel = source?.domain || source?.source_type || row.source_id;
      const sourceCell = source?.url ? `<a href="${escapeAttribute(safeUrl(source.url))}" target="_blank" rel="noreferrer">${escapeHtml(sourceLabel)}</a>` : escapeHtml(sourceLabel);
      return `<tr><td>${escapeHtml(label(row.key))}</td><td>${escapeHtml(row.period ?? "—")}</td><td>${escapeHtml(formatValue(row))}</td><td>${escapeHtml(row.value_kind ?? "—")}</td><td>${sourceCell}</td></tr>`;
    }).join("");
  return `<table><thead><tr><th>Evidence</th><th>Period</th><th>Value</th><th>Kind</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderDetectorTable(detectors) {
  if (!detectors.length) return renderEmpty("Detector結果がありません。");
  const rows = detectors.map((item) => `<tr><td><span class="signal">${escapeHtml(item.signal)}</span></td><td><strong>${escapeHtml(item.type)}</strong><br>${escapeHtml(item.summary)}</td><td>${escapeHtml(item.period ?? "—")}</td><td class="record-meta">${escapeHtml((item.evidence_refs ?? []).join(", ") || "none")}</td></tr>`).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Signal</th><th>Detector / Result</th><th>Period</th><th>Evidence refs</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderTopic(topic) {
  return `<div class="topic"><strong>${escapeHtml(label(topic.topic))}</strong><span>score ${number(topic.score)} · ${number(topic.cluster_ids?.length)} clusters · ${number(topic.domains?.length)} domains</span></div>`;
}

function renderGap(gap) {
  const refs = [
    `Evidence: ${(gap.evidence_refs ?? []).join(", ") || "none"}`,
    `Issuer: ${(gap.issuer_narrative_refs ?? []).join(", ") || "none"}`,
    `Independent: ${(gap.independent_narrative_refs ?? []).join(", ") || "none"}`
  ].join(" · ");
  return `<article class="record"><span class="signal">${escapeHtml(gap.comparison_scope)}</span><h3 style="margin-top:6px">${escapeHtml(gap.statement)}</h3><p class="record-meta">${escapeHtml(refs)}</p></article>`;
}

function renderAssessmentTable(assessments) {
  if (!assessments.length) return "";
  const rows = assessments.map((row) => `<tr><td>${escapeHtml(row.comparison_scope)}</td><td><span class="signal">${escapeHtml(row.status)}</span></td><td>${escapeHtml(row.reason)}</td></tr>`).join("");
  return `<table><thead><tr><th>Direction</th><th>Status</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderUnknown(item) {
  return `<article class="record"><span class="signal">${escapeHtml(item.status)}</span><h3 style="margin-top:6px">${escapeHtml(label(item.key))}</h3><p>${escapeHtml(item.reason)}</p></article>`;
}

function renderSource(source) {
  const url = safeUrl(source.url);
  return `<article class="record source"><div><a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(source.domain || source.url || source.id)}</a><div class="source-meta">${escapeHtml(source.source_type ?? "unknown type")} · role ${escapeHtml(source.source_role ?? "unspecified")} · scope ${escapeHtml(source.narrative_scope ?? "not_applicable")}</div><div class="record-meta">${escapeHtml(source.id)} · retrieved ${escapeHtml(formatDateTime(source.retrieved_at))}</div></div><span class="policy">${escapeHtml(source.source_usage_policy?.status ?? "policy_unknown")}</span></article>`;
}

function renderRetrievalConstraints(log) {
  const rows = log.filter((item) => item.status !== "success");
  if (!rows.length) return "";
  return `<h3 style="margin-top:24px">取得できなかった経路</h3><div class="unknown-list">${rows.map((item) => `<article class="record"><span class="signal">${escapeHtml(item.status)}</span><h3 style="margin-top:6px">${escapeHtml(item.route)}</h3><p>${escapeHtml(item.reason)}</p></article>`).join("")}</div>`;
}

function renderEmpty(message) {
  return `<div class="empty">${escapeHtml(message)}</div>`;
}

function formatValue(row) {
  if (row.value == null) return "Unknown";
  if (row.unit === "JPY million" && typeof row.value === "number") {
    return `¥${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(row.value / 1_000_000)}兆`;
  }
  if (row.unit === "JPY/share" && typeof row.value === "number") {
    return `¥${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(row.value)}`;
  }
  if (row.unit === "JPY" && typeof row.value === "number") {
    return `¥${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(row.value / 1_000_000_000_000)}兆`;
  }
  const value = typeof row.value === "number" ? new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(row.value) : String(row.value);
  return [value, row.unit].filter(Boolean).join(" ");
}

function formatDateTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return String(value);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(date) + " JST";
}

function signed(value) {
  const numberValue = Number(value);
  return `${numberValue > 0 ? "+" : ""}${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(numberValue)}`;
}

function label(value) {
  return LABELS[value] ?? String(value ?? "Unknown").replaceAll("_", " ");
}

function number(value) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 3 }).format(Number(value ?? 0));
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "#";
  } catch {
    return "#";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
