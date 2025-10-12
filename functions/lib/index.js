"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sharp_1 = __importDefault(require("sharp"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
admin.initializeApp();
const THUMB_MAX_WIDTH = 256;
const THUMB_MAX_HEIGHT = 256;
exports.generateThumbnail = functions
    .region("asia-northeast3") // Seoul
    .storage
    .object()
    .onFinalize(async (object) => {
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
    await (0, sharp_1.default)(tempFilePath)
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
//# sourceMappingURL=index.js.map