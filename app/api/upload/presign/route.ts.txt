import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: Request) {
  try {
    const { filename, contentType, kind } = await req.json();
    if (!filename || !contentType || !kind) {
      return NextResponse.json({ error:"filename, contentType, kind required" }, { status:400 });
    }
    const ext = filename.split(".").pop()?.toLowerCase() || "bin";
    const key = `uploads/pending/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Conditions: [
        ["content-length-range", 0, 50_000_000], // 50MB
        ["starts-with", "$Content-Type", ""],
      ],
      Fields: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
      Expires: 60,
    });

    return NextResponse.json({ url, fields: { ...fields, key } });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "presign failed" }, { status: 500 });
  }
}
