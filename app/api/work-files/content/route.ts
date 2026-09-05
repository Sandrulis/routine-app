import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { loadWorkFileBytes } from "@/app/lib/cloud-storage/load-work-file-bytes";
import { contentDispositionForFile } from "@/app/lib/security/file-bytes";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "errors.auth_required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id")?.trim() ?? "";
  if ((kind !== "list" && kind !== "task") || !id) {
    return NextResponse.json({ ok: false, error: "errors.not_found" }, { status: 400 });
  }

  const loaded = await loadWorkFileBytes({ kind, fileId: id });
  if (!loaded.ok) {
    return NextResponse.json(
      { ok: false, error: loaded.error },
      { status: loaded.status },
    );
  }

  const asDownload = searchParams.get("download") === "1";
  const mime = loaded.file.mimeType || "application/octet-stream";
  return new NextResponse(new Uint8Array(loaded.file.bytes), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": contentDispositionForFile(
        loaded.file.fileName,
        mime,
        asDownload,
      ),
      "Cache-Control": "private, no-store",
    },
  });
}
