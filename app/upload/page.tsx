"use client";
import { useSearchParams } from "next/navigation";

export default function UploadHandoff() {
  const qp = useSearchParams();
  const sessionId = qp.get("session_id");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0b0b",
        color: "#fff",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#141414",
          border: "1px solid #222",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Payment Successful</h1>
        <p style={{ opacity: 0.85 }}>
          Your Stripe session: <code>{sessionId || "(unknown)"}</code>
        </p>
        <p style={{ opacity: 0.85 }}>
          Next step: upload your file. (Hook this page into your upload flow:
          presign to S3, AI moderation, approve, then it appears in the playlist
          and plays once automatically.)
        </p>
      </div>
    </main>
  );
}
