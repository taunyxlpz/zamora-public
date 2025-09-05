// app/page.tsx
"use client";

import { useState } from "react";

export default function PublicPortal() {
  const [loading, setLoading] = useState<"photo" | "video" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(kind: "photo" | "video") {
    try {
      setError(null);
      setLoading(kind);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });

      const json = await res.json();
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || "Unable to start checkout.");
      }

      // Stripe Checkout redirect
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setLoading(null);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0b0b",
        color: "#fff",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#141414",
          border: "1px solid #222",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
      >
        <header style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 32, lineHeight: 1.1 }}>
            ShowYo Public Portal
          </h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Pay → Upload → AI moderation → Auto-play on the screen → Auto-delete.
          </p>
        </header>

        <div style={{ display: "grid", gap: 14 }}>
          <button
            onClick={() => startCheckout("photo")}
            disabled={!!loading}
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid #333",
              background: loading === "photo" ? "#222" : "#ffd400",
              color: "#000",
              fontWeight: 800,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading === "photo" ? "Starting checkout…" : "Upload Picture — $10"}
          </button>

          <button
            onClick={() => startCheckout("video")}
            disabled={!!loading}
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid #333",
              background: loading === "video" ? "#222" : "#00e0a4",
              color: "#000",
              fontWeight: 800,
              fontSize: 18,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading === "video" ? "Starting checkout…" : "Upload Video — $20"}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 16, color: "#ff6b6b" }}>{error}</p>
        )}

        <footer style={{ marginTop: 20, fontSize: 12, opacity: 0.65 }}>
          You’ll be redirected to Stripe. After successful payment you’ll land on
          the upload page, your file is moderated automatically, then it plays
          once on the public screen and is removed.
        </footer>
      </div>
    </main>
  );
}
