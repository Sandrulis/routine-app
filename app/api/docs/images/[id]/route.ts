import { NextResponse } from "next/server";
import { requireDocsAdminJson } from "@/app/lib/docs/assert-admin";
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

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type ImageRow = {
  file_name: string;
  mime_type: string;
  content: string;
  site_docs_articles:
    | {
        is_visible: boolean;
        site_docs_categories: { is_visible: boolean } | { is_visible: boolean }[] | null;
      }
    | {
        is_visible: boolean;
        site_docs_categories: { is_visible: boolean } | { is_visible: boolean }[] | null;
      }[]
    | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!isDocsImageId(id) || !isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const [{ data, error }, settings] = await Promise.all([
    admin
      .from("site_docs_article_images")
      .select(
        "file_name, mime_type, content, site_docs_articles(is_visible, site_docs_categories(is_visible))",
      )
      .eq("id", id)
      .maybeSingle(),
    admin.from("site_settings").select("docs_enabled").eq("id", 1).maybeSingle(),
  ]);
  if (error || !data?.content) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const row = data as ImageRow;
  const article = asOne(row.site_docs_articles);
  const category = asOne(article?.site_docs_categories);
  const docsEnabled = (settings.data as { docs_enabled?: boolean } | null)?.docs_enabled === true;
  const isPublic =
    docsEnabled && article?.is_visible === true && category?.is_visible === true;

  if (!isPublic) {
    const access = await requireDocsAdminJson();
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
  }

  const parsed = parseImageDataUrl(String(row.content));
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const fileName = String(row.file_name || "image");
  return new NextResponse(new Uint8Array(parsed.bytes), {
    status: 200,
    headers: {
      "Content-Type": parsed.mime,
      "Content-Length": String(parsed.bytes.byteLength),
      "Content-Disposition": contentDispositionForFile(fileName, parsed.mime, false),
      "Cache-Control": isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
