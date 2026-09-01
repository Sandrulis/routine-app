import sharp from "sharp";

const PREVIEW_WIDTH = 32;

export async function createDocsImagePreview(bytes: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(bytes)
      .rotate()
      .resize({
        width: PREVIEW_WIDTH,
        withoutEnlargement: true,
      })
      .webp({ quality: 20, effort: 1 })
      .toBuffer();
  } catch {
    return null;
  }
}
