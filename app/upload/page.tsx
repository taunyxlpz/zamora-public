"use client";
export const dynamic = "force-dynamic";
export const revalidate = false;
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function UploadPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const session_id = sp.get("session_id");
  const kind = (sp.get("kind") as "photo"|"video"|null);
  const [paid, setPaid] = useState<boolean|null>(null);
  const [file, setFile] = useState<File|null>(null);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/stripe/check?session_id=${encodeURIComponent(session_id||"")}`);
      const data = await res.json();
      if (!data.paid || (kind && data.kind && kind !== data.kind)) {
        setPaid(false);
      } else {
        setPaid(true);
      }
    })();
  }, [session_id, kind]);

  const accept = useMemo(() => kind==="photo" ? "image/*" : "video/*", [kind]);

  if (paid === null) return <div style={{display:"grid",placeItems:"center",height:"70dvh"}}>Checking paymentâ€¦</div>;
  if (paid === false) return <div style={{display:"grid",placeItems:"center",height:"70dvh"}}>Payment not found. <button onClick={()=>router.push("/")}>Go back</button></div>;

  async function onUpload() {
    if (!file || !kind) return;
    setStatus("Requesting upload urlâ€¦");
    const key = `${kind}/${uid()}-${file.name.replace(/\s+/g,"-")}`;
    const pre = await fetch("/api/upload/presign", {
      method: "POST", headers:{"content-type":"application/json"},
      body: JSON.stringify({ key: key, contentType: file.type || "application/octet-stream" })
    }).then(r=>r.json());

    const form = new FormData();
    Object.entries(pre.fields).forEach(([k,v]) => form.append(k, String(v)));
    form.append("Content-Type", file.type);
    form.append("file", file);

    setStatus("Uploading to S3â€¦");
    const up = await fetch(pre.url, { method:"POST", body: form });
    if (up.status !== 204) { setStatus("Upload failed"); return; }

    setStatus("Moderatingâ€¦");
    const mod = await fetch("/api/moderate", {
      method: "POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify({ objectKey: pre.objectKey, targetKey: key })
    }).then(r=>r.json());
    if (!mod.ok) { setStatus("Blocked by AI moderation"); return; }

    const id = uid();
    const now = new Date();
    const start = now.toISOString();
    const end = new Date(now.getTime() + 2*60*60*1000).toISOString(); // safety window
    const duration = 10; // seconds

    setStatus("Adding to playlistâ€¦");
    await fetch("/api/playlist", {
      method: "POST",
      headers: {
        "content-type":"application/json",
        "authorization": `Bearer ${process.env.NEXT_PUBLIC_INTERNAL_API_KEY || process.env.SHOWYO_INTERNAL_API_KEY}`
      },
      body: JSON.stringify({ id, type: kind, url: mod.url, duration, start, end, plays: 1 })
    });

    setStatus("Done! Your item will play once shortly.");
  }

  return (
    <div style={{minHeight:"100dvh",display:"grid",placeItems:"center",background:"#0B0B0D",color:"#EDEDED",padding:24}}>
      <div style={{width:"min(680px,94vw)",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,boxShadow:"0 10px 35px rgba(0,0,0,.45)",padding:24}}>
        <h2 style={{marginTop:0}}>Payment Successful</h2>
        <p>Next step: upload your {kind}.</p>
        <input type="file" accept={accept} onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button onClick={onUpload} disabled={!file} style={{marginLeft:12}}>Upload</button>
        <div style={{marginTop:12,opacity:.8}}>{status}</div>
      </div>
    </div>
  );
}


