import { NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET =
  process.env.S3_UPLOAD_BUCKET ||
  process.env.NEXT_PUBLIC_S3_UPLOAD_BUCKET ||
  "";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const contentType = (body?.contentType as string) || "application/octet-stream";
    const kind = (body?.kind as "photo" | "video") || "photo";

    // Simple unique key
    const uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const objectKey = `pending/${kind}/${uid}`;

    const s3 = new S3Client({ region: REGION });

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: BUCKET,
      Key: objectKey,
      Conditions: [["content-length-range", 1, 1024 * 1024 * 512]], // up to 512MB
      Fields: { "Content-Type": contentType },
      Expires: 60, // seconds
    });

    return NextResponse.json({ url, fields, objectKey });
  } catch (err) {
    console.error("presign error", err);
    return NextResponse.json({ error: "presign_failed" }, { status: 500 });
  }
}