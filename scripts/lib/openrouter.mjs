/**
 * Minimal OpenRouter chat-completions client for the research pipeline.
 * Later entries in `models` are OpenRouter-side fallbacks used only when the
 * earlier model errors (rate limit, downtime, context, …).
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

// Daily discovery + deep research: DeepSeek is ~10-20x cheaper than Haiku with comparable
// facts (benchmark 2026-10-26); Haiku takes over when DeepSeek errors.
export const DEFAULT_MODELS = ['deepseek/deepseek-v4-flash', 'anthropic/claude-haiku-5.5']
// "한국에서는": DeepSeek + the search tool (model-written Korean queries) found as many Korean
// players as Haiku at ~1/3 the cost (2026-10-26); Haiku takes over when DeepSeek errors.
export const LENS_MODELS = ['deepseek/deepseek-v4-flash', 'anthropic/claude-haiku-5.5']

const parseList = (v) =>
  (v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export function modelsFromEnv(env = process.env) {
  const list = parseList(env.OPENROUTER_MODELS)
  return list.length ? list : DEFAULT_MODELS
}

export function lensModelsFromEnv(env = process.env) {
  const list = parseList(env.LENS_MODELS)
  return list.length ? list : LENS_MODELS
}

/** Claude's native search can leave citation markup in the prose; strip it before anything is stored. */
export function stripCiteTags(text) {
  return typeof text === 'string' ? text.replace(/<\/?cite[^>]*>/g, '').replace(/[ \t]{2,}/g, ' ') : text
}

/** Apply stripCiteTags to every string in a parsed JSON value. */
export function deepClean(v) {
  if (typeof v === 'string') return stripCiteTags(v)
  if (Array.isArray(v)) return v.map(deepClean)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepClean(x)]))
  return v
}

export class OpenRouterError extends Error {
  constructor(status, message) {
    super(`OpenRouter ${status}: ${message}`)
    this.status = status
  }
}

// Perplexity won the Korean-coverage experiment (most Korean citations, cheapest per call);
// Korea as the location nudges results toward Korean sources without excluding others.
export const SEARCH_ENGINE = 'perplexity'

function searchTool(maxResults, maxSearches) {
  return {
    tools: [
      {
        type: 'openrouter:web_search',
        parameters: {
          engine: SEARCH_ENGINE,
          max_results: maxResults,
          max_uses: maxSearches,
          user_location: { type: 'approximate', country: 'KR' },
        },
      },
    ],
    max_tool_calls: maxSearches + 2,
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * One chat completion. Returns { text, citations, model, usage }.
 *   web        — search mode:
 *                true / 'plugin' — OpenRouter web plugin: ONE search, query chosen by OpenRouter.
 *                                  Cheap; fine for English sources about one company.
 *                'tool'          — openrouter:web_search server tool: the model writes its own queries
 *                                  (Korean ones too) and searches several times. Needed for Korean
 *                                  coverage on non-Claude models (experiment 2026-10-26: 0-1 → 5-7
 *                                  Korean players found). Costs per search.
 *   maxResults — search results per query when searching
 *   maxSearches — cap on searches in 'tool' mode
 *   json       — ask for a JSON object response (no schema); used for repair calls
 */
export function createClient({ apiKey, models = DEFAULT_MODELS, fetchImpl = fetch, log = () => {} }) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  let totalCost = 0

  // `useModels` overrides the client's model list for one call (e.g. a retry on a different model)
  async function chat({ system, user, web = false, maxResults = 8, maxSearches = 8, json = false, maxTokens = 16000, useModels, timeoutMs = 300_000 }) {
    const list = useModels?.length ? useModels : models
    const body = {
      model: list[0],
      models: list,
      max_tokens: maxTokens,
      messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: user }],
      ...(web === 'tool' ? searchTool(maxResults, maxSearches) : web ? { plugins: [{ id: 'web', max_results: maxResults }] } : {}),
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }

    for (let attempt = 0; ; attempt++) {
      const res = await fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://startup-daily.vercel.app',
          'X-OpenRouter-Title': 'Startup Daily',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(5_000, timeoutMs)),
      })

      // 429 / 5xx: OpenRouter already tried the fallback models; back off and retry the whole call
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        const wait = 5000 * (attempt + 1)
        log(`  OpenRouter ${res.status}, retrying in ${wait / 1000}s`)
        await sleep(wait)
        continue
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new OpenRouterError(res.status, data?.error?.message || res.statusText)

      const choice = data.choices?.[0]
      if (choice?.error) throw new OpenRouterError(choice.error.code || 'choice', choice.error.message)
      if (choice?.finish_reason === 'length') throw new OpenRouterError('length', 'response hit max_tokens')
      if (choice?.finish_reason === 'content_filter') throw new OpenRouterError('filtered', 'response was filtered')

      const message = choice?.message || {}
      const text = typeof message.content === 'string' ? message.content : (message.content || []).map((p) => p.text || '').join('')
      const citations = (message.annotations || [])
        .filter((a) => a.type === 'url_citation' && a.url_citation?.url)
        .map((a) => ({ url: a.url_citation.url, title: a.url_citation.title || '' }))
      totalCost += Number(data.usage?.cost || 0)
      return { text, citations, model: data.model, usage: data.usage }
    }
  }

  return { chat, cost: () => totalCost, models }
}

/** Pull the first JSON value (object or array) out of a model reply. */
export function extractJson(text, kind = 'object') {
  const [open, close] = kind === 'array' ? ['[', ']'] : ['{', '}']
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const src = fenced ? fenced[1] : text
  const start = src.indexOf(open)
  const end = src.lastIndexOf(close)
  if (start < 0 || end <= start) throw new SyntaxError(`no JSON ${kind} found`)
  return JSON.parse(src.slice(start, end + 1))
}

/** Parse JSON from a reply; if the model wrapped or mangled it, one cheap no-web repair call. */
export async function parseOrRepair(llm, text, kind = 'object') {
  return deepClean(await parseOrRepairRaw(llm, text, kind))
}

async function parseOrRepairRaw(llm, text, kind) {
  try {
    return extractJson(text, kind)
  } catch {
    const fixed = await llm.chat({
      user: `Convert the following into one valid JSON ${kind}. Keep every field and value; do not add facts. Output JSON only.\n\n${text}`,
      json: kind === 'object',
      maxTokens: 16000,
    })
    return extractJson(fixed.text, kind)
  }
}
