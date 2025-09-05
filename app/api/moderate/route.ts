import { NextResponse } from "next/server";
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { RekognitionClient, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const rek = new RekognitionClient({ region: process.env.AWS_REGION });

export async function POST(req: Request) {
  const { objectKey, targetKey } = await req.json() as { objectKey:string, targetKey:string };
  const Bucket = process.env.AWS_S3_BUCKET!;
  // Rekognition only supports bytes or S3 object
  const det = await rek.send(new DetectModerationLabelsCommand({
    Image: { S3Object: { Bucket, Name: objectKey } },
    MinConfidence: 80
  }));
  const blocked = (det.ModerationLabels || []).some(l => (l.ParentName || l.Name || "").toLowerCase().includes("explicit"));
  if (blocked) {
    await s3.send(new DeleteObjectCommand({ Bucket, Key: objectKey }));
    return NextResponse.json({ ok:false, reason:"blocked" }, { status: 200 });
  }
  // move to approved/
  await s3.send(new CopyObjectCommand({ Bucket, CopySource: `${Bucket}/${objectKey}`, Key: `approved/${targetKey}` }));
  await s3.send(new DeleteObjectCommand({ Bucket, Key: objectKey }));
  const cdn = process.env.PUBLIC_CDN_BASE!;
  return NextResponse.json({ ok:true, url: `${cdn}/approved/${targetKey}` });
}