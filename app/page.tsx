"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const go = (kind: "photo" | "video") => {
    router.push(`/upload?kind=${kind}`);
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      background: "#0B0B0D",
      color: "#EDEDED",
      padding: "24px"
    }}>
      <div style={{
        width: "min(640px, 94vw)",
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 16,
        boxShadow: "0 10px 35px rgba(0,0,0,.45)",
        padding: 24
      }}>
        <h1 style={{fontSize: 28, fontWeight: 800, margin: 0}}>ShowYo Public Portal</h1>
        <p style={{opacity:.8, margin: "8px 0 18px"}}>
          Upload → AI moderation → Auto-play on the screen → Auto-delete.
        </p>

        <div style={{display:"grid", gap:12}}>
          <button
            onClick={() => go("photo")}
            style={{
              height: 48, borderRadius: 12, border: "none",
              fontWeight: 800, cursor: "pointer",
              background: "#FFD400", color: "#111"
            }}
          >
            Upload Picture — Free
          </button>

          <button
            onClick={() => go("video")}
            style={{
              height: 48, borderRadius: 12, border: "none",
              fontWeight: 800, cursor: "pointer",
              background: "#04E1C3", color: "#001815"
            }}
          >
            Upload Video — Free
          </button>
        </div>

        <p style={{opacity:.6, fontSize:12, marginTop:14}}>
          Your file is moderated automatically, then it plays once on the public screen and is removed.
        </p>
      </div>
    </div>
  );
}