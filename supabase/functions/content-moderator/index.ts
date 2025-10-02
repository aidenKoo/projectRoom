// Edge Function: Content Moderator
// Moderates messages and profile content using Claude

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { moderateContent } from "../_shared/anthropic.ts";

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
    const { content, type } = await req.json();

    if (!content || !type) {
      throw new Error("Missing content or type");
    }

    // Moderate content with Claude
    const result = await moderateContent(content, type);

    // If flagged with high severity, take immediate action
    if (result.flagged && result.severity === "high") {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const {
          data: { user },
        } = await supabaseClient.auth.getUser(token);

        if (user) {
          // Update risk score
          await supabaseClient
            .from("risk_scores")
            .upsert({
              user_id: user.id,
              score: 75, // High risk
              factors: {
                content_moderation: result.reasons,
                timestamp: new Date().toISOString(),
              },
            });
        }
      }
    }

    return new Response(JSON.stringify(result), {
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
