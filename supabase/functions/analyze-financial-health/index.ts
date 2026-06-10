// Supabase Edge Function: Analyze Financial Health
// Called from client with FinancialHealthMetrics payload
// Returns AIAnalysis via Gemini API (3.5 Flash → 2.5 Flash fallback)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_35_FLASH_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'
const GEMINI_25_FLASH_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify auth — extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    let metrics
    let locale = 'vi'
    try {
      const body = await req.json()
      metrics = body.metrics
      locale = body.locale || 'vi'
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    if (!metrics) {
      return new Response(
        JSON.stringify({ error: 'Missing metrics' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Build analysis prompt
    const prompt = buildPrompt(metrics, locale)

    // Try Gemini 3.5 Flash first, fallback to 2.5 Flash
    let analysis
    try {
      analysis = await callGemini(prompt, GEMINI_35_FLASH_URL)
    } catch {
      analysis = await callGemini(prompt, GEMINI_25_FLASH_URL)
    }

    return new Response(JSON.stringify(analysis), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})

const LANG_MAP: Record<string, { name: string; instruction: string; advisorRole: string; sectionTitles: { overview: string; deepAnalysis: string; strategy: string } }> = {
  vi: {
    name: 'Vietnamese',
    instruction: 'All text must be in Vietnamese (Tiếng Việt). Use Vietnamese number formatting (e.g. 1.000.000đ).',
    advisorRole: 'Bạn là một chuyên gia Cố vấn Tài chính Cá nhân (Personal Financial Advisor) dày dạn kinh nghiệm.',
    sectionTitles: {
      overview: 'Đánh giá Tổng quan',
      deepAnalysis: 'Phân tích Chuyên sâu',
      strategy: 'Chiến lược Đầu tư',
    },
  },
  en: {
    name: 'English',
    instruction: 'All text must be in English. Use standard number formatting.',
    advisorRole: 'You are an experienced Personal Financial Advisor.',
    sectionTitles: {
      overview: 'Overview Assessment',
      deepAnalysis: 'Deep Analysis',
      strategy: 'Investment Strategy',
    },
  },
}

function buildPrompt(metrics: any, locale: string): string {
  const lang = LANG_MAP[locale] || LANG_MAP['vi']

  // Compute monthly average expense for runway hint
  const monthlyData = metrics.monthlyExpenseComparison || []
  const avgMonthlyExpense = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((s: number, m: any) => s + m.total, 0) / monthlyData.length)
    : metrics.totalExpense

  return `${lang.advisorRole}

Analyze the following personal finance metrics comprehensively and return a JSON response.

${lang.sectionTitles.overview} — Core Metrics:
- Total Income: ${metrics.totalIncome}
- Total Expense: ${metrics.totalExpense}
- Total Assets (wallet balances): ${metrics.totalAssets}
- Net Worth (assets - debt): ${metrics.netWorth}
- Total Debt (owing): ${metrics.totalDebt}
- Total Lent: ${metrics.totalLent}
- Savings Rate: ${metrics.savingsRate}%
- Expense-to-Income Ratio: ${metrics.expenseToIncomeRatio}%
- Debt-to-Income Ratio: ${metrics.debtToIncomeRatio}%
- Asset-to-Debt Ratio: ${metrics.assetToDebtRatio}%
- Spending Trend: ${metrics.spendingTrend}
- Average Monthly Expense (estimated): ${avgMonthlyExpense}
- Top Expense Categories: ${JSON.stringify(metrics.topExpenseCategories?.slice(0, 3))}
- Budget Usage: ${JSON.stringify(metrics.budgetUsage)}
- Savings Goals: ${JSON.stringify(metrics.savingsGoalProgress)}

Return ONLY a valid JSON object (no markdown, no code fences) with this EXACT structure:
{
  "overall_score": <number 0-100>,
  "grade": "<A+|A|B+|B|C+|C|D|F>",
  "summary": "<2-3 sentence overall assessment in ${lang.name}>",
  "insights": [
    {"icon": "<emoji>", "title": "<short title in ${lang.name}>", "description": "<specific detail with numbers in ${lang.name}>", "severity": "<positive|neutral|negative>"}
  ],
  "recommendations": [
    {"icon": "<emoji>", "title": "<short title in ${lang.name}>", "description": "<actionable advice in ${lang.name}>", "priority": "<high|medium|low>"}
  ],
  "risk_flags": [
    {"title": "<short title in ${lang.name}>", "description": "<risk detail in ${lang.name}>", "severity": "<warning|danger>"}
  ],
  "financial_runway": {
    "months": <number — net worth divided by average monthly expense>,
    "description": "<explanation in ${lang.name} about how long they can survive without income>"
  },
  "asset_allocation": {
    "emergency_fund": {"percentage": <number 0-100>, "amount": <number>, "description": "<in ${lang.name}>"},
    "investment_capital": {"percentage": <number 0-100>, "amount": <number>, "description": "<in ${lang.name}>"},
    "description": "<overall allocation strategy explanation in ${lang.name}>"
  },
  "investment_channels": [
    {"name": "<channel name in ${lang.name}>", "risk_level": "<low|medium_low|medium>", "suggested_percentage": <number>, "description": "<why this fits their profile, in ${lang.name}>"}
  ],
  "action_plan": [
    {"icon": "<emoji>", "title": "<short title in ${lang.name}>", "description": "<specific action in ${lang.name}>", "timeline": "<e.g. 1-3 tháng / 6-12 tháng>", "priority": "<high|medium|low>"}
  ]
}

Rules:
- Score 90-100: A+, 80-89: A, 70-79: B+, 60-69: B, 50-59: C+, 40-49: C, 25-39: D, below 25: F
- Provide 3-6 insights, 2-4 recommendations, 0-3 risk flags
- Provide 3-4 investment channels (low to medium risk: savings, index funds, gold, self-development, etc.)
- Provide 3-5 action plan items with realistic timelines
- financial_runway.months: net worth / avg monthly expense (0 if no expenses). If negative net worth, months = 0.
- asset_allocation: percentages must add up to 100%. Emergency fund typically 3-6 months of expenses.
- ${lang.instruction}
- Be specific with numbers from the data — reference actual amounts, percentages, and category names
- risk_flags and investment_channels arrays can be empty if not applicable`
}

async function callGemini(prompt: string, apiUrl: string): Promise<any> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error (${apiUrl.split('/').pop()?.split(':')[0]}): ${response.status} ${text}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]

  // Check if response was truncated
  if (candidate?.finishReason === 'MAX_TOKENS') {
    console.error('Gemini response truncated (MAX_TOKENS). Increasing maxOutputTokens recommended.')
  }

  const content = candidate?.content?.parts?.[0]?.text || ''

  return parseAIResponse(content)
}

function parseAIResponse(content: string): any {
  let cleaned = content.trim()

  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/i, '').replace(/\n?\s*```\s*$/,'')

  // 1) Direct parse
  try {
    return JSON.parse(cleaned)
  } catch { /* continue */ }

  // 2) Extract first { ... } balanced brace block
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace !== -1) {
    let depth = 0
    for (let i = firstBrace; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++
      else if (cleaned[i] === '}') depth--
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(firstBrace, i + 1))
        } catch { /* continue */ }
        break
      }
    }

    // 2b) Truncated JSON repair: close open brackets/braces
    if (depth > 0) {
      let repaired = cleaned.slice(firstBrace)
      // Remove trailing incomplete value (partial string, number, etc.)
      repaired = repaired.replace(/[^,\[{]\s*$/, '')
      // Count unclosed brackets
      let opens = 0
      let closeChars = ''
      for (const ch of repaired) {
        if (ch === '[' || ch === '{') opens++
        else if (ch === ']' || ch === '}') opens--
      }
      // Close in reverse order: } before ] etc.
      for (let i = opens; i > 0; i--) {
        // Simple heuristic: close ] if last unclosed was [, } if last was {
        closeChars += '}'
      }
      // More precise: track stack
      const stack: string[] = []
      for (const ch of repaired) {
        if (ch === '[' || ch === '{') stack.push(ch === '[' ? ']' : '}')
        else if ((ch === ']' || ch === '}') && stack.length > 0) stack.pop()
      }
      closeChars = stack.reverse().join('')
      repaired += closeChars
      try {
        return JSON.parse(repaired)
      } catch { /* continue */ }
    }
  }

  // 3) Greedy regex fallback
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch { /* continue */ }
  }

  console.error('Raw AI response (first 500 chars):', content.slice(0, 500))
  throw new Error('Failed to parse AI response as JSON. Raw: ' + content.slice(0, 200))
}
