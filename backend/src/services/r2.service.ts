import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

function getR2Client(): S3Client {
  if (!env.r2.accountId || !env.r2.accessKeyId || !env.r2.secretAccessKey) {
    throw new Error('Cloudflare R2 credentials not configured');
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2.accessKeyId,
      secretAccessKey: env.r2.secretAccessKey,
    },
  });
}

const PRESIGN_TTL = 900; // 15 minutes

export async function getPresignedUploadUrl(r2Key: string): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env.r2.bucketName,
    Key: r2Key,
    ContentType: 'application/octet-stream',
  });
  return getSignedUrl(client, command, { expiresIn: PRESIGN_TTL });
}

export async function getPresignedDownloadUrl(r2Key: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: env.r2.bucketName,
    Key: r2Key,
  });
  return getSignedUrl(client, command, { expiresIn: PRESIGN_TTL });
}

export async function deleteObject(r2Key: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({
    Bucket: env.r2.bucketName,
    Key: r2Key,
  }));
}
