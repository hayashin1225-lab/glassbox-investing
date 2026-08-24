import { SOURCE_POLICIES } from "./constants.js";
import { stableId } from "./util.js";
import { extractPdfText, parseToyotaQuarterlySummary } from "./toyota-pdf.js";
import { extractSecEvidence } from "./sec-evidence.js";
import { extractOfficialNarratives, parseGdeltArticles } from "./narrative.js";

const USER_AGENT = "GlassboxIssue14Spike/0.1 (low-frequency research; contact=repository-owner)";

export async function retrieveLive(identity, searchPlan, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date().toISOString());
  const includeGdelt = options.includeGdelt ?? true;
  const sources = [];
  const retrievalLog = [];
  const evidence = [];
  const narrativeItems = [];

  const resultsPage = await retrieveText({
    url: identity.financial_results_url,
    route: "company_official_ir",
    sourceType: "company_official",
    sourceRole: "evidence_origin",
    policy: SOURCE_POLICIES.toyota_official,
    fetchImpl,
    now,
    sources,
    retrievalLog
  });
  if (resultsPage) {
    const pdfHref = [...resultsPage.body.matchAll(/href=["']([^"']+_summary_en\.pdf)["']/gi)][0]?.[1];
    if (pdfHref) {
      const pdfUrl = new URL(pdfHref, resultsPage.source.url).toString();
      const pdf = await retrieveBinary({
        url: pdfUrl,
        route: "company_official_financial_summary",
        sourceType: "company_official",
        sourceRole: "evidence_origin",
        policy: SOURCE_POLICIES.toyota_official,
        fetchImpl,
        now,
        sources,
        retrievalLog
      });
      if (pdf) {
        try {
          const text = await extractPdfText(pdf.body);
          const parsed = parseToyotaQuarterlySummary(text, pdf.source);
          pdf.source.publication_date = parsed.publication_date;
          pdf.source.covered_period = parsed.covered_period;
          evidence.push(...parsed.evidence);
          retrievalLog.push(logEntry(pdf.source, "extract", "success", `Extracted ${parsed.evidence.length} evidence records.`));
        } catch (error) {
          retrievalLog.push(logEntry(pdf.source, "extract", "failed", error.message));
        }
      }
    } else {
      retrievalLog.push({
        route: "company_official_financial_summary",
        status: "failed",
        reason: "No current English financial-summary PDF link was discovered; no URL was guessed."
      });
    }
  }

  const officialIr = await retrieveText({
    url: identity.official_ir_url,
    route: "company_official_narrative",
    sourceType: "company_official",
    sourceRole: "narrative_origin",
    narrativeScope: "issuer",
    policy: SOURCE_POLICIES.toyota_official,
    fetchImpl,
    now,
    sources,
    retrievalLog
  });
  if (officialIr) {
    const items = extractOfficialNarratives(officialIr.body, officialIr.source);
    narrativeItems.push(...items);
    retrievalLog.push(logEntry(officialIr.source, "extract", "success", `Extracted ${items.length} official narrative metadata items.`));
  }

  if (identity.sec_cik) {
    const secUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${identity.sec_cik}.json`;
    const sec = await retrieveJson({
      url: secUrl,
      route: "public_filing_api",
      sourceType: "public_filing_api",
      sourceRole: "evidence_origin",
      policy: SOURCE_POLICIES.sec_companyfacts,
      fetchImpl,
      now,
      sources,
      retrievalLog
    });
    if (sec) {
      const items = extractSecEvidence(sec.body, sec.source);
      evidence.push(...items);
      retrievalLog.push(logEntry(sec.source, "extract", "success", `Extracted ${items.length} annual filing evidence records.`));
    }
  }

  if (includeGdelt) {
    const gdeltUrl = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    gdeltUrl.search = new URLSearchParams({
      query: identity.narrative_query,
      mode: "ArtList",
      maxrecords: "30",
      format: "json",
      sort: "datedesc",
      timespan: "1month"
    }).toString();
    const gdelt = await retrieveJson({
      url: gdeltUrl.toString(),
      route: "open_news_metadata",
      sourceType: "open_news_metadata",
      sourceRole: "narrative_aggregator",
      narrativeScope: "mixed",
      policy: SOURCE_POLICIES.gdelt_project,
      fetchImpl,
      now,
      sources,
      retrievalLog
    });
    if (gdelt) {
      const items = parseGdeltArticles(gdelt.body, gdelt.source, identity.issuer_domains ?? []);
      narrativeItems.push(...items);
      retrievalLog.push(logEntry(gdelt.source, "extract", "success", `Extracted ${items.length} open news metadata items.`));
    }
  }

  retrievalLog.push({
    route: "licensed_market_data_if_configured",
    status: "blocked",
    reason: SOURCE_POLICIES.jpx_price.reason,
    source_usage_policy: SOURCE_POLICIES.jpx_price
  });
  retrievalLog.push({
    route: "google_news_rss",
    status: "blocked",
    reason: SOURCE_POLICIES.google_news_rss.reason,
    source_usage_policy: SOURCE_POLICIES.google_news_rss
  });

  return {
    schema_version: "issue-14-retrieval-v2",
    company_identity: identity,
    search_plan: searchPlan,
    sources,
    evidence,
    narrative_items: narrativeItems,
    retrieval_log: retrievalLog,
    retrieved_at: latestTimestamp(sources.map((source) => source.retrieved_at)) ?? now()
  };
}

async function retrieveText(args) {
  return retrieve({ ...args, responseType: "text" });
}

async function retrieveJson(args) {
  return retrieve({ ...args, responseType: "json" });
}

async function retrieveBinary(args) {
  return retrieve({ ...args, responseType: "binary" });
}

async function retrieve({ url, route, sourceType, sourceRole, narrativeScope, policy, fetchImpl, now, sources, retrievalLog, responseType }) {
  const retrievedAt = now();
  const source = {
    id: stableId("src", url),
    url,
    domain: new URL(url).hostname,
    source_type: sourceType,
    source_role: sourceRole,
    retrieved_at: retrievedAt,
    source_usage_policy: policy
  };
  if (narrativeScope) source.narrative_scope = narrativeScope;
  try {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT, Accept: responseType === "json" ? "application/json" : "*/*" },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) {
      retrievalLog.push({
        ...logEntry(source, route, response.status === 429 ? "rate_limited" : "failed", `HTTP ${response.status}`),
        http_status: response.status
      });
      return null;
    }
    let body;
    if (responseType === "json") body = await response.json();
    else if (responseType === "binary") body = Buffer.from(await response.arrayBuffer());
    else body = await response.text();
    sources.push(source);
    retrievalLog.push(logEntry(source, route, "success", `Retrieved ${responseType}.`));
    return { source, body };
  } catch (error) {
    retrievalLog.push(logEntry(source, route, "failed", error.cause?.code ?? error.message));
    return null;
  }
}

function logEntry(source, route, status, reason) {
  return {
    source_id: source.id,
    url: source.url,
    route,
    status,
    reason,
    retrieved_at: source.retrieved_at,
    source_role: source.source_role,
    narrative_scope: source.narrative_scope ?? null,
    source_usage_policy: source.source_usage_policy
  };
}

function latestTimestamp(values) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}
