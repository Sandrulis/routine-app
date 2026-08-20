import { type NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/extension/|calendar/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ics)$).*)",
  ],
};
