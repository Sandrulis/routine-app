import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE } from "@/app/lib/seo/share-image";

export {
  OG_IMAGE_ALT,
  OG_IMAGE_SIZE,
  OG_IMAGE_TYPE,
  OG_IMAGE_PATH,
  TWITTER_IMAGE_PATH,
} from "@/app/lib/seo/share-image";

export function socialShareImage(input?: {
  name?: string;
  tagline?: string;
}) {
  const name = input?.name?.trim() || "TASQIN";
  const tagline = input?.tagline?.trim() || "Team task management";
  const mark = name.slice(0, 1).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#18181b",
          color: "#fafafa",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 16,
            height: "100%",
            background: "#f97316",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px 64px 80px",
            width: 1184,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "#f97316",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 800,
                marginRight: 20,
              }}
            >
              {mark}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.06em",
              }}
            >
              {name}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1.12,
                maxWidth: 960,
              }}
            >
              {tagline}
            </div>
            <div
              style={{
                marginTop: 24,
                width: 96,
                height: 6,
                borderRadius: 999,
                background: "#f97316",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "#a1a1aa",
              letterSpacing: "0.04em",
            }}
          >
            tasqin.com
          </div>
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
