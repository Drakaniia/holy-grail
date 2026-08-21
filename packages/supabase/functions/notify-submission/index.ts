import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': 'null',
  'Access-Control-Max-Age': '86400',
}

function jsonResponse(body: Record<string, unknown>, status = 410) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
    status,
  })
}

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  return jsonResponse({
    error: 'notify-submission is deprecated. Use submit-tool for rate-limited submissions.',
  })
})
