import { NextResponse } from "next/server";
import { isDocsImageId } from "@/app/lib/docs/images";
import { contentDispositionForFile } from "@/app/lib/security/file-bytes";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseImageDataUrl(content: string): { mime: string; bytes: Buffer } | null {
  const match = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    content,
  );
  if (!match) return null;
  return { mime: match[1], bytes: Buffer.from(match[2], "base64") };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isDocsImageId(id) || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_docs_article_images")
    .select("file_name, mime_type, content")
    .eq("id", id)
    .maybeSingle();
  if (error || !data?.content) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const parsed = parseImageDataUrl(String(data.content));
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const fileName = String(data.file_name || "image");
  return new NextResponse(new Uint8Array(parsed.bytes), {
    status: 200,
    headers: {
      "Content-Type": parsed.mime,
      "Content-Length": String(parsed.bytes.byteLength),
      "Content-Disposition": contentDispositionForFile(fileName, parsed.mime, false),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
