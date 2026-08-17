import type { Metadata } from "next";
import { SignupForm } from "@/app/components/signup-form";

export const metadata: Metadata = {
  title: "Reģistrēties — Routine",
};

export default function SignupPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <SignupForm />
    </div>
  );
}
