
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import sharp from "sharp";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import crypto from "crypto";

admin.initializeApp();

const THUMB_MAX_WIDTH = 256;
const THUMB_MAX_HEIGHT = 256;

const STORAGE_WEBHOOK_URL = functions.config().photo?.storage_webhook_url;
const STORAGE_WEBHOOK_SECRET = functions.config().photo?.storage_webhook_secret;
const STORAGE_WEBHOOK_MAX_RETRIES = Number(
  functions.config().photo?.storage_webhook_max_retries ?? 3,
);
const STORAGE_WEBHOOK_RETRY_BASE_MS = Number(
  functions.config().photo?.storage_webhook_retry_base_ms ?? 1000,
);

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWebhookWithRetry(
  url: string,
  secret: string,
  payload: any,
  maxRetries: number = STORAGE_WEBHOOK_MAX_RETRIES,
  baseDelayMs: number = STORAGE_WEBHOOK_RETRY_BASE_MS,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": secret,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) return response;

      // Non-retriable errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const text = await response.text();
        throw new Error(`Webhook responded ${response.status}: ${text}`);
      }

      lastError = new Error(`Webhook responded ${response.status}`);
    } catch (err) {
      lastError = err as Error;
    }

    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      functions.logger.warn(
        `Retry ${attempt}/${maxRetries} after ${delay}ms: ${lastError?.message}`,
      );
      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Webhook call failed after retries");
}

export const generateThumbnail = functions
  .region("asia-northeast3") // Seoul
  .storage
  .object()
  .onFinalize(async (object: functions.storage.ObjectMetadata) => {
    const filePath = object.name;
    const contentType = object.contentType;
    const bucket = admin.storage().bucket(object.bucket);

    // 1. Exit if the file doesn't exist or is not an image.
    if (!filePath || !contentType) {
      functions.logger.log("Exiting: No file path or content type.");
      return null;
    }
    if (!contentType.startsWith("image/")) {
      functions.logger.log(`Exiting: Not an image. Content type is ${contentType}`);
      return null;
    }

    // 2. Exit if the image is already a thumbnail.
    const fileName = path.basename(filePath);
    if (filePath.includes("/thumbs/")) {
      functions.logger.log(`Exiting: Already a thumbnail: ${fileName}`);
      return null;
    }

    // 3. Exit if it's not a user photo upload.
    if (!filePath.startsWith("users/") || !filePath.includes("/photos/")) {
        functions.logger.log(`Exiting: Not a user photo upload: ${filePath}`);
        return null;
    }

    // 4. Download source file to a temporary directory.
    const tempFilePath = path.join(os.tmpdir(), fileName);
    await bucket.file(filePath).download({ destination: tempFilePath });
    functions.logger.log("Image downloaded locally to", tempFilePath);

    // 5. Generate a thumbnail using sharp.
    const thumbFileName = `thumb_${fileName}`;
    const tempThumbPath = path.join(os.tmpdir(), thumbFileName);

    await sharp(tempFilePath)
      .resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT, { fit: "inside" })
      .toFile(tempThumbPath);

    // 6. Upload the thumbnail to the 'thumbs' directory.
    const thumbFilePath = filePath.replace("/photos/", "/thumbs/");

    await bucket.upload(tempThumbPath, {
      destination: thumbFilePath,
      metadata: {
        contentType: contentType,
      },
    });

    functions.logger.log(`Thumbnail uploaded to: ${thumbFilePath}`);

    // 7. Clean up the temporary files.
    return fs.unlinkSync(tempFilePath);
  });

export const moderatePhotoOnUpload = functions
  .region("asia-northeast3")
  .storage.object()
  .onFinalize(async (object: functions.storage.ObjectMetadata) => {
    const filePath = object.name;
    const bucketName = object.bucket;

    if (!filePath) {
      functions.logger.log("moderation skipped: no file path");
      return null;
    }

    if (!filePath.startsWith("users/") || !filePath.includes("/photos/")) {
      functions.logger.log(
        `moderation skipped: not a user photo path (${filePath})`,
      );
      return null;
    }

    if (!STORAGE_WEBHOOK_URL || !STORAGE_WEBHOOK_SECRET) {
      functions.logger.error(
        "PHOTO storage webhook configuration missing; skipping moderation",
      );
      return null;
    }

    const bucket = admin.storage().bucket(bucketName);

    // Attempt to collect bytes/width/height/hash/public_url for backend
    let bytes: number | undefined;
    let width: number | undefined;
    let height: number | undefined;
    let hashHex: string | undefined;
    try {
      // bytes: from metadata.size if present, else from buffer length
      if (object.size) {
        const parsed = Number(object.size);
        if (!Number.isNaN(parsed)) bytes = parsed;
      }

      const [buffer] = await bucket.file(filePath).download();
      if (buffer) {
        // hash
        const hash = crypto.createHash("sha256");
        hash.update(buffer);
        hashHex = hash.digest("hex");

        // width/height via sharp metadata
        const meta = await sharp(buffer).metadata();
        width = meta.width ?? width;
        height = meta.height ?? height;

        // fallback bytes from buffer length
        if (!bytes) bytes = buffer.length;
      }
    } catch (err) {
      functions.logger.warn(
        `Failed to extract image metadata for ${filePath}: ${(err as Error)?.message}`,
      );
    }

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

    const payload = {
      record: {
        name: filePath,
        bucket: bucketName,
        metadata: {
          ...(object.metadata ?? {}),
          public_url: publicUrl,
          width: typeof width === "number" ? String(width) : undefined,
          height: typeof height === "number" ? String(height) : undefined,
          bytes: typeof bytes === "number" ? String(bytes) : undefined,
          hash: hashHex ?? (object.metadata as any)?.hash,
        },
      },
    };

    try {
      const response = await callWebhookWithRetry(
        STORAGE_WEBHOOK_URL,
        STORAGE_WEBHOOK_SECRET,
        payload,
      );
      functions.logger.log(`Moderation webhook invoked for ${filePath} (${response.status})`);
    } catch (error) {
      functions.logger.error(
        `Failed to invoke moderation webhook for ${filePath}:`,
        error,
      );
    }

    return null;
  });
