/**
 * Table-based HTML email with a CTA button.
 * Inline styles for broad email-client support.
 */
export function buildEmailHtml(options: {
  systemName: string;
  heading: string;
  bodyText: string;
  buttonLabel: string;
  actionLink: string;
  footerHint: string;
}): string {
  const systemName = escapeHtml(options.systemName);
  const heading = escapeHtml(options.heading);
  const buttonLabel = escapeHtml(options.buttonLabel);
  const actionLink = escapeHtmlAttr(options.actionLink);
  const footerHint = escapeHtml(options.footerHint);
  const bodyHtml = paragraphsToHtml(options.bodyText);

  return `<!DOCTYPE html>
<html lang="lv">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${systemName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#71717a;">
                ${systemName}
              </p>
              <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#18181b;">
                ${heading}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;font-size:15px;line-height:1.6;color:#3f3f46;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 32px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#1d4ed8" style="border-radius:10px;">
                    <a href="${actionLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:10px;background-color:#1d4ed8;">
                      ${buttonLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#a1a1aa;">
                ${footerHint}
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;">
                <a href="${actionLink}" target="_blank" rel="noopener noreferrer" style="color:#71717a;text-decoration:underline;">
                  ${actionLink}
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function paragraphsToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\n+/)
    .filter(Boolean)
    .map((block) => {
      const lines = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 1em 0;">${lines}</p>`;
    })
    .join("");
}
