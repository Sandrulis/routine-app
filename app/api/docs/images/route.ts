import { NextResponse } from "next/server";
import { requireDocsAdminJson } from "@/app/lib/docs/assert-admin";
import { createDocsArticleImage } from "@/app/lib/docs/repository";
import {
  DOCS_IMAGE_MAX_BYTES,
  isAllowedDocsImageMime,
  isDocsImageId,
  sanitizeDocsImageFileName,
} from "@/app/lib/docs/images";
import { mimeFromFileName } from "@/app/lib/file-types";
import { mimeMatchesBytes } from "@/app/lib/security/file-bytes";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { logError } from "@/app/lib/security/log-error";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = await requireDocsAdminJson();
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  const limited = await consumeRateLimit(
    `docs-image:${requestClientIp(request)}`,
    40,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "errors.auth_rate_limited" }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "errors.docs_image_invalid" }, { status: 400 });
  }

  const articleId = String(form.get("articleId") ?? "").trim();
  const requestedId = String(form.get("id") ?? "").trim();
  const file = form.get("file");
  if (!isDocsImageId(articleId) || !(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ ok: false, error: "errors.docs_image_invalid" }, { status: 400 });
  }
  if (requestedId && !isDocsImageId(requestedId)) {
    return NextResponse.json({ ok: false, error: "errors.docs_image_invalid" }, { status: 400 });
  }
  if (file.size > DOCS_IMAGE_MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "errors.docs_image_invalid" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const fromFile = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const fromName = mimeFromFileName(file.name);
  const mimeType = isAllowedDocsImageMime(fromFile)
    ? fromFile
    : fromName === "image/jpg"
      ? "image/jpeg"
      : fromName;
  if (
    !isAllowedDocsImageMime(mimeType) ||
    !mimeMatchesBytes(file.name, mimeType, bytes)
  ) {
    return NextResponse.json({ ok: false, error: "errors.docs_image_invalid" }, { status: 400 });
  }

  try {
    const result = await createDocsArticleImage({
      articleId,
      id: requestedId || undefined,
      fileName: sanitizeDocsImageFileName(file.name),
      mimeType,
      bytes,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, image: result.data.image });
  } catch (error) {
    logError("Docs image upload failed", error);
    return NextResponse.json(
      { ok: false, error: "errors.docs_image_upload_failed" },
      { status: 500 },
    );
  }
}
