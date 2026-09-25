// Tiny edge function: returns the caller's IP (and country if available)
// from proxy headers. Used by the client when logging access history.
// No secrets involved — safe to expose via CORS to any origin.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const forwarded = req.headers.get('x-forwarded-for')
  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    forwarded?.split(',')[0]?.trim() ??
    'unknown'

  const country = req.headers.get('cf-ipcountry') ?? null

  return new Response(
    JSON.stringify({ ip, country }),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  )
})
