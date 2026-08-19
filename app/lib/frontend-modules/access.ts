import { redirect } from "next/navigation";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";

export async function requireFrontendModule(moduleKey: string) {
  if (!(await isFrontendModuleEnabled(moduleKey))) {
    redirect("/dashboard");
  }
}
