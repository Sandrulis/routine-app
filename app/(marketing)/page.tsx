import { redirect } from "next/navigation";
import { LandingPage } from "@/app/components/landing-page";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
