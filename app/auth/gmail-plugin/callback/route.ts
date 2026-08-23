import { GMAIL_PLUGIN_CALLBACK_PATH } from "@/app/lib/extension/gmail-oauth";
import { handleGmailPluginOAuthCallback } from "@/app/lib/extension/gmail-oauth-callback";

export async function GET(request: Request) {
  return handleGmailPluginOAuthCallback(request, GMAIL_PLUGIN_CALLBACK_PATH);
}
