import { S3Client } from "@aws-sdk/client-s3";
export const REGION = process.env.AWS_REGION!;
export const BUCKET = process.env.S3_BUCKET!;
export const s3 = new S3Client({ region: REGION });
export const CDN = (process.env.CDN_BASE_URL || "").replace(/\/+$/,"");
