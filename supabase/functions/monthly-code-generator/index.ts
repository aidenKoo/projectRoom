import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MonthlyCode {
  code: string;
  month: Date;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateMonthlyCode(
  supabase: any,
  maxUses: number | null = null,
  maxRetries = 5,
): Promise<MonthlyCode> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthDate = new Date(`${year}-${month}-01`);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const randomPart = generateRandomString(6);
    const code = `${year}-${month}-${randomPart}`;

    // Check for duplicates
    const { data: existing } = await supabase
      .from("monthly_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (!existing) {
      // Create new code
      const { data, error } = await supabase
        .from("monthly_codes")
        .insert({
          code,
          month: monthDate.toISOString(),
          max_uses: maxUses,
          used_count: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`Failed to create code: ${error.message}`);
        throw error;
      }

      return data;
    }
  }

  throw new Error("Failed to generate unique code after max retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Allow service role key or admin token
    if (token !== serviceKey) {
      const { data: { user }, error } = await supabaseClient.auth.getUser(
        token,
      );
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { maxUses } = await req.json().catch(() => ({ maxUses: null }));

    console.log(`📝 Generating monthly code with maxUses: ${maxUses}`);

    const code = await generateMonthlyCode(supabaseClient, maxUses);

    console.log(`✅ Monthly code generated: ${code.code}`);

    return new Response(
      JSON.stringify({
        success: true,
        code: code.code,
        month: code.month,
        maxUses: code.max_uses,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error generating monthly code:", error);
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
