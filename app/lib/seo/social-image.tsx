import { ImageResponse } from "next/og";

export const OG_IMAGE_ALT = "TASQIN — komandas uzdevumu pārvaldība";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export const OG_IMAGE_TYPE = "image/png";

export function socialShareImage(input?: {
  name?: string;
  tagline?: string;
}) {
  const name = input?.name?.trim() || "TASQIN";
  const tagline =
    input?.tagline?.trim() ||
    "Komandas uzdevumi, projekti un termiņi vienā darbvietā.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          color: "#fafafa",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#f4f4f5",
              color: "#09090b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
          {name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.1,
              maxWidth: 920,
            }}
          >
            Komandas uzdevumu pārvaldība bez liekas sarežģītības
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#a1a1aa",
              lineHeight: 1.35,
              maxWidth: 820,
            }}
          >
            {tagline}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: 20,
            color: "#d4d4d8",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "#27272a",
            }}
          >
            Uzdevumi
          </div>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "#27272a",
            }}
          >
            Projekti
          </div>
          <div
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: "#27272a",
            }}
          >
            Termiņi
          </div>
        </div>
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
