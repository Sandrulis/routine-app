"use client";

import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";

export function GmailPluginMfaGate() {
  return (
    <MfaVerifyModal
      open
      mode="login"
      onVerified={() => {
        window.location.reload();
      }}
    />
  );
}
