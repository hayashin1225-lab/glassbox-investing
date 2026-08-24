export function buildSearchPlan(identity) {
  const names = [identity.name, identity.name_ja].filter(Boolean);
  const base = names.join(" OR ");
  return {
    identity_queries: [`${identity.symbol} ${identity.exchange}`, ...names],
    evidence_queries: [
      `${base} financial results revenue operating income`,
      `${base} cash flow EPS`,
      `${base} closing price 52 week high low`,
      `${base} next earnings date`
    ],
    narrative_queries: [
      identity.narrative_query ?? base,
      `${base} earnings growth shareholder returns China FX tariffs EV production risk`
    ],
    source_routes: [
      "company_official_ir",
      "public_filing_api",
      "open_news_metadata",
      "licensed_market_data_if_configured"
    ]
  };
}
