
// Supabase Edge Function: Thumbnail Generator
// Triggered by a webhook on new image uploads to the 'user_photos' bucket.
// Creates a 200x200 thumbnail and saves it to a 'thumbnails' folder.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resize } from "https://deno.land/x/image@v0.1.1/mod.ts";
import { getImageInfo } from "jsr:@retraigo/image-size";
import { crypto } from "jsr:@std/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";

const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // The request body will contain the webhook payload from Supabase.
    const payload = await req.json();

    // Verify payload structure (adjust based on actual webhook payload)
    if (payload.type !== 'INSERT' || payload.table !== 'objects' || !payload.record) {
      throw new Error("Invalid webhook payload");
    }

    const bucketId = payload.record.bucket_id;
    const imagePath = payload.record.name;

    // Prevent infinite loops: ignore files that are already thumbnails.
    if (imagePath.startsWith("thumbnails/")) {
      console.log(`Skipping thumbnail generation for already processed file: ${imagePath}`);
      return new Response(JSON.stringify({ success: true, message: "Already a thumbnail" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Processing new image: ${imagePath} in bucket: ${bucketId}`);

    // 1. Download the original image from Storage
    const { data: originalImage, error: downloadError } = await supabaseAdmin.storage
      .from(bucketId)
      .download(imagePath);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }
    console.log("Successfully downloaded original image.");

    const imageBuffer = await originalImage.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    // 2. Get image dimensions and hash
    const imageInfo = getImageInfo(imageBytes);
    const hashBuffer = await crypto.subtle.digest("SHA-256", imageBytes);
    const sha256Hash = encodeHex(hashBuffer);

    // 3. Resize the image to create a thumbnail
    const resizedImage = await resize(imageBytes, {
      width: THUMBNAIL_WIDTH,
      height: THUMBNAIL_HEIGHT,
    });
    console.log(`Successfully resized image to ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}.`);

    // 4. Upload the thumbnail back to the same bucket but in a 'thumbnails' folder
    const thumbnailPath = `thumbnails/${imagePath}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketId)
      .upload(thumbnailPath, resizedImage, {
        contentType: originalImage.type, // Preserve original content type
        upsert: true, // Overwrite if it somehow already exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }
    console.log(`Successfully uploaded thumbnail to: ${thumbnailPath}`);

    // 5. Update the photo_meta table
    try {
      const pathParts = imagePath.split('/');
      if (pathParts.length < 2) {
        throw new Error('Invalid image path format. Expected user_photos/<uid>/<filename>');
      }
      const uid = pathParts[1];
      const { data: publicUrlData } = supabaseAdmin.storage.from(bucketId).getPublicUrl(thumbnailPath);

      const { error: insertError } = await supabaseAdmin.from('photo_meta').insert({
        uid: uid,
        path: publicUrlData.publicUrl,
        width: imageInfo?.width,
        height: imageInfo?.height,
        hash: sha256Hash,
      });

      if (insertError) {
        throw new Error(`Failed to insert photo meta: ${insertError.message}`);
      }
      console.log(`Successfully inserted photo meta for user: ${uid}`);

    } catch (metaError) {
      // Log the error, but don't fail the entire function since the thumbnail was created.
      console.error('Failed to update photo_meta table:', metaError.message);
    }


    return new Response(JSON.stringify({ success: true, thumbnailPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing image:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
