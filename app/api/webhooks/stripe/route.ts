import { logError } from "@/app/lib/security/log-error";
import { getStripeCredentials } from "@/app/lib/integrations/stripe/client";
import {
  dropUnusedSeatsAtRenewal,
  findTeamIdByCustomer,
  markTeamUnpaid,
  syncSubscriptionById,
} from "@/app/lib/billing/subscription";
import Stripe from "stripe";

export const runtime = "nodejs";

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const raw = invoice as Stripe.Invoice & {
    subscription?: string | { id?: string } | null;
    parent?: { subscription_details?: { subscription?: string | null } | null } | null;
  };
  if (typeof raw.subscription === "string") return raw.subscription;
  if (raw.subscription && typeof raw.subscription === "object") {
    return raw.subscription.id ?? "";
  }
  return raw.parent?.subscription_details?.subscription ?? "";
}

export async function POST(request: Request) {
  const credentials = await getStripeCredentials();
  if (!credentials) {
    logError("Stripe webhook", "Stripe is not enabled");
    return Response.json({ ok: false }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, signature, credentials.webhookSecret);
  } catch (error) {
    logError("Stripe webhook verify failed", error);
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const teamId = session.metadata?.teamId || session.client_reference_id || "";
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (teamId && subscriptionId) {
          await syncSubscriptionById(subscriptionId, teamId);
        }
        break;
      }
      case "invoice.created": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.billing_reason !== "subscription_cycle") break;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (!subscriptionId) break;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        const teamId =
          invoice.metadata?.teamId ||
          (customerId ? await findTeamIdByCustomer(customerId) : "");
        if (!teamId) break;
        const stripe = new Stripe(credentials.secretKey);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await dropUnusedSeatsAtRenewal({ teamId, subscription });
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoiceSubscriptionId(invoice);
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        const teamId =
          invoice.metadata?.teamId ||
          (invoice as Stripe.Invoice & {
            subscription_details?: { metadata?: { teamId?: string } | null };
          }).subscription_details?.metadata?.teamId ||
          (customerId ? await findTeamIdByCustomer(customerId) : "");
        if (subscriptionId) {
          await syncSubscriptionById(subscriptionId, teamId || undefined);
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          await syncSubscriptionById(subscriptionId);
        } else if (customerId) {
          const teamId = await findTeamIdByCustomer(customerId);
          if (teamId) await markTeamUnpaid(teamId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const teamId =
          subscription.metadata.teamId ||
          (typeof subscription.customer === "string"
            ? await findTeamIdByCustomer(subscription.customer)
            : "");
        if (!teamId) break;
        await syncSubscriptionById(subscription.id, teamId);
        if (
          event.type === "customer.subscription.deleted" ||
          subscription.status === "canceled" ||
          subscription.status === "unpaid" ||
          subscription.status === "incomplete_expired"
        ) {
          await markTeamUnpaid(teamId);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    logError("Stripe webhook handler failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
