import { socialShareImage, OG_IMAGE_ALT, OG_IMAGE_SIZE, OG_IMAGE_TYPE } from "@/app/lib/seo/social-image";

export const alt = OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_TYPE;

export default function OpenGraphImage() {
  return socialShareImage();
}
