import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "lynn-slips";
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_DOMAIN ||
  process.env.R2_PUBLIC_URL ||
  "https://pub-169d24cf45da44e1a04ab25f4ff77d47.r2.dev";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
}

export async function createPresignedSlipUploadUrl({
  userId,
  fileName,
  contentType,
  fileSize,
}: {
  userId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<PresignedUrlResult> {
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error("INVALID_FILE_TYPE: Only JPG, PNG, and WebP are allowed");
  }

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error("FILE_TOO_LARGE: Maximum slip upload size is 5 MB");
  }

  const safeExt = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const cleanName = fileName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32);
  const fileKey = `slips/${userId}/${Date.now()}-${cleanName}.${safeExt}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 600, // 10 minutes
  });

  const publicUrl = `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${fileKey}`;

  return {
    uploadUrl,
    publicUrl,
    fileKey,
  };
}
