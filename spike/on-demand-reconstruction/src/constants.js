export const ENGINE_VERSION = "spike-2026.2";
export const RULE_SET = "issue-14-v2";
export const DETECTOR_VERSION = "issue-14-detectors-v1";
export const NARRATIVE_VERSION = "issue-14-narrative-v2";

export const NARRATIVE_COVERAGE_RULE = {
  minimum_independent_domains: 2,
  minimum_independent_clusters: 2
};

export const REQUIRED_EVIDENCE_KEYS = [
  "revenue",
  "operating_income",
  "net_income",
  "eps",
  "operating_cash_flow",
  "per",
  "pbr",
  "current_or_last_close",
  "previous_day_change",
  "week_52_high",
  "week_52_low",
  "next_or_latest_earnings_date"
];

export const SOURCE_POLICIES = {
  toyota_official: {
    status: "uncertain_for_product",
    reason: "Official public IR pages are suitable for this research spike, but no product redistribution licence was confirmed.",
    storage: "metadata_and_extracted_facts_for_spike",
    redistribution: "not_cleared"
  },
  sec_companyfacts: {
    status: "public_api_with_conditions",
    reason: "SEC public data API; identify the client and respect SEC fair-access guidance.",
    storage: "extracted_facts",
    redistribution: "product_review_required"
  },
  gdelt_project: {
    status: "open_with_attribution",
    reason: "GDELT Project datasets allow unrestricted use with attribution; upstream article rights remain separate.",
    storage: "article_metadata_only",
    redistribution: "attribute_gdelt_and_do_not_republish_article_content"
  },
  jpx_price: {
    status: "blocked_without_contract",
    reason: "Official JPX OHLC and delayed-price services require an application/contract; no credential or redistribution permission is configured.",
    storage: "none",
    redistribution: "not_permitted_without_contract"
  },
  google_news_rss: {
    status: "blocked",
    reason: "The feed copyright notice limits the feed to rendering in personal feed readers; it is not used as a product data source.",
    storage: "none",
    redistribution: "not_permitted"
  }
};
