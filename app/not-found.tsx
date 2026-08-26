import { redirect } from "next/navigation";

/** Unknown or unavailable UI routes go to the app home — no public 404 surface. */
export default function NotFound() {
  redirect("/dashboard");
}
