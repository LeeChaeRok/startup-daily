/**
 * Minimal OpenRouter chat-completions client for the research pipeline.
 * Haiku first; later entries in `models` are OpenRouter-side fallbacks used
 * only when the earlier model errors (rate limit, downtime, context, …).
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export const DEFAULT_MODELS = ['anthropic/claude-haiku-5.5', 'anthropic/claude-sonnet-5.5']

export function modelsFromEnv(env = process.env) {
  const list = (env.OPENROUTER_MODELS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length ? list : DEFAULT_MODELS
}

export class OpenRouterError extends Error {
  constructor(status, message) {
    super(`OpenRouter ${status}: ${message}`)
    this.status = status
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * One chat completion. Returns { text, citations, model, usage }.
 *   web        — enable OpenRouter's web plugin (native search for Anthropic models)
 *   maxResults — search results per query when `web` is on
 *   json       — ask for a JSON object response (no schema); used for repair calls
 */
export function createClient({ apiKey, models = DEFAULT_MODELS, fetchImpl = fetch, log = () => {} }) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  let totalCost = 0

  async function chat({ system, user, web = false, maxResults = 8, json = false, maxTokens = 16000 }) {
    const body = {
      model: models[0],
      models,
      max_tokens: maxTokens,
      messages: [...(system ? [{ role: 'system', content: system }] : []), { role: 'user', content: user }],
      ...(web ? { plugins: [{ id: 'web', max_results: maxResults }] } : {}),
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
        signal: AbortSignal.timeout(300_000),
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

  return { chat, cost: () => totalCost }
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
