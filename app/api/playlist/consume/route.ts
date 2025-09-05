import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const Bucket = process.env.AWS_S3_BUCKET!;
const KEY = "public/playlist.json";

async function load(): Promise<any[]> {
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket, Key: KEY }));
    const text = await obj.Body!.transformToString();
    return JSON.parse(text);
  } catch { return []; }
}

export async function POST(req: Request) {
  const { id } = await req.json() as { id:string };
  if (!id) return NextResponse.json({error:"missing id"},{status:400});
  const items = (await load()).filter(i => i.id !== id);
  await s3.send(new PutObjectCommand({ Bucket, Key: KEY, Body: JSON.stringify(items), ContentType: "application/json" }));
  return NextResponse.json({ ok:true });
}