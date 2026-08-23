const CRAWLER_UA =
  /googlebot|bingbot|yandex(?:bot|images)|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|linkedinbot|applebot|semrushbot|ahrefsbot|bytespider|gptbot|claudebot|ccbot|ia_archiver/i;

export function isCrawlerUserAgent(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && CRAWLER_UA.test(userAgent));
}
