import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LandingPage } from "@/app/components/landing-page";
import { LandingJsonLd } from "@/app/components/landing-json-ld";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { canonicalMetadata } from "@/app/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return canonicalMetadata("/");
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  );
}
