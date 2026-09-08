"use server";

import { recordCurrentUserLastIp } from "@/app/lib/users/record-last-ip";

export async function recordCurrentUserLastIpAction(): Promise<void> {
  await recordCurrentUserLastIp();
}
