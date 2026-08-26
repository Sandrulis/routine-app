export function looksLikeStripePublishableKey(value: string) {
  return /^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(value.trim());
}

export function looksLikeStripeSecretKey(value: string) {
  return /^(sk|rk)_(test|live)_[A-Za-z0-9]{16,}$/.test(value.trim());
}

export function stripeClientErrorKey(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid api key/i.test(message) || /no api key provided/i.test(message)) {
    return "errors.integrations_stripe_invalid_key";
  }
  if (/no such customer/i.test(message)) {
    return "errors.integrations_stripe_checkout_failed";
  }
  if (/invalid url/i.test(message) || /success_url/i.test(message) || /cancel_url/i.test(message)) {
    return "errors.integrations_stripe_checkout_failed";
  }
  return "errors.integrations_stripe_checkout_failed";
}
