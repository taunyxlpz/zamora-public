"use client";
import { useState } from "react";

async function startCheckout(kind: "photo"|"video") {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ kind })
  });
  if (!res.ok) throw new Error("Checkout error");
  const { url } = await res.json();
  location.href = url;
}

export default function Home() {
  const [busy, setBusy] = useState<"photo"|"video"|null>(null);
  return (
    <div style={{minHeight:"100dvh",display:"grid",placeItems:"center",background:"#0B0B0D",color:"#EDEDED",padding:24}}>
      <div style={{width:"min(640px,94vw)",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,boxShadow:"0 10px 35px rgba(0,0,0,.45)",padding:24}}>
        <h1 style={{fontSize:28,fontWeight:800,margin:0}}>ShowYo Public Portal</h1>
        <p style={{opacity:.8,margin:"8px 0 18px"}}>Pay → Upload → AI moderation → Auto-play once → Auto-delete.</p>

        <div style={{display:"grid",gap:12}}>
          <button onClick={async ()=>{setBusy("photo"); try{await startCheckout("photo");} finally{setBusy(null)}}}
            disabled={busy!==null} style={{height:48,borderRadius:12,border:"none",fontWeight:800,cursor:"pointer",background:"#FFD400",color:"#111"}}>
            {busy==="photo"?"Redirecting…":"Upload Picture — $10"}
          </button>

          <button onClick={async ()=>{setBusy("video"); try{await startCheckout("video");} finally{setBusy(null)}}}
            disabled={busy!==null} style={{height:48,borderRadius:12,border:"none",fontWeight:800,cursor:"pointer",background:"#04E1C3",color:"#001815"}}>
            {busy==="video"?"Redirecting…":"Upload Video — $20"}
          </button>
        </div>

        <p style={{opacity:.6,fontSize:12,marginTop:14}}>
          After payment you’ll be redirected to the upload page automatically.
        </p>
      </div>
    </div>
  );
}