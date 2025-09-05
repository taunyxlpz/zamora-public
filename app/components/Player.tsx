"use client";
import { useEffect, useRef, useState } from "react";

type QueueItem = { src: string; duration: number; kind: "image" | "video" };
type RawItem = {
  key?: string; url?: string; duration?: number; durationSec?: number;
  startAt?: string | null; endAt?: string | null;
};

const PLAYLIST_URL =
  process.env.NEXT_PUBLIC_PLAYLIST_URL ||
  "https://cdn.showyo.live/public/playlist.json";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_PLAYLIST_REFRESH_MS || "60000");

function kindOf(u: string): "image" | "video" {
  return /\.(mp4|webm|mov)\b/i.test(u) ? "video" : "image";
}
function inferDuration(u: string, d?: number) {
  if (typeof d === "number" && d > 0) return d;
  const lower = u.toLowerCase();
  if (/\.(mp4|mov)\b/.test(lower)) return 15;
  if (/\.webm\b/.test(lower)) return 12;
  return 8;
}
function buildUrl(raw?: string) {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://cdn.showyo.live/${raw.replace(/^\/+/, "")}`;
}
function isWithinWindow(item: RawItem, nowISO: string) {
  const now = new Date(nowISO).getTime();
  const s = item.startAt ? new Date(item.startAt).getTime() : undefined;
  const e = item.endAt ? new Date(item.endAt).getTime() : undefined;
  if (s && now < s) return false;
  if (e && now > e) return false;
  return true;
}

export default function Player() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState("init");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function load() {
    try {
      const nowISO = new Date().toISOString();
      const res = await fetch(`${PLAYLIST_URL}?v=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      const items: RawItem[] = Array.isArray(json) ? json : json?.items || [];
      const normalized: QueueItem[] = items
        .filter(it => isWithinWindow(it, nowISO))
        .map(it => {
          const raw = it.url || it.key || "";
          const src = buildUrl(raw);
          const duration = inferDuration(src, it.duration ?? it.durationSec);
          return { src, duration, kind: kindOf(src) };
        })
        .filter(q => !!q.src);

      if (normalized.length === 0) {
        setQueue([]); setIdx(0); setStatus("empty");
      } else {
        setQueue(normalized);
        setIdx(prev => Math.min(prev, normalized.length - 1));
        setStatus(`ok:${normalized.length}`);
      }
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!queue.length) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const cur = queue[idx];
    timerRef.current = setTimeout(
      () => setIdx((i) => (i + 1) % queue.length),
      Math.max(1000, cur.duration * 1000)
    );
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [queue, idx]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const current = queue[idx];

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000", color: "#fff"
    }}>
      {!current && <div>Waiting… ({status})</div>}
      {current?.kind === "image" && (
        <img src={current.src} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="" />
      )}
      {current?.kind === "video" && (
        <video key={current.src} src={current.src} autoPlay muted playsInline
               style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      )}
    </div>
  );
}
