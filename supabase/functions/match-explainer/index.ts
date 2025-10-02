// Edge Function: Match Explainer
// Generates "Why this match?" explanations using Claude

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateMatchReason } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { target_user_id } = await req.json();

    if (!target_user_id) {
      throw new Error("Missing target_user_id");
    }

    // Get both profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("user_id, intro_text, values_json")
      .in("user_id", [user.id, target_user_id]);

    if (profilesError) throw profilesError;

    const userProfile = profiles.find((p) => p.user_id === user.id);
    const targetProfile = profiles.find((p) => p.user_id === target_user_id);

    if (!userProfile || !targetProfile) {
      throw new Error("Profiles not found");
    }

    // Extract tags from values_json
    const userTags = (userProfile.values_json as any)?.tags || [];
    const targetTags = (targetProfile.values_json as any)?.tags || [];
    const commonTags = userTags.filter((tag: string) =>
      targetTags.includes(tag)
    );

    // Generate match reason with Claude
    const explanation = await generateMatchReason(
      {
        intro: userProfile.intro_text || "",
        tags: userTags,
      },
      {
        intro: targetProfile.intro_text || "",
        tags: targetTags,
      },
      commonTags
    );

    return new Response(JSON.stringify(explanation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
