"use client";

import { useState } from "react";

export default function BuyPage() {
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
        throw new Error(json?.error || "Unable to create checkout session");
      }
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
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
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#141414",
          border: "1px solid #222",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Buy a Slot</h1>
        <p style={{ margin: "0 0 24px", opacity: 0.8 }}>
          Choose what you want to show on the public screen. After payment,
          you’ll upload your file and it will be moderated automatically.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => startCheckout("photo")}
            disabled={!!loading}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: loading === "photo" ? "#222" : "#ffd400",
              color: "#000",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading === "photo" ? "Starting checkout…" : "Buy Photo – $10"}
          </button>

          <button
            onClick={() => startCheckout("video")}
            disabled={!!loading}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: loading === "video" ? "#222" : "#00e0a4",
              color: "#000",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading === "video" ? "Starting checkout…" : "Buy Video – $20"}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 16, color: "#ff6b6b" }}>
            {error}
          </p>
        )}

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.65 }}>
          You’ll be redirected to Stripe. After successful payment you’ll land
          on the upload page to submit your file.
        </p>
      </div>
    </main>
  );
}
