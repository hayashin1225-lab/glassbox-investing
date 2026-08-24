import { htmlText, normalizeUrl, stableId } from "./util.js";
import { NARRATIVE_COVERAGE_RULE, NARRATIVE_VERSION } from "./constants.js";

const TOPIC_DICTIONARY = {
  earnings: ["earnings", "financial results", "profit", "income", "業績", "決算", "利益"],
  growth: ["growth", "accelerat", "investment", "成長", "投資", "拡大"],
  shareholder_returns: ["shareholder return", "buyback", "treasury stock", "dividend", "株主還元", "自社株", "配当"],
  china: ["china", "中国"],
  fx: ["exchange rate", "weaker yen", "currency", "為替", "円安", "円高"],
  tariffs: ["tariff", "関税"],
  ev: [" ev ", "hev", "electric vehicle", "battery", "電気自動車", "電池"],
  production: ["production", "plant", "shipment", "減産", "生産", "出荷"],
  misconduct: ["misconduct", "certification", "recall", "不祥事", "認証", "リコール"],
  valuation: ["undervalued", "overvalued", "valuation", "割安", "割高"]
};

export function extractOfficialNarratives(html, source, limit = 20) {
  const section = String(html).match(/<div[^>]+id=["']ir_news["'][\s\S]*?<ul[^>]*class=["'][^"']*news_contents[^"']*["']>([\s\S]*?)<\/ul>/i)?.[1] ?? "";
  const items = [];
  const pattern = /<li[^>]*>\s*<span[^>]*>(\d{4}\/\d{2}\/\d{2})<\/span>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
  for (const match of section.matchAll(pattern)) {
    const url = normalizeUrl(match[2], source.url);
    const title = htmlText(match[3]);
    items.push({
      id: stableId("nar", `${url}|${match[1]}|${title}`),
      title,
      snippet: null,
      published_at: match[1].replaceAll("/", "-"),
      retrieved_at: source.retrieved_at,
      url,
      domain: new URL(url).hostname,
      source_id: source.id,
      source_type: "company_official",
      narrative_scope: "issuer",
      extraction_method: "official_ir_list_html_v1"
    });
    if (items.length >= limit) break;
  }
  return items;
}

export function parseGdeltArticles(payload, source, issuerDomains = [], limit = 30) {
  return (payload?.articles ?? []).slice(0, limit).flatMap((article) => {
    if (!article.url || !article.title) return [];
    const url = String(article.url);
    let domain;
    try {
      domain = String(article.domain || new URL(url).hostname).toLowerCase();
    } catch {
      return [];
    }
    return [{
      id: stableId("nar", `${url}|${article.title}`),
      title: htmlText(article.title),
      snippet: null,
      published_at: parseGdeltDate(article.seendate),
      retrieved_at: source.retrieved_at,
      url,
      domain,
      source_id: source.id,
      source_type: "news_metadata",
      narrative_scope: classifyNarrativeScope(domain, issuerDomains),
      extraction_method: "gdelt_doc_2_artlist_v1"
    }];
  });
}

export function classifyNarrativeScope(domain, issuerDomains = []) {
  const normalized = String(domain).toLowerCase().replace(/^www\./, "");
  const issuer = issuerDomains.some((candidate) => {
    const expected = String(candidate).toLowerCase().replace(/^www\./, "");
    return normalized === expected || normalized.endsWith(`.${expected}`);
  });
  return issuer ? "issuer" : "independent_public";
}

export function normalizeNarratives(items, asOf, coverageRule = NARRATIVE_COVERAGE_RULE) {
  const sorted = [...items]
    .map((item) => ({ ...item, narrative_scope: validItemScope(item.narrative_scope) }))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "") || a.id.localeCompare(b.id));
  const clusters = buildClusters(sorted);
  const coverage = buildCoverage(clusters, sorted, coverageRule);
  const issuerTopics = buildTopics(clusters, "issuer", asOf);
  const independentCandidateTopics = buildTopics(clusters, "independent_public", asOf);
  const independentTopics = coverage.independent_public_status === "sufficient" ? independentCandidateTopics : [];
  const topics = [...issuerTopics, ...independentTopics].sort(
    (a, b) => a.narrative_scope.localeCompare(b.narrative_scope) || b.score - a.score || a.topic.localeCompare(b.topic)
  );

  return {
    narrative_scope: coverage.narrative_scope,
    narrative_coverage: { ...coverage, independent_candidate_topic_count: independentCandidateTopics.length },
    narrative_items: sorted,
    narrative_clusters: clusters,
    narrative_topics: topics,
    issuer_narrative: { narrative_scope: "issuer", status: coverage.issuer_status, topics: issuerTopics },
    independent_public_narrative: {
      narrative_scope: coverage.independent_public_status === "sufficient" ? "independent_public" : "insufficient",
      status: coverage.independent_public_status,
      topics: independentTopics
    }
  };
}

function buildClusters(items) {
  const clusters = [];
  const clusterByKey = new Map();
  for (const item of items) {
    const key = titleKey(item.title);
    let cluster = clusterByKey.get(key);
    if (!cluster) {
      cluster = {
        id: stableId("cluster", key),
        canonical_title: item.title,
        item_ids: [],
        domains: [],
        issuer_item_ids: [],
        independent_public_item_ids: [],
        issuer_domains: [],
        independent_public_domains: [],
        narrative_scope: item.narrative_scope,
        newest_published_at: item.published_at,
        oldest_published_at: item.published_at,
        duplicate_count: 0
      };
      clusterByKey.set(key, cluster);
      clusters.push(cluster);
    }
    cluster.item_ids.push(item.id);
    addUnique(cluster.domains, item.domain);
    if (item.narrative_scope === "issuer") {
      cluster.issuer_item_ids.push(item.id);
      addUnique(cluster.issuer_domains, item.domain);
    } else {
      cluster.independent_public_item_ids.push(item.id);
      addUnique(cluster.independent_public_domains, item.domain);
    }
    if (cluster.issuer_item_ids.length && cluster.independent_public_item_ids.length) cluster.narrative_scope = "mixed";
    cluster.newest_published_at = maxDate(cluster.newest_published_at, item.published_at);
    cluster.oldest_published_at = minDate(cluster.oldest_published_at, item.published_at);
    cluster.duplicate_count = cluster.item_ids.length - 1;
  }
  return clusters;
}

function buildCoverage(clusters, items, rule) {
  const issuerClusters = clusters.filter((cluster) => cluster.issuer_item_ids.length);
  const independentClusters = clusters.filter((cluster) => cluster.independent_public_item_ids.length);
  const issuerDomains = unique(issuerClusters.flatMap((cluster) => cluster.issuer_domains));
  const independentDomains = unique(independentClusters.flatMap((cluster) => cluster.independent_public_domains));
  const dates = items.map((item) => item.published_at).filter(Boolean).sort();
  const independentSufficient =
    independentDomains.length >= rule.minimum_independent_domains &&
    independentClusters.length >= rule.minimum_independent_clusters;
  const issuerAvailable = issuerClusters.length > 0;
  return {
    narrative_scope: independentSufficient ? issuerAvailable ? "mixed" : "independent_public" : "insufficient",
    issuer_status: issuerAvailable ? "available" : "empty",
    independent_public_status: independentSufficient ? "sufficient" : "insufficient",
    independent_domain_count: independentDomains.length,
    issuer_domain_count: issuerDomains.length,
    original_cluster_count: clusters.length,
    issuer_cluster_count: issuerClusters.length,
    independent_cluster_count: independentClusters.length,
    covered_period: dates.length ? { from: dates[0], to: dates.at(-1) } : null,
    threshold: { ...rule }
  };
}

function buildTopics(clusters, scope, asOf) {
  const topicRows = [];
  for (const cluster of clusters) {
    const itemIds = scope === "issuer" ? cluster.issuer_item_ids : cluster.independent_public_item_ids;
    if (!itemIds.length) continue;
    const domains = scope === "issuer" ? cluster.issuer_domains : cluster.independent_public_domains;
    const text = ` ${cluster.canonical_title.toLowerCase()} `;
    for (const [topic, keywords] of Object.entries(TOPIC_DICTIONARY)) {
      const matches = keywords.filter((keyword) => text.includes(keyword));
      if (matches.length) topicRows.push({ topic, cluster_id: cluster.id, domain: domains[0], domains, weight: ageWeight(cluster.newest_published_at, asOf) });
    }
  }

  const topicMap = new Map();
  for (const row of topicRows) {
    const topic = topicMap.get(row.topic) ?? {
      topic: row.topic,
      narrative_scope: scope,
      score: 0,
      cluster_ids: [],
      domains: [],
      rule_version: NARRATIVE_VERSION
    };
    const domainCount = topic.cluster_ids.filter((id) => {
      const cluster = clusters.find((candidate) => candidate.id === id);
      const domains = scope === "issuer" ? cluster?.issuer_domains : cluster?.independent_public_domains;
      return domains?.includes(row.domain);
    }).length;
    if (domainCount < 3) {
      topic.score += row.weight;
      topic.cluster_ids.push(row.cluster_id);
      for (const domain of row.domains) addUnique(topic.domains, domain);
    }
    topicMap.set(row.topic, topic);
  }
  return [...topicMap.values()]
    .map((topic) => ({ ...topic, score: Number(topic.score.toFixed(3)) }))
    .sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic));
}

function validItemScope(scope) {
  if (scope === "issuer" || scope === "independent_public") return scope;
  throw new Error(`Narrative item is missing a valid issuer/independent scope: ${scope}`);
}

function titleKey(title) {
  return String(title).toLowerCase().replace(/\s+-\s+[^-]+$/, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function ageWeight(publishedAt, asOf) {
  if (!publishedAt) return 0.4;
  const days = Math.max(0, (new Date(asOf) - new Date(`${publishedAt}T00:00:00Z`)) / 86400000);
  if (days <= 30) return 1;
  if (days <= 60) return 0.7;
  return 0.4;
}

function parseGdeltDate(value) {
  const match = String(value ?? "").match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function addUnique(values, value) {
  if (value && !values.includes(value)) values.push(value);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function minDate(left, right) {
  return [left, right].filter(Boolean).sort()[0] ?? null;
}

function maxDate(left, right) {
  return [left, right].filter(Boolean).sort().at(-1) ?? null;
}
