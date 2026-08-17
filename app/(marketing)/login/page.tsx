import type { Metadata } from "next";
import { LoginForm } from "@/app/components/login-form";

export const metadata: Metadata = {
  title: "Ienākt — Routine",
};

export default function LoginPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <LoginForm />
    </div>
  );
}
