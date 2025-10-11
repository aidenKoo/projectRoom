// Edge Function: Content Moderator
// Moderates photos via Claude and notifies backend webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { moderateContent, moderateImage } from "../_shared/anthropic.ts";
import { calculateImageHash } from "../_shared/hash.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL = Deno.env.get("PHOTO_MODERATION_WEBHOOK_URL") ?? "";
const WEBHOOK_SECRET = Deno.env.get("PHOTO_MODERATION_WEBHOOK_SECRET") ?? "";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWebhookWithRetry(
  url: string,
  secret: string,
  payload: any,
  maxRetries: number = MAX_RETRIES,
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

      if (response.ok) {
        return response;
      }

      // Non-retriable errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const text = await response.text();
        throw new Error(
          `Backend webhook responded with ${response.status}: ${text}`,
        );
      }

      // Retriable errors (5xx, 429, network issues)
      lastError = new Error(
        `Backend webhook responded with ${response.status}`,
      );
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < maxRetries) {
      const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms`);
      await sleep(delayMs);
    }
  }

  throw lastError ?? new Error("Webhook call failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { publicUrl, metaId, photoId, userId, type } = await req.json();

    if (!publicUrl || !metaId || !photoId || !userId) {
      throw new Error("Missing required moderation payload fields");
    }

    // Calculate image hash for duplicate detection
    let imageHash: string | undefined;
    try {
      imageHash = await calculateImageHash(publicUrl);
      console.log(`Calculated hash for photo ${photoId}: ${imageHash}`);
    } catch (hashError) {
      console.warn(`Failed to calculate hash for photo ${photoId}:`, hashError);
      // Continue without hash - it's not critical for moderation
    }

    const moderation =
      type === "photo"
        ? await moderateImage(publicUrl)
        : await moderateContent(
            publicUrl,
            (type as "profile" | "message" | "photo_caption") ?? "photo_caption",
          );

    if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
      throw new Error("PHOTO_MODERATION webhook configuration is missing");
    }

    await callWebhookWithRetry(WEBHOOK_URL, WEBHOOK_SECRET, {
      metaId,
      photoId,
      userId,
      hash: imageHash,
      result: moderation,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Content moderation error:", error);
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
