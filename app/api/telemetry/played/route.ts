import { S3Client, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s3 = new S3Client({ region: process.env.AWS_REGION });

async function readJSON(bucket:string, key:string) {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await r.Body!.transformToString();
    return JSON.parse(text || "[]");
  } catch { return []; }
}
async function writeJSON(bucket:string, key:string, data:any) {
  const Body = Buffer.from(JSON.stringify(data, null, 2));
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body,
    ContentType: "application/json",
    CacheControl: "no-cache, no-store, must-revalidate, max-age=0",
  }));
}

export async function POST(req: Request) {
  const bucket = process.env.S3_BUCKET!;
  const playlistKey = "public/playlist.json";

  const items = await readJSON(bucket, playlistKey);
  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ ok:true, empty:true }), { status:200 });
  }

  const [first, ...rest] = items;
  await writeJSON(bucket, playlistKey, rest);

  if (first?.key) {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth()+1).padStart(2,"0");
    const d = String(now.getUTCDate()).padStart(2,"0");
    const base = process.env.ARCHIVE_PREFIX || "archive";
    const destKey = `${base}/${y}-${m}-${d}/${first.key.split("/").slice(-1)[0]}`;

    await s3.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${first.key}`, Key: destKey }));
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: first.key }));
  }

  return new Response(JSON.stringify({ ok:true }), { status:200 });
}
