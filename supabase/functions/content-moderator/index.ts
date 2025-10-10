// Edge Function: Content Moderator
// Moderates photos via Claude and notifies backend webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { moderateContent } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL = Deno.env.get("PHOTO_MODERATION_WEBHOOK_URL") ?? "";
const WEBHOOK_SECRET = Deno.env.get("PHOTO_MODERATION_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { publicUrl, metaId, photoId, userId, type } = await req.json();

    if (!publicUrl || !metaId || !photoId || !userId) {
      throw new Error("Missing required moderation payload fields");
    }

    const moderation = await moderateContent(
      publicUrl,
      (type as "profile" | "message" | "photo_caption") ?? "photo_caption",
    );

    if (!WEBHOOK_URL || !WEBHOOK_SECRET) {
      throw new Error("PHOTO_MODERATION webhook configuration is missing");
    }

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        metaId,
        photoId,
        userId,
        result: moderation,
      }),
    });

    if (!webhookResponse.ok) {
      const text = await webhookResponse.text();
      throw new Error(
        `Backend webhook responded with ${webhookResponse.status}: ${text}`,
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
