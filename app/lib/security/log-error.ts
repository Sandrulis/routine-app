function redact(value: string) {
  return value
    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]+/g, "[redacted-jwt]")
    .replace(/enc:v1:[A-Za-z0-9_-]+/g, "[redacted-secret]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[redacted-email]",
    );
}

export function logError(context: string, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "unknown error";
  console.error(context, redact(message));
}
