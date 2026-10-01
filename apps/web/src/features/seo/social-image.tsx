import { ImageResponse } from "next/og";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function createSocialImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#111418",
        color: "#f2eadf",
        padding: "76px 84px",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "48px",
          display: "flex",
          border: "1px solid rgba(242, 234, 223, 0.14)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "88px",
          top: "78px",
          width: "260px",
          height: "260px",
          display: "flex",
          border: "1px solid rgba(114, 151, 167, 0.32)",
          borderRadius: "999px",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "213px",
          top: "78px",
          width: "1px",
          height: "390px",
          display: "flex",
          background: "rgba(114, 151, 167, 0.22)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
          color: "#b98761",
          fontSize: "22px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        <span>AKB Studio</span>
        <span style={{ width: "84px", height: "1px", background: "#b98761" }} />
        <span style={{ color: "rgba(242, 234, 223, 0.58)" }}>Field 01</span>
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", maxWidth: "820px" }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            lineHeight: 1.04,
            letterSpacing: "-0.045em",
            fontWeight: 650,
          }}
        >
          Anurag Kumar Bharti
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "28px",
            fontSize: "28px",
            lineHeight: 1.4,
            color: "rgba(242, 234, 223, 0.68)",
          }}
        >
          Engineering projects, field notes and technical knowledge.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "rgba(242, 234, 223, 0.46)",
          fontSize: "18px",
          letterSpacing: "0.08em",
        }}
      >
        <span>SOFTWARE · ELECTRICAL · AUTOMATION · ROBOTICS</span>
        <span>BETTIAH / INDIA</span>
      </div>
    </div>,
    SOCIAL_IMAGE_SIZE,
  );
}
