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

function stripBOM(s: string): string {
  // Remove UTF-8 BOM if present
  return s.replace(/^\uFEFF/, "");
}

function coerceToItems(input: unknown): RawItem[] {
  if (Array.isArray(input)) return input as RawItem[];
  if (input && typeof input === "object" && "items" in (input as any)) {
    const items = (input as any).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
}

async function readJsonFromS3<T>(bucket: string, key: string): Promise<T> {
  const client = s3();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

  // In Node 18+, AWS SDK v3 streams have transformToString
  const text: string | undefined = await (res.Body as any)?.transformToString?.("utf-8");
  if (!text) throw new Error("Empty S3 body");

  const clean = stripBOM(text);
  return JSON.parse(clean) as T;
}

async function readJsonFromHttp<T>(url: string): Promise<T> {
  const u = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);

  // Use text -> strip BOM -> JSON.parse for robustness
  const txt = await res.text();
  const clean = stripBOM(txt);
  return JSON.parse(clean) as T;
}

/** Returns the playlist as an array. Tries S3 first, then falls back to CDN URL. */
export async function readPlaylist(): Promise<RawItem[]> {
  // Prefer S3 if a bucket is configured (works locally if you have creds)
  if (BUCKET) {
    try {
      const json = await readJsonFromS3<any>(BUCKET, PLAYLIST_KEY);
      return coerceToItems(json);
    } catch (e) {
      console.warn("[playlist] S3 read failed, using HTTP fallback:", e);
    }
  }

  // Fallback to public/CDN URL
  const json = await readJsonFromHttp<any>(CDN_PLAYLIST);
  return coerceToItems(json);
}
