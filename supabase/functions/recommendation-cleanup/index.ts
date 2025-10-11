import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify authorization (service role key only for cron jobs)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (token !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate threshold: 72 hours ago
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 72);

    console.log(`🧹 Cleaning recommendations shown before: ${threshold.toISOString()}`);

    // Delete old shown recommendations
    const { data, error } = await supabaseClient
      .from("recommendations")
      .delete()
      .eq("is_shown", true)
      .lt("shown_at", threshold.toISOString())
      .select("id");

    if (error) {
      console.error("Failed to delete old recommendations:", error);
      throw error;
    }

    const deletedCount = data?.length ?? 0;

    console.log(`✅ Deleted ${deletedCount} old recommendations`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount,
        threshold: threshold.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error cleaning recommendations:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
