import { getPublicSiteUrl } from "@/app/lib/seo/site-url";

export function stripeWebhookUrl() {
  return `${getPublicSiteUrl()}/api/webhooks/stripe`;
}
