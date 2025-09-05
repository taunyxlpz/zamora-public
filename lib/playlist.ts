import "server-only";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export type RawItem = {
  key?: string;
  url?: string;
  kind?: "photo" | "video";
  duration?: number;
  durationSec?: number;
  startAt?: string | null;
  endAt?: string | null;
};

const BUCKET = process.env.S3_BUCKET || "";
const REGION = process.env.AWS_REGION || "us-east-1";
const PLAYLIST_KEY = "public/playlist.json";
const CDN_PLAYLIST =
  process.env.NEXT_PUBLIC_PLAYLIST_URL ||
  "https://cdn.showyo.live/public/playlist.json";

function s3(): S3Client {
  return new S3Client({ region: REGION });
}

async function readJsonFromS3<T>(bucket: string, key: string): Promise<T> {
  const client = s3();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await (res.Body as any)?.transformToString?.("utf-8");
  if (!body) throw new Error("Empty S3 body");
  return JSON.parse(body) as T;
}

async function readJsonFromHttp<T>(url: string): Promise<T> {
  const u = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
  return (await res.json()) as T;
}

/** Returns the playlist as an array. Tries S3 first, then falls back to CDN URL. */
export async function readPlaylist(): Promise<RawItem[]> {
  if (BUCKET) {
    try {
      const json = await readJsonFromS3<any>(BUCKET, PLAYLIST_KEY);
      return Array.isArray(json) ? json : json?.items ?? [];
    } catch (e) {
      console.warn("[playlist] S3 read failed, using HTTP fallback:", e);
    }
  }
  const json = await readJsonFromHttp<any>(CDN_PLAYLIST);
  return Array.isArray(json) ? json : json?.items ?? [];
}