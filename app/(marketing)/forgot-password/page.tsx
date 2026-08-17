import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Aizmirsi paroli — Routine",
};

export default function ForgotPasswordPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <ForgotPasswordForm />
    </div>
  );
}
