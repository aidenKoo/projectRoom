
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import sharp from "sharp";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

admin.initializeApp();

const THUMB_MAX_WIDTH = 256;
const THUMB_MAX_HEIGHT = 256;

const STORAGE_WEBHOOK_URL = functions.config().photo?.storage_webhook_url;
const STORAGE_WEBHOOK_SECRET = functions.config().photo?.storage_webhook_secret;

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

    const payload = {
      record: {
        name: filePath,
        bucket: object.bucket,
        metadata: object.metadata ?? {},
      },
    };

    try {
      const response = await fetch(STORAGE_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": STORAGE_WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Webhook responded with ${response.status}: ${text}`,
        );
      }

      functions.logger.log(
        `Moderation webhook invoked for ${filePath} (${response.status})`,
      );
    } catch (error) {
      functions.logger.error(
        `Failed to invoke moderation webhook for ${filePath}:`,
        error,
      );
    }

    return null;
  });
