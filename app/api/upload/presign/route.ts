import { NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: Request) {
  const { key, contentType } = await req.json() as { key: string, contentType: string };
  if (!key) return NextResponse.json({error:"missing key"},{status:400});

  const bucket = process.env.AWS_S3_BUCKET!;
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: `pending/${key}`,
    Conditions: [["content-length-range", 1, 1024*1024*512]], // up to 512MB
    Fields: { "Content-Type": contentType }
  }, { expiresIn: 60 });

  return NextResponse.json({ url, fields, objectKey: `pending/${key}` });
}