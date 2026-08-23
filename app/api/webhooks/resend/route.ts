import { Webhook } from "svix";
import {
  mapResendEventToDeliveryStatus,
  updateForwardActivityDelivery,
} from "@/app/lib/email/resend-delivery";
import { logError } from "@/app/lib/security/log-error";

export const runtime = "nodejs";

type ResendWebhookPayload = {
  type?: string;
  data?: {
    email_id?: string;
    bounce?: { message?: string };
  };
};

function webhookSecret(): string {
  return process.env.RESEND_WEBHOOK_SECRET?.trim() ?? "";
}

export async function POST(request: Request) {
  const secret = webhookSecret();
  if (!secret) {
    logError("Resend webhook", "RESEND_WEBHOOK_SECRET is not set");
    return Response.json({ ok: false }, { status: 503 });
  }

  const body = await request.text();
  const svixId = request.headers.get("svix-id") ?? "";
  const svixTimestamp = request.headers.get("svix-timestamp") ?? "";
  const svixSignature = request.headers.get("svix-signature") ?? "";

  let payload: ResendWebhookPayload;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendWebhookPayload;
  } catch (error) {
    logError("Resend webhook verify failed", error);
    return Response.json({ ok: false }, { status: 400 });
  }

  const eventType = typeof payload.type === "string" ? payload.type : "";
  const emailId =
    typeof payload.data?.email_id === "string" ? payload.data.email_id.trim() : "";
  const deliveryStatus = mapResendEventToDeliveryStatus(eventType);

  if (!emailId || !deliveryStatus) {
    return Response.json({ ok: true, ignored: true });
  }

  const bounceMessage =
    typeof payload.data?.bounce?.message === "string"
      ? payload.data.bounce.message
      : undefined;

  await updateForwardActivityDelivery({
    resendEmailId: emailId,
    deliveryStatus,
    bounceMessage,
  });

  return Response.json({ ok: true });
}
