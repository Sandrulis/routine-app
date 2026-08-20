/** Strip scripts / handlers from email HTML before storing or previewing. */
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True when text looks like HTML markup rather than plain prose. */
export function textLooksLikeHtml(value: string): boolean {
  const t = value.trim().toLowerCase();
  if (!t) return false;
  if (t.includes("<!doctype html") || t.includes("<html")) return true;
  if (t.includes("<head") && t.includes("<body")) return true;
  // Common email HTML layouts without full document wrapper
  if (t.includes("<table") && (t.includes("<style") || t.includes("cellpadding"))) {
    return true;
  }
  const tagCount = (t.match(/<\/?[a-z][^>]*>/g) || []).length;
  return tagCount >= 8;
}

export type ParsedEmailExport = {
  subject: string;
  from: string;
  to: string;
  date: string;
  url: string;
  body: string;
  bodyIsHtml: boolean;
};

/**
 * Parse Routine Gmail export `.txt` (headers + blank line + body).
 * Returns null if the text is not in that format and not a bare HTML dump.
 */
export function parseRoutineEmailExport(text: string): ParsedEmailExport | null {
  const normalized = text.replace(/^\uFEFF/, "");
  const headerStart = normalized.match(/^(Subject|From|To|Date|URL):/im);
  if (!headerStart || headerStart.index === undefined || headerStart.index > 0) {
    if (textLooksLikeHtml(normalized)) {
      return {
        subject: "",
        from: "",
        to: "",
        date: "",
        url: "",
        body: normalized.trim(),
        bodyIsHtml: true,
      };
    }
    return null;
  }

  const blank = normalized.search(/\r?\n\r?\n/);
  if (blank < 0) return null;
  const headerBlock = normalized.slice(0, blank);
  const body = normalized.slice(blank).replace(/^\r?\n\r?\n/, "");

  const headers: Record<string, string> = {};
  for (const line of headerBlock.split(/\r?\n/)) {
    const match = /^(Subject|From|To|Date|URL):\s*(.*)$/i.exec(line);
    if (match) headers[match[1].toLowerCase()] = match[2].trim();
  }

  if (!headers.subject && !headers.from && !textLooksLikeHtml(body)) {
    return null;
  }

  return {
    subject: headers.subject || "",
    from: headers.from || "",
    to: headers.to || "",
    date: headers.date || "",
    url: headers.url || "",
    body,
    bodyIsHtml: textLooksLikeHtml(body),
  };
}

/** Pull inner body + style blocks from a full HTML email document. */
function extractHtmlEmailParts(html: string): { styles: string; body: string } {
  const sanitized = sanitizeEmailHtml(html);
  const styles = [...sanitized.matchAll(/<style[\s\S]*?<\/style>/gi)]
    .map((match) => match[0])
    .join("\n");
  const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(sanitized);
  if (bodyMatch) {
    return { styles, body: bodyMatch[1].trim() };
  }
  // Fragment without <body> — strip outer html/head wrappers if present
  const withoutHead = sanitized
    .replace(/<!DOCTYPE[\s\S]*?>/i, "")
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .trim();
  return { styles, body: withoutHead };
}

/** Build a sandboxed preview HTML document for an email export or HTML dump. */
export function buildEmailPreviewDocument(rawText: string): string | null {
  const parsed = parseRoutineEmailExport(rawText);
  if (!parsed) {
    if (!textLooksLikeHtml(rawText)) return null;
    const parts = extractHtmlEmailParts(rawText);
    return wrapEmailPreview({
      subject: "",
      from: "",
      to: "",
      date: "",
      url: "",
      bodyHtml: parts.body,
      extraStyles: parts.styles,
    });
  }

  if (parsed.bodyIsHtml) {
    const parts = extractHtmlEmailParts(parsed.body);
    return wrapEmailPreview({
      subject: parsed.subject,
      from: parsed.from,
      to: parsed.to,
      date: parsed.date,
      url: parsed.url,
      bodyHtml: parts.body,
      extraStyles: parts.styles,
    });
  }

  // Plain-text email: still show a readable card layout
  return wrapEmailPreview({
    subject: parsed.subject,
    from: parsed.from,
    to: parsed.to,
    date: parsed.date,
    url: parsed.url,
    bodyHtml: `<pre style="white-space:pre-wrap;margin:0;font:inherit;color:inherit;">${escapeHtml(parsed.body || "(tukšs saturs)")}</pre>`,
  });
}

function wrapEmailPreview(input: {
  subject: string;
  from: string;
  to: string;
  date: string;
  url: string;
  bodyHtml: string;
  extraStyles?: string;
}): string {
  const meta = [
    input.from
      ? `<div><strong>From:</strong> ${escapeHtml(input.from)}</div>`
      : "",
    input.to ? `<div><strong>To:</strong> ${escapeHtml(input.to)}</div>` : "",
    input.date
      ? `<div><strong>Date:</strong> ${escapeHtml(input.date)}</div>`
      : "",
    input.url
      ? `<div><strong>URL:</strong> <a href="${escapeHtml(input.url)}">${escapeHtml(input.url)}</a></div>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const title = input.subject || "E-pasts";

  return `<!DOCTYPE html>
<html lang="lv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; color: #0f172a; background: #f8fafc; }
  .wrap { max-width: 760px; margin: 0 auto; padding: 20px 16px 40px; }
  .meta { font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 16px; padding: 12px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
  .meta a { color: #0f766e; word-break: break-all; }
  .subject { font-size: 20px; font-weight: 700; margin: 0 0 14px; }
  .body { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; overflow-x: auto; }
  .body img { max-width: 100%; height: auto; }
  .body table { max-width: 100%; }
</style>
${input.extraStyles || ""}
</head>
<body>
  <div class="wrap">
    ${input.subject ? `<h1 class="subject">${escapeHtml(input.subject)}</h1>` : ""}
    ${meta ? `<div class="meta">${meta}</div>` : ""}
    <div class="body">${input.bodyHtml}</div>
  </div>
</body>
</html>`;
}
