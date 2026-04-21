import { redis } from '../../config/redis';
import { query } from '../../shared/db';
import { env } from '../../config/env';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

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
  "intent": "search" or "recommend" or "compare" or "question",
  "search_terms": null
}

Examples:
- "samsungiin utas" -> {"category":"phones","brand":"Samsung","search_terms":null}
- "чихэвч санал болго" -> {"category":"earbuds","brand":null,"search_terms":null}
- "apple laptop" -> {"category":"laptops","brand":"Apple","search_terms":null}
- "3 сая доторх gaming laptop" -> {"category":"laptops","brand":null,"max_price":3000000,"use_case":"gaming","search_terms":null}
- "144hz monitor" -> {"category":"monitors","brand":null,"specs":[{"key":"refresh_rate","value":"144hz"}],"search_terms":null}`;


const RECOMMENDATION_SYSTEM_PROMPT = `You are TechMart AI — a friendly, knowledgeable shopping assistant for a tech store in Mongolia.
You speak both Mongolian and English naturally. Always respond in the same language the user wrote in.
If the user wrote in Mongolian, respond entirely in Mongolian. If English, respond in English.

Your role:
1. Warmly acknowledge the user's request
2. Recommend 2-3 of the best matching products from the provided list
3. Explain specifically why each product matches the user's needs
4. Highlight the most relevant specs for their use case
5. If budget is tight, suggest the best value option
6. End with ONE helpful follow-up question

Be conversational, helpful, and concise. Never invent specs — only use what is in the product data.
If no products match well, honestly say so and suggest broadening the search.`;

interface FilterResult {
  language: string;
  category: string | null;
  brand: string | null;
  min_price: number | null;
  max_price: number | null;
  specs: Array<{ key: string; value: string }>;
  use_case: string | null;
  intent: string;
  search_terms: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callGroq(messages: Array<{ role: string; content: string }>, stream = false): Promise<Response> {
  const apiKey = (env as any).GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

  return fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      stream,
    }),
  });
}

async function extractFilters(userMessage: string): Promise<FilterResult> {
  try {
    const response = await callGroq([
      { role: 'system', content: FILTER_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);
    const data = await response.json() as any;
    const text: string = data.choices?.[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      language: 'mn', category: null, brand: null,
      min_price: null, max_price: null, specs: [],
      use_case: null, intent: 'search', search_terms: userMessage,
    };
  }
}

// Category alias map — AI буруу slug буцаавал зөв болгоно
const CATEGORY_MAP: Record<string, string> = {
  // phones
  smartphones: 'phones', smartphone: 'phones', phone: 'phones',
  mobile: 'phones', 'mobile phones': 'phones', utas: 'phones',
  'гар утас': 'phones', утас: 'phones',
  // laptops
  laptop: 'laptops', notebook: 'laptops', notebooks: 'laptops',
  computer: 'laptops', computers: 'laptops', 'зөөврийн': 'laptops',
  // monitors
  monitor: 'monitors', display: 'monitors', displays: 'monitors',
  screen: 'monitors', дэлгэц: 'monitors', delgec: 'monitors',
  // earbuds — most variants
  earbud: 'earbuds', earphone: 'earbuds', earphones: 'earbuds',
  'true wireless': 'earbuds', tws: 'earbuds', airpod: 'earbuds',
  airpods: 'earbuds', чихэвч: 'earbuds', chihewch: 'earbuds',
  chihew: 'earbuds', 'чихэв': 'earbuds', 'togloomiin chihewch': 'earbuds',
  'gaming earbuds': 'earbuds', 'wireless earbuds': 'earbuds',
  // headphones
  headphone: 'headphones', 'том чихэвч': 'headphones',
  // keyboards
  keyboard: 'keyboards', гар: 'keyboards', клавиатур: 'keyboards',
  // mice
  mouse: 'mice', хулгана: 'mice',
  // gpus
  gpu: 'gpus', 'graphics card': 'gpus', 'video card': 'gpus',
  'видео карт': 'gpus', 'график карт': 'gpus',
  // storage
  ssd: 'storage', hdd: 'storage', drive: 'storage',
  'хадгалах': 'storage', диск: 'storage',
  // smartwatches
  smartwatch: 'smartwatches', watch: 'smartwatches',
  'ухаалаг цаг': 'smartwatches', цаг: 'smartwatches',
};

function normalizeCategory(cat: string | null): string | null {
  if (!cat) return null;
  const lower = cat.toLowerCase().trim();
  return CATEGORY_MAP[lower] || lower;
}

async function runProductQuery(conditions: string[], vals: unknown[], limit: number) {
  const i = vals.length + 1;
  const where = `WHERE ${conditions.join(' AND ')}`;
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
     LEFT JOIN product_specs ps ON ps.product_id = p.id
     ${where}
     GROUP BY p.id, b.name, c.name, c.slug
     ORDER BY p.created_at DESC
     LIMIT $${i}`,
    [...vals, limit]
  );
  return rows;
}

async function queryProducts(filters: FilterResult, limit = 5): Promise<unknown[]> {
  const category = normalizeCategory(filters.category);
  console.log('🤖 AI Filters:', JSON.stringify({ ...filters, category }));

  const base = ["p.status = 'active'", 'p.stock_quantity > 0'];

  // Build conditions step by step, fallback broader each time
  const conditions = [...base];
  const vals: unknown[] = [];
  let i = 1;

  if (category) { conditions.push(`c.slug = $${i++}`); vals.push(category); }
  if (filters.brand) { conditions.push(`b.name ILIKE $${i++}`); vals.push(`%${filters.brand}%`); }
  if (filters.max_price) { conditions.push(`COALESCE(p.sale_price, p.price) <= $${i++}`); vals.push(filters.max_price); }
  if (filters.min_price) { conditions.push(`COALESCE(p.sale_price, p.price) >= $${i++}`); vals.push(filters.min_price); }
  if (filters.search_terms) {
    conditions.push(`(p.name ILIKE $${i} OR p.description ILIKE $${i} OR p.name_mn ILIKE $${i} OR b.name ILIKE $${i})`);
    vals.push(`%${filters.search_terms}%`); i++;
  }

  try {
    // Attempt 1: full filters
    let rows = await runProductQuery(conditions, vals, limit);
    if (rows.length > 0) return rows;

    // Attempt 2: drop price filters
    const noPriceConds = [...base];
    const noPriceVals: unknown[] = [];
    let j = 1;
    if (category) { noPriceConds.push(`c.slug = $${j++}`); noPriceVals.push(category); }
    if (filters.brand) { noPriceConds.push(`b.name ILIKE $${j++}`); noPriceVals.push(`%${filters.brand}%`); }
    if (filters.search_terms) {
      noPriceConds.push(`(p.name ILIKE $${j} OR p.name_mn ILIKE $${j} OR b.name ILIKE $${j})`);
      noPriceVals.push(`%${filters.search_terms}%`); j++;
    }
    rows = await runProductQuery(noPriceConds, noPriceVals, limit);
    if (rows.length > 0) return rows;

    // Attempt 3: category only
    if (category) {
      rows = await runProductQuery([...base, `c.slug = $1`], [category], limit);
      if (rows.length > 0) return rows;
    }

    // Attempt 4: brand only
    if (filters.brand) {
      rows = await runProductQuery([...base, `b.name ILIKE $1`], [`%${filters.brand}%`], limit);
      if (rows.length > 0) return rows;
    }

    // Attempt 5: name/search only
    if (filters.search_terms) {
      rows = await runProductQuery(
        [...base, `(p.name ILIKE $1 OR p.name_mn ILIKE $1 OR b.name ILIKE $1)`],
        [`%${filters.search_terms}%`], limit
      );
      if (rows.length > 0) return rows;
    }

    // Attempt 6: use_case keyword search
    if (filters.use_case) {
      rows = await runProductQuery(
        [...base, `(p.name ILIKE $1 OR p.description ILIKE $1)`],
        [`%${filters.use_case}%`], limit
      );
      if (rows.length > 0) return rows;
    }

    // Final fallback: newest active products
    const { rows: fallback } = await query(
      `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
              b.name as brand_name, c.name as category_name, c.slug as category_slug,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as image_url
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.status = 'active' AND p.stock_quantity > 0
       ORDER BY p.created_at DESC LIMIT $1`, [limit]
    );
    return fallback;
  } catch (err) {
    console.error('queryProducts error:', err);
    return [];
  }
}

export async function chat(
  userMessage: string,
  sessionId: string,
  onChunk: (chunk: string) => void
): Promise<{ products: unknown[]; filters: FilterResult }> {
  const historyKey = `ai:session:${sessionId}`;
  const historyRaw = await redis.get(historyKey);
  const history: ChatMessage[] = historyRaw ? JSON.parse(historyRaw) : [];

  // Pass 1: Extract filters
  const filters = await extractFilters(userMessage);

  // Pass 2: Query products
  const products = await queryProducts(filters);

  // Build messages
  const category = normalizeCategory(filters.category);
  const productSummary = products.map((p: any) => ({
    name: p.name, name_mn: p.name_mn, brand: p.brand_name,
    price: Math.round(p.sale_price || p.price).toLocaleString() + '₮',
    stock: p.stock_quantity,
    specs: Array.isArray(p.specs) ? p.specs.slice(0, 4) : [],
  }));
  const lang = filters.language === 'mn' ? 'Mongolian (Монгол хэлээр)' : 'English';
  const prompt = `User: "${userMessage}"
Category: ${category || 'any'}, Brand: ${filters.brand || 'any'}, Max: ${filters.max_price || 'any'}₮
Products found: ${productSummary.length}
${productSummary.length > 0 ? JSON.stringify(productSummary, null, 2) : 'None found — suggest alternatives or ask what they need.'}
Respond in ${lang}. Be concise and helpful.`;

  const messages = [
    { role: 'system', content: RECOMMENDATION_SYSTEM_PROMPT },
    ...history.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ];

  // Stream response
  const response = await callGroq(messages, true);

  if (!response.ok || !response.body) {
    // Fallback non-streaming
    const fallback = await callGroq(messages, false);
    const data = await fallback.json() as any;
    const text: string = data.choices?.[0]?.message?.content || 'Уучлаарай, алдаа гарлаа.';
    onChunk(text);
    await saveHistory(historyKey, history, userMessage, text);
    return { products, filters };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6)) as any;
          const text: string = data.choices?.[0]?.delta?.content || '';
          if (text) { onChunk(text); fullResponse += text; }
        } catch {}
      }
    }
  }

  await saveHistory(historyKey, history, userMessage, fullResponse);
  return { products, filters };
}

async function saveHistory(key: string, history: ChatMessage[], userMsg: string, assistantMsg: string) {
  const updated: ChatMessage[] = [
    ...history,
    { role: 'user' as const, content: userMsg },
    { role: 'assistant' as const, content: assistantMsg },
  ].slice(-20);
  await redis.setex(key, 7200, JSON.stringify(updated));
}

export async function getSession(sessionId: string): Promise<ChatMessage[]> {
  const raw = await redis.get(`ai:session:${sessionId}`);
  return raw ? JSON.parse(raw) : [];
}

export async function clearSession(sessionId: string): Promise<void> {
  await redis.del(`ai:session:${sessionId}`);
}
                          