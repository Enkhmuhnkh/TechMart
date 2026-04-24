import { redis } from '../../config/redis';
import { query } from '../../shared/db';
import { env } from '../../config/env';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// compound-beta = Groq-ийн автомат web search хийдэг model
const MODEL_COMPOUND = 'compound-beta';
// Filter extraction-д хурдан model
const MODEL_FILTER  = 'llama-3.3-70b-versatile';

// ─── System prompts ──────────────────────────────────────────────────────────

const FILTER_SYSTEM_PROMPT = `You are a precise product filter extraction engine for a Mongolian tech store.
User writes in Mongolian, English, or mixed. Output ONLY raw JSON — no markdown, no backticks.

CRITICAL RULES:
1. Extract the EXACT brand mentioned. "Samsung" -> brand="Samsung". Never change or add brands.
2. Extract the EXACT category. Never mix categories.
3. If user says "Samsung phone", set brand="Samsung" AND category="phones".
4. Set search_terms to NULL always — use category and brand instead.

Category mapping:
- utas, утас, phone, smartphone, гар утас -> "phones"
- laptop, зөөврийн, notebook -> "laptops"
- monitor, дэлгэц, screen, display -> "monitors"
- earbuds, чихэвч, airpods, tws, wireless earphone -> "earbuds"
- headphones, том чихэвч -> "headphones"
- keyboard, гар, клавиатур -> "keyboards"
- mouse, хулгана -> "mice"
- gpu, видео карт, graphics card -> "gpus"
- ssd, hdd, storage, хадгалах -> "storage"
- smartwatch, ухаалаг цаг, watch -> "smartwatches"

Price: "сая/say" = million MNT, "мянга/myanga" = thousand MNT.

Output format:
{
  "language": "mn" or "en",
  "category": one of [laptops,phones,tablets,monitors,keyboards,mice,earbuds,headphones,smartwatches,gpus,cpus,storage,accessories] or null,
  "brand": exact brand as user said or null,
  "min_price": number or null,
  "max_price": number or null,
  "specs": [{"key": string, "value": string}],
  "use_case": string or null,
  "intent": "search" or "recommend" or "compare" or "question" or "web_info",
  "needs_web_search": true if user asks about specs/reviews/comparisons not findable in store DB,
  "search_terms": null
}

Examples:
- "iPhone 17 specs юу вэ" -> {"intent":"web_info","needs_web_search":true,"category":"phones","brand":"Apple"}
- "Samsung Galaxy S26 review" -> {"intent":"web_info","needs_web_search":true,"brand":"Samsung"}
- "3 сая доторх gaming laptop" -> {"category":"laptops","max_price":3000000,"use_case":"gaming","needs_web_search":false}`;

const MAIN_SYSTEM_PROMPT = `You are TechMart AI — Mongolia's most knowledgeable tech shopping expert and advisor.

## YOUR CAPABILITIES
1. 📦 TechMart product inventory (provided in each message with real prices in ₮)
2. 🌐 Web search for latest specs, benchmarks, reviews, global prices
3. 🧠 Deep expertise in consumer electronics

## HOW TO RESPOND

**For product recommendations:**
- Match user's budget and needs to TechMart inventory
- Explain WHY each product fits their use case (specific specs)
- Highlight best value option
- Compare 2-3 options if budget allows

**For specs/info questions:**
- Use web search to get accurate, current specs
- Cross-reference with what TechMart carries
- Give honest assessment (is TechMart's price fair? good deal?)

**For comparisons:**
- Use web search for benchmark data
- Compare real-world performance, not just specs on paper
- Give a clear winner recommendation

## RESPONSE FORMAT (adapt to context)
1. **Direct answer** — no fluff, get to the point
2. **Key specs** — only what matters for this use case  
3. **TechMart picks** — with exact ₮ prices
4. **Verdict** — best choice and why
5. One follow-up question (optional)

## RULES
- Always respond in user's language (Монголоор if they write Mongolian)
- Never invent specs — use web search or provided data only
- Be specific: exact model names, exact specs, exact prices
- If TechMart doesn't have the best option, say so honestly
- Prices are in MNT: 1 сая = 1,000,000₮, use ₮ symbol

## MONGOLIAN MARKET CONTEXT  
- Common brands: Apple, Samsung, Lenovo, Dell, ASUS, Acer, Sony, Bose, LG, HP
- Mongolia import taxes make some items pricier than international prices
- Popular use cases: gaming, programming, business, student, content creation`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface FilterResult {
  language: string;
  category: string | null;
  brand: string | null;
  min_price: number | null;
  max_price: number | null;
  specs: Array<{ key: string; value: string }>;
  use_case: string | null;
  intent: string;
  needs_web_search?: boolean;
  search_terms: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiEvent {
  type: 'searching' | 'source' | 'thinking';
  query?: string;
  url?: string;
  title?: string;
}

// ─── Groq API helpers ────────────────────────────────────────────────────────

async function callGroq(
  model: string,
  messages: Array<{ role: string; content: string }>,
  stream = false,
  temperature = 0.7
): Promise<Response> {
  const apiKey = (env as any).GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  return fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1500,
      stream,
    }),
  });
}

// ─── Filter extraction ───────────────────────────────────────────────────────

async function extractFilters(userMessage: string): Promise<FilterResult> {
  try {
    const response = await callGroq(
      MODEL_FILTER,
      [
        { role: 'system', content: FILTER_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      false,
      0.1
    );
    const data = (await response.json()) as any;
    const text: string = data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      language: 'mn', category: null, brand: null,
      min_price: null, max_price: null, specs: [],
      use_case: null, intent: 'search',
      needs_web_search: false, search_terms: userMessage,
    };
  }
}

// ─── Category normalizer ─────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  smartphones: 'phones', smartphone: 'phones', phone: 'phones', mobile: 'phones',
  utas: 'phones', 'гар утас': 'phones', утас: 'phones',
  laptop: 'laptops', notebook: 'laptops', 'зөөврийн': 'laptops',
  monitor: 'monitors', display: 'monitors', screen: 'monitors', дэлгэц: 'monitors',
  earbud: 'earbuds', earphone: 'earbuds', earphones: 'earbuds', tws: 'earbuds',
  airpods: 'earbuds', чихэвч: 'earbuds',
  headphone: 'headphones', 'том чихэвч': 'headphones',
  keyboard: 'keyboards', гар: 'keyboards',
  mouse: 'mice', хулгана: 'mice',
  gpu: 'gpus', 'graphics card': 'gpus', 'видео карт': 'gpus',
  ssd: 'storage', hdd: 'storage', 'хадгалах': 'storage',
  smartwatch: 'smartwatches', watch: 'smartwatches', 'ухаалаг цаг': 'smartwatches',
};

function normalizeCategory(cat: string | null): string | null {
  if (!cat) return null;
  return CATEGORY_MAP[cat.toLowerCase().trim()] || cat.toLowerCase().trim();
}

// ─── Product DB query ────────────────────────────────────────────────────────

async function runProductQuery(conditions: string[], vals: unknown[], limit: number) {
  const i = vals.length + 1;
  const { rows } = await query(
    `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
            p.description, b.name as brand_name, c.name as category_name, c.slug as category_slug,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as image_url,
            COALESCE(
              json_agg(json_build_object('key', ps.spec_key, 'value', ps.spec_value) ORDER BY ps.sort_order)
              FILTER (WHERE ps.id IS NOT NULL), '[]'
            ) as specs
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY p.id, b.name, c.name, c.slug
     ORDER BY p.created_at DESC
     LIMIT $${i}`,
    [...vals, limit]
  );
  return rows;
}

async function queryProducts(filters: FilterResult, limit = 5): Promise<unknown[]> {
  const category = normalizeCategory(filters.category);
  const base = ["p.status = 'active'", 'p.stock_quantity > 0'];

  const attempts: Array<{ conds: string[]; vals: unknown[] }> = [];

  // Attempt 1: full filters
  {
    const conds = [...base]; const vals: unknown[] = []; let i = 1;
    if (category) { conds.push(`c.slug = $${i++}`); vals.push(category); }
    if (filters.brand) { conds.push(`b.name ILIKE $${i++}`); vals.push(`%${filters.brand}%`); }
    if (filters.max_price) { conds.push(`COALESCE(p.sale_price, p.price) <= $${i++}`); vals.push(filters.max_price); }
    if (filters.min_price) { conds.push(`COALESCE(p.sale_price, p.price) >= $${i++}`); vals.push(filters.min_price); }
    attempts.push({ conds, vals });
  }
  // Attempt 2: no price
  {
    const conds = [...base]; const vals: unknown[] = []; let i = 1;
    if (category) { conds.push(`c.slug = $${i++}`); vals.push(category); }
    if (filters.brand) { conds.push(`b.name ILIKE $${i++}`); vals.push(`%${filters.brand}%`); }
    attempts.push({ conds, vals });
  }
  // Attempt 3: category only
  if (category) attempts.push({ conds: [...base, `c.slug = $1`], vals: [category] });
  // Attempt 4: brand only
  if (filters.brand) attempts.push({ conds: [...base, `b.name ILIKE $1`], vals: [`%${filters.brand}%`] });
  // Attempt 5: search terms
  if (filters.search_terms) {
    attempts.push({
      conds: [...base, `(p.name ILIKE $1 OR p.name_mn ILIKE $1 OR b.name ILIKE $1)`],
      vals: [`%${filters.search_terms}%`],
    });
  }

  for (const { conds, vals } of attempts) {
    try {
      const rows = await runProductQuery(conds, vals, limit);
      if (rows.length > 0) return rows;
    } catch {}
  }

  // Fallback: newest active
  const { rows } = await query(
    `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
            b.name as brand_name, c.name as category_name, c.slug as category_slug,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as image_url
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.status = 'active' AND p.stock_quantity > 0
     ORDER BY p.created_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

// ─── Compound-beta stream parser ─────────────────────────────────────────────
// compound-beta автоматаар web search хийдэг — tool_use event-ийг parse хийнэ

async function streamCompound(
  response: Response,
  onChunk: (text: string) => void,
  onEvent: (event: AiEvent) => void,
): Promise<{ fullText: string; sources: Array<{ url: string; title: string }> }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  const sources: Array<{ url: string; title: string }> = [];
  const toolArgBuffers: Record<number, string> = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
      try {
        const data = JSON.parse(line.slice(6)) as any;
        const delta = data.choices?.[0]?.delta;
        if (!delta) continue;

        // Text content
        if (delta.content) {
          fullText += delta.content;
          onChunk(delta.content);
        }

        // Tool call — web search хийж байна
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolArgBuffers[idx]) toolArgBuffers[idx] = '';
            if (tc.function?.name === 'web_search' || tc.function?.name === 'search') {
              // Streaming хайлтын мэдэгдэл
              if (tc.function.arguments) {
                toolArgBuffers[idx] += tc.function.arguments;
                try {
                  const args = JSON.parse(toolArgBuffers[idx]);
                  if (args.query) {
                    onEvent({ type: 'searching', query: args.query });
                    toolArgBuffers[idx] = '';
                  }
                } catch {}
              }
            }
          }
        }

        // Tool result — source URL цуглуулна
        if ((delta as any).tool_results) {
          for (const tr of (delta as any).tool_results) {
            try {
              const content = typeof tr.content === 'string' ? JSON.parse(tr.content) : tr.content;
              if (Array.isArray(content)) {
                for (const item of content) {
                  if (item.url && item.title) {
                    sources.push({ url: item.url, title: item.title });
                    onEvent({ type: 'source', url: item.url, title: item.title });
                  }
                }
              }
            } catch {}
          }
        }
      } catch {}
    }
  }

  return { fullText, sources };
}

// ─── Main chat function ───────────────────────────────────────────────────────

export async function chat(
  userMessage: string,
  sessionId: string,
  onChunk: (chunk: string) => void,
  onEvent: (event: AiEvent) => void,
): Promise<{ products: unknown[]; sources: Array<{ url: string; title: string }> }> {
  const historyKey = `ai:session:${sessionId}`;
  const historyRaw = await redis.get(historyKey);
  const history: ChatMessage[] = historyRaw ? JSON.parse(historyRaw) : [];

  // Step 1: Filter extraction
  const filters = await extractFilters(userMessage);
  const category = normalizeCategory(filters.category);

  // Step 2: DB product search
  const products = await queryProducts(filters);

  // Step 3: Build context prompt
  const productContext = products.length > 0
    ? products.map((p: any) => {
        const price = p.sale_price
          ? `${Number(p.sale_price).toLocaleString()}₮ (хямдарсан, анх: ${Number(p.price).toLocaleString()}₮)`
          : `${Number(p.price).toLocaleString()}₮`;
        const specs = Array.isArray(p.specs)
          ? p.specs.slice(0, 6).map((s: any) => `${s.key}: ${s.value}`).join(', ')
          : '';
        return `• ${p.name}${p.name_mn ? ` / ${p.name_mn}` : ''} — ${price} | Нөөц: ${p.stock_quantity} | ${specs}`;
      }).join('\n')
    : 'TechMart-д тохирох бараа олдсонгүй.';

  const lang = filters.language === 'mn' ? 'Монгол хэлээр' : 'in English';
  const contextPrompt = `## Хэрэглэгчийн хүсэлт
"${userMessage}"

## TechMart дахь бараа (шинэ үнэтэй)
${productContext}

## Нэмэлт мэдээлэл
- Ангилал: ${category || 'тодорхойгүй'}
- Брэнд: ${filters.brand || 'тодорхойгүй'}  
- Дээд үнэ: ${filters.max_price ? Number(filters.max_price).toLocaleString() + '₮' : 'хязгааргүй'}
- Зорилго: ${filters.use_case || 'тодорхойгүй'}

${filters.needs_web_search ? '⚡ Хэрэглэгч мэргэжлийн мэдээлэл хүсэж байна — вэб хайлт ашиглан дэлгэрэнгүй specs, benchmark, review өгнө үү.' : ''}

Respond ${lang}.`;

  const messages = [
    { role: 'system', content: MAIN_SYSTEM_PROMPT },
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: contextPrompt },
  ];

  // Step 4: Stream response (compound-beta → fallback llama)
  let fullText = '';
  let sources: Array<{ url: string; title: string }> = [];

  try {
    const response = await callGroq(MODEL_COMPOUND, messages, true, 0.7);

    if (!response.ok || !response.body) throw new Error('compound-beta unavailable');

    const result = await streamCompound(response, onChunk, onEvent);
    fullText = result.fullText;
    sources = result.sources;

  } catch (err) {
    // Fallback to regular streaming
    console.warn('compound-beta failed, falling back to llama:', err);
    try {
      const fallback = await callGroq(MODEL_FILTER, messages, true);
      if (!fallback.ok || !fallback.body) throw new Error('fallback also failed');

      const reader = fallback.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
          try {
            const data = JSON.parse(line.slice(6)) as any;
            const text: string = data.choices?.[0]?.delta?.content || '';
            if (text) { onChunk(text); fullText += text; }
          } catch {}
        }
      }
    } catch {
      const msg = 'Уучлаарай, түр алдаа гарлаа. Дахин оролдоно уу.';
      onChunk(msg);
      fullText = msg;
    }
  }

  // Step 5: Save history
  const updated: ChatMessage[] = [
    ...history,
    { role: 'user' as const, content: userMessage },
    { role: 'assistant' as const, content: fullText },
  ].slice(-20);
  await redis.setex(historyKey, 7200, JSON.stringify(updated));

  return { products, sources };
}

export async function getSession(sessionId: string): Promise<ChatMessage[]> {
  const raw = await redis.get(`ai:session:${sessionId}`);
  return raw ? JSON.parse(raw) : [];
}

export async function clearSession(sessionId: string): Promise<void> {
  await redis.del(`ai:session:${sessionId}`);
}