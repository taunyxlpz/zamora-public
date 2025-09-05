import { Suspense } from "react";

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{padding:16}}>Loading…</div>}>
      {children}
    </Suspense>
  );
}