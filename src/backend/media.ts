import 'server-only';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaError';
  }
}

function maxUploadBytes() {
  const value = Number(process.env.MAX_UPLOAD_BYTES || 12_582_912);
  return Number.isSafeInteger(value) && value > 0 ? value : 12_582_912;
}

function s3Client() {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new MediaError('S3 image storage is not fully configured.');
  }

  return new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function publicMediaUrl(objectKey: string) {
  if (objectKey.startsWith('reference/')) {
    return '/reference-assets/' + objectKey.slice('reference/'.length).split('/').map(encodeURIComponent).join('/');
  }

  if (process.env.MEDIA_DRIVER !== 's3') {
    return '/uploads/' + objectKey.split('/').map(encodeURIComponent).join('/');
  }

  const base = process.env.MEDIA_PUBLIC_BASE_URL;
  if (!base) throw new MediaError('MEDIA_PUBLIC_BASE_URL is required for S3 media.');
  return base.replace(/\/+$/, '') + '/' + objectKey.split('/').map(encodeURIComponent).join('/');
}

async function storeImage(prefix: string, input: Buffer) {
  if (!input.length || input.length > maxUploadBytes()) {
    throw new MediaError('Image is empty or exceeds the upload size limit.');
  }

  let image: Buffer;
  let width = 0;
  let height = 0;

  try {
    const pipeline = sharp(input, { failOn: 'error', limitInputPixels: 40_000_000 });
    const metadata = await pipeline.metadata();
    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
      throw new MediaError('Upload a JPEG, PNG, or WebP product photo.');
    }
    width = metadata.width ?? 0;
    height = metadata.height ?? 0;
    if (width < 100 || height < 100) {
      throw new MediaError('Image dimensions must be at least 100 by 100 pixels.');
    }
    image = await sharp(input, { failOn: 'error', limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
  } catch (error) {
    if (error instanceof MediaError) throw error;
    throw new MediaError('The uploaded file could not be decoded as a supported image.');
  }

  const objectKey = prefix + '/' + randomUUID() + '.webp';

  if (process.env.MEDIA_DRIVER === 's3') {
    await s3Client().send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: objectKey,
      Body: image,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new MediaError('Local image storage is not allowed in production.');
    }
    const root = path.resolve(process.cwd(), 'public', 'uploads');
    const target = path.resolve(root, ...objectKey.split('/'));
    if (!target.startsWith(root + path.sep)) {
      throw new MediaError('Invalid image key.');
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, image, { flag: 'wx' });
  }

  return { objectKey, width, height, byteLength: image.length };
}

export function storeProductImage(productId: string, input: Buffer) {
  return storeImage('products/' + productId, input);
}

export function storeBrandLogo(input: Buffer) {
  return storeImage('brand', input);
}

export async function deleteMediaObject(objectKey: string) {
  if (objectKey.startsWith('reference/')) return;

  if (process.env.MEDIA_DRIVER === 's3') {
    await s3Client().send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: objectKey,
    }));
    return;
  }

  if (process.env.NODE_ENV === 'production') return;
  const root = path.resolve(process.cwd(), 'public', 'uploads');
  const target = path.resolve(root, ...objectKey.split('/'));
  if (!target.startsWith(root + path.sep)) return;
  await unlink(target).catch(() => undefined);
}

export function mediaConfiguration() {
  return {
    driver: process.env.MEDIA_DRIVER || 'local',
    isProductionReady:
      process.env.MEDIA_DRIVER === 's3' &&
      Boolean(process.env.S3_BUCKET) &&
      Boolean(process.env.S3_ACCESS_KEY_ID) &&
      Boolean(process.env.S3_SECRET_ACCESS_KEY) &&
      Boolean(process.env.MEDIA_PUBLIC_BASE_URL),
  };
}

