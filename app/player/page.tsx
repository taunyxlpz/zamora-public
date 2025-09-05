"use client";
import { useEffect, useRef, useState } from "react";
type Item = { key: string; url: string; kind: "photo"|"video"; duration?: number };

export default function Player() {
  const [list, setList] = useState<Item[]>([]);
  const timer = useRef<any>(null);

  async function load() {
    const r = await fetch("/api/playlist",{cache:"no-store"}).then(r=>r.json()).catch(()=>({items:[]}));
    setList(r.items || []);
  }
  async function markPlayed(key: string) {
    await fetch("/api/telemetry/played", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key })
    }).catch(()=>null);
    await load();
  }
  useEffect(()=>{ load(); const t=setInterval(load,60000); return ()=>clearInterval(t); },[]);
  useEffect(()=>{
    if (!list.length) return;
    const cur = list[0]; // always show first, then remove/archive
    if (!cur) return;
    if (timer.current) clearTimeout(timer.current);
    if (cur.kind === "photo") {
      const ms = Math.max(1000,(cur.duration ?? 10)*1000);
      timer.current = setTimeout(()=>markPlayed(cur.key), ms);
    }
    // videos handled on onEnded/onError below
  },[list]);

  const cur = list[0];
  if (!cur) return <div style={{color:"#fff",display:"grid",placeItems:"center",height:"100vh"}}>Waiting…</div>;

  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#000"}}>
      {cur.kind === "photo" ? (
        <img src={cur.url} alt="" style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} onError={()=>markPlayed(cur.key)} />
      ) : (
        <video
          key={cur.key}
          src={cur.url}
          autoPlay muted playsInline
          style={{width:"100%",height:"100%",objectFit:"contain"}}
          onEnded={()=>markPlayed(cur.key)}
          onError={()=>markPlayed(cur.key)}
          onLoadedMetadata={(e)=>{
            const v = e.currentTarget;
            if (timer.current) clearTimeout(timer.current);
            const ms = Math.max(1000, (isFinite(v.duration) ? v.duration : (cur.duration ?? 10)) * 1000);
            timer.current = setTimeout(()=>markPlayed(cur.key), ms+500);
          }}
        />
      )}
    </div>
  );
}
