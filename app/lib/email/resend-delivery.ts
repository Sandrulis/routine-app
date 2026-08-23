import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import type { TaskActivity, TaskActivityMetadata } from "@/app/lib/task-activity";

export type ForwardDeliveryStatus =
  | "sent"
  | "delivered"
  | "delayed"
  | "bounced"
  | "failed";

export type ForwardActivityMetadata = TaskActivityMetadata & {
  to?: string;
  subject?: string;
  fileId?: string;
  resendEmailId?: string;
  deliveryStatus?: ForwardDeliveryStatus;
  bounceMessage?: string;
};

export function parseForwardMetadata(
  meta: TaskActivityMetadata | undefined,
): ForwardActivityMetadata | null {
  if (!meta || typeof meta !== "object") return null;
  return meta as ForwardActivityMetadata;
}

export function isForwardDeliveryFailed(
  status: ForwardDeliveryStatus | undefined,
): boolean {
  return status === "bounced" || status === "failed";
}

export function mapResendEventToDeliveryStatus(
  event: string | null | undefined,
): ForwardDeliveryStatus | null {
  const value = String(event || "")
    .trim()
    .toLowerCase()
    .replace(/^email\./, "");
  if (value === "bounced") return "bounced";
  if (value === "failed") return "failed";
  if (value === "delivered" || value === "opened" || value === "clicked") {
    return "delivered";
  }
  if (value === "delivery_delayed" || value === "delayed") return "delayed";
  if (value === "sent" || value === "queued") return "sent";
  return null;
}

export async function fetchResendEmailLastEvent(
  emailId: string,
): Promise<{ lastEvent: string | null; bounceMessage?: string } | null> {
  const credentials = await getResendCredentials();
  if (!credentials) return null;
  const id = emailId.trim();
  if (!id) return null;

  try {
    const response = await fetch(
      `https://api.resend.com/emails/${encodeURIComponent(id)}`,
      {
        headers: { Authorization: `Bearer ${credentials.apiKey}` },
      },
    );
    if (!response.ok) {
      logError(
        "Resend email retrieve failed",
        `${response.status} ${await response.text().catch(() => "")}`,
      );
      return null;
    }
    const data = (await response.json()) as {
      last_event?: string;
      bounce?: { message?: string };
    };
    return {
      lastEvent: typeof data.last_event === "string" ? data.last_event : null,
      bounceMessage:
        typeof data.bounce?.message === "string"
          ? data.bounce.message
          : undefined,
    };
  } catch (error) {
    logError("Resend email retrieve failed", error);
    return null;
  }
}

export async function updateForwardActivityDelivery(input: {
  resendEmailId: string;
  deliveryStatus: ForwardDeliveryStatus;
  bounceMessage?: string;
}): Promise<TaskActivity | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const emailId = input.resendEmailId.trim();
  if (!emailId) return null;

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("task_activities")
    .select(
      "id, task_id, actor_id, kind, text, previous_text, file_name, metadata, created_at",
    )
    .eq("kind", "file_forwarded")
    .filter("metadata->>resendEmailId", "eq", emailId)
    .limit(5);

  if (error) {
    logError("updateForwardActivityDelivery select failed", error.message);
    return null;
  }

  const row = (rows ?? [])[0];
  if (!row?.id) return null;

  const previous =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as ForwardActivityMetadata)
      : {};
  const nextMeta: ForwardActivityMetadata = {
    ...previous,
    resendEmailId: emailId,
    deliveryStatus: input.deliveryStatus,
    ...(input.bounceMessage
      ? { bounceMessage: input.bounceMessage }
      : previous.bounceMessage
        ? { bounceMessage: previous.bounceMessage }
        : {}),
  };

  if (
    previous.deliveryStatus === input.deliveryStatus &&
    (previous.bounceMessage || "") === (nextMeta.bounceMessage || "")
  ) {
    return {
      id: String(row.id),
      taskId: String(row.task_id),
      actorId: String(row.actor_id),
      kind: "file_forwarded",
      at: String(row.created_at),
      text: row.text ?? undefined,
      previousText: row.previous_text ?? undefined,
      fileName: row.file_name ?? undefined,
      metadata: nextMeta,
    };
  }

  const { error: updateError } = await admin
    .from("task_activities")
    .update({ metadata: nextMeta })
    .eq("id", row.id);

  if (updateError) {
    logError("updateForwardActivityDelivery update failed", updateError.message);
    return null;
  }

  return {
    id: String(row.id),
    taskId: String(row.task_id),
    actorId: String(row.actor_id),
    kind: "file_forwarded",
    at: String(row.created_at),
    text: row.text ?? undefined,
    previousText: row.previous_text ?? undefined,
    fileName: row.file_name ?? undefined,
    metadata: nextMeta,
  };
}

export async function refreshTaskForwardDeliveryStatuses(
  taskId: string,
): Promise<TaskActivity[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const trimmed = taskId.trim();
  if (!trimmed) return [];

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("task_activities")
    .select(
      "id, task_id, actor_id, kind, text, previous_text, file_name, metadata, created_at",
    )
    .eq("task_id", trimmed)
    .eq("kind", "file_forwarded")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    logError("refreshTaskForwardDeliveryStatuses failed", error.message);
    return [];
  }

  const updated: TaskActivity[] = [];
  for (const row of rows ?? []) {
    const meta = parseForwardMetadata(
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as TaskActivityMetadata)
        : undefined,
    );
    const emailId = meta?.resendEmailId?.trim() ?? "";
    const status = meta?.deliveryStatus;
    if (!emailId) continue;
    if (status === "delivered" || status === "bounced" || status === "failed") {
      continue;
    }

    const remote = await fetchResendEmailLastEvent(emailId);
    if (!remote?.lastEvent) continue;
    const nextStatus = mapResendEventToDeliveryStatus(remote.lastEvent);
    if (!nextStatus || nextStatus === status) continue;

    const activity = await updateForwardActivityDelivery({
      resendEmailId: emailId,
      deliveryStatus: nextStatus,
      bounceMessage: remote.bounceMessage,
    });
    if (activity) updated.push(activity);
  }

  return updated;
}
