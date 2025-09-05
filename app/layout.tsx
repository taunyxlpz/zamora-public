import "./globals.css";
import Image from "next/image";
import type { ReactNode } from "react";

export const metadata = {
  title: "ShowYo",
  description: "Public upload portal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0B0B0D", color: "#EDEDED" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            position: "sticky",
            top: 0,
            background: "rgba(11,11,13,.9)",
            backdropFilter: "saturate(140%) blur(6px)",
            zIndex: 100,
          }}
        >
          <Image
            src="/showyo-logo.png"
            alt="ShowYo"
            width={160}
            height={50}
            priority
            style={{ height: 36, width: "auto" }}
          />
        </header>
        <main style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}