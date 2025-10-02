// Edge Function: Profile Analyzer
// Analyzes user profiles and generates embeddings using Claude

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeProfile } from "../_shared/anthropic.ts";

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

    // Get authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("intro_text, values_json")
      .eq("user_id", user.id)
      .single();

    if (profileError) throw profileError;

    // Analyze profile with Claude
    const analysis = await analyzeProfile(
      profile.intro_text || "",
      profile.values_json || {}
    );

    // Update profile with analysis results
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        values_json: {
          ...profile.values_json,
          ai_analysis: analysis,
        },
      })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // TODO: Generate embeddings and store in embeddings table
    // This would use a separate embedding model or Claude's text representation

    return new Response(JSON.stringify({ success: true, analysis }), {
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
