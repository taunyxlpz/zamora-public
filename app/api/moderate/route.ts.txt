import { S3Client, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const rek = new RekognitionClient({ region: process.env.AWS_REGION });

async function readJSON(bucket:string, key:string) {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await r.Body!.transformToString();
    return JSON.parse(text || "[]");
  } catch { return []; }
}

async function writeJSON(bucket:string, key:string, data: any) {
  const Body = Buffer.from(JSON.stringify(data, null, 2));
  await s3.send(new PutObjectCommand({
    Bucket: bucket, Key: key, Body,
    ContentType: "application/json",
    CacheControl: "no-cache, no-store, must-revalidate, max-age=0",
  }));
}

export async function POST(req: Request) {
  try {
    const { key, kind }:{ key:string, kind:"photo"|"video" } = await req.json();
    if (!key || !kind) return NextResponse.json({ error:"key & kind required" }, { status:400 });

    const bucket = process.env.S3_BUCKET!;
    const min = Number(process.env.MODERATION_MIN_CONFIDENCE || "85");

    // Rekognition supports image/video differently; for MVP we moderate images by label, videos by extension (allowlist)
    if (kind === "photo") {
      const img = key;
      const det = await rek.send(new DetectModerationLabelsCommand({
        Image: { S3Object: { Bucket: bucket, Name: img } },
        MinConfidence: min,
      }));
      const blocked = (det.ModerationLabels || []).some(l => (l.Confidence || 0) >= min);
      if (blocked) {
        // move to rejected
        await s3.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${key}`, Key: key.replace("uploads/pending/","uploads/rejected/") }));
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        return NextResponse.json({ status:"rejected" }, { status: 403 });
      }
    } else {
      // rudimentary allowlist for video types
      if (!/\.(mp4|webm|mov)$/i.test(key)) {
        return NextResponse.json({ error:"unsupported video type" }, { status: 400 });
      }
    }

    // Approved → move to approved/{photo|video}/...
    const destKey = key
      .replace("uploads/pending/", `approved/${kind}/`)
      .replace("/rejected/","/"); // just in case

    await s3.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${key}`, Key: destKey, }));
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    // Update playlist.json = append item
    const playlistKey = "public/playlist.json";
    const items = await readJSON(bucket, playlistKey); // array
    items.push({
      key: destKey,
      url: `${process.env.CDN_BASE_URL!.replace(/\/$/,"")}/${destKey}`,
      kind,
      duration: kind === "video" ? 10 : 10,
    });
    await writeJSON(bucket, playlistKey, items);

    return NextResponse.json({ status:"approved", key: destKey });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "moderation failed" }, { status: 500 });
  }
}
