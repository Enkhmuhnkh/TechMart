import { query, queryOne } from '../../shared/db';
import { env } from '../../config/env';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ── In-memory fallback for sessions (Redis-гүй үед) ───────────────────────────
const memSessions = new Map<string, ChatMessage[]>();

// ── System prompts ─────────────────────────────────────────────────────────────
const FILTER_SYSTEM_PROMPT = `You are a precise product filter extraction engine for TechMart — a Mongolian tech store.
User writes in Mongolian, English, or mixed. Output ONLY raw JSON — no markdown, no backticks.

CRITICAL RULES:
1. Extract the EXACT brand mentioned. "Samsung" -> brand="Samsung". Never change or add brands.
2. Extract the EXACT category. Never mix categories.
3. If user says "Samsung phone", set brand="Samsung" AND category="phones".
4. Set search_terms to NULL always — use category and brand instead.
5. detect_web_search: true if user asks about product reviews, comparisons, specs not in DB, "best X", "ямар нь сайн"

Category mapping:
- utas, утас, phone, smartphone -> "phones"
- laptop, зөөврийн, notebook -> "laptops"
- monitor, дэлгэц -> "monitors"
- earbuds, чихэвч, airpods, tws -> "earbuds"
- headphones, том чихэвч -> "headphones"
- keyboard, гар, клавиатур -> "keyboards"
- mouse, хулгана -> "mice"
- gpu, видео карт -> "gpus"
- ssd, hdd, storage, хадгалах -> "storage"
- smartwatch, ухаалаг цаг -> "smartwatches"
- tablet, iPad -> "tablets"

Price: "сая/say" = 1000000, "мянга/myanga" = 1000.

Output format:
{
  "language": "mn" or "en",
  "category": string or null,
  "brand": string or null,
  "min_price": number or null,
  "max_price": number or null,
  "specs": [{"key": string, "value": string}],
  "use_case": string or null,
  "intent": "search" | "recommend" | "compare" | "question" | "research",
  "search_terms": null,
  "detect_web_search": boolean,
  "web_query": string or null
}`;

const MAIN_SYSTEM_PROMPT = `Чи TechMart AI туслагч — Монголын tech дэлгүүрийн мэргэжлийн зөвлөгч.

ЧИНИЙ ТУХАЙ:
- Нэр: TechMart AI
- Монгол болон Англи хэлээр чөлөөтэй ярилцана
- Хэрэглэгчийн бичсэн хэлээр хариулна
- Мэргэжлийн, найрсаг, товч байна

ХИЙЖ ЧАДАХ ЗҮЙ:
1. 🔍 Дэлгүүрийн бодит бараануудаас хайж санал болгох
2. 💡 Техникийн зөвлөгөө өгөх (spec тайлбарлах, харьцуулах)
3. 🌐 Интернетийн мэдээлэл дээр үндэслэн гүнзгий дүн шинжилгээ хийх
4. 📊 Бараануудыг харьцуулж давуу/сул талыг тайлбарлах
5. 💰 Төсөвт тохирсон хамгийн зүйтэй сонголт санал болгох

БАРАА САНАЛ БОЛГОХДОО:
- Заавал бодит мэдээлэл ашиглах, зохиомол spec бичихгүй
- Үнэ, нөөц, брэнд зөв дурьдах
- Хэрэглэгчийн хэрэгцээнд яагаад тохирохыг тайлбарлах
- Сагсанд нэмэх товч дарах боломжтойг дурьдаж болно

ВЕБ ХАЙЛТЫН ДҮНГ АШИГЛАХДАА:
- "Интернетийн мэдээллээс үзэхэд..." гэж эхлэх
- Мэдээллийн эх сурвалжийг дурьдах
- Дэлгүүрийн бараатай холбох

ТУСЛАМЖ ХҮСЭХ АСУУЛТЫН ЖИШЭЭ:
- "Дэлгэрэнгүй мэдэхийг хүсвэл надаас асуугаарай"
- Сүүлд НЭГ л асуулт тавих

ХЯЗГААРЛАЛТ:
- Дэлгүүртэй холбогдохгүй сэдвүүдэд "Би зөвхөн tech бараа, дэлгүүрийн талаар туслах боломжтой" гэж хэлэх`;

// ── Types ──────────────────────────────────────────────────────────────────────
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
  detect_web_search: boolean;
  web_query: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Groq call ─────────────────────────────────────────────────────────────────
async function callGroq(
  messages: Array<{ role: string; content: string }>,
  stream = false,
  temperature = 0.7
): Promise<Response> {
  const apiKey = (env as any).GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');
  return fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: 1500, stream }),
  });
}

// ── Web search via Groq (интернет дэх мэдээлэл) ───────────────────────────────
async function webResearch(query: string, lang: string): Promise<string> {
  try {
    const langInstr = lang === 'mn' ? 'Монгол хэлээр хариул.' : 'Respond in English.';
    const response = await callGroq([
      {
        role: 'system',
        content: `Чи tech бүтээгдэхүүний мэргэжлийн шинжээч. Интернетийн мэдлэгтээ үндэслэн дэлгэрэнгүй, бодит мэдээлэл өг.
Дараах зүйлийг оруул: техникийн үзүүлэлт, давуу/сул тал, үнийн зах зээлийн байдал, хэрэглэгчдийн ерөнхий санал.
${langInstr} 300 үгнээс хэтрэхгүй байх.`,
      },
      { role: 'user', content: `${query} талаар дэлгэрэнгүй мэдээлэл өг.` },
    ], false, 0.3);
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// ── Filter extraction ──────────────────────────────────────────────────────────
async function extractFilters(userMessage: string, history: ChatMessage[]): Promise<FilterResult> {
  try {
    // Include last 2 exchanges for context
    const ctx = history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = ctx ? `Өмнөх яриа:\n${ctx}\n\nШинэ асуулт: ${userMessage}` : userMessage;
    const response = await callGroq([
      { role: 'system', content: FILTER_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ], false, 0.1);
    const data = await response.json() as any;
    const text: string = data.choices?.[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      language: 'mn', category: null, brand: null,
      min_price: null, max_price: null, specs: [],
      use_case: null, intent: 'search', search_terms: userMessage,
      detect_web_search: false, web_query: null,
    };
  }
}

// ── Category normalization ─────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  smartphones: 'phones', smartphone: 'phones', phone: 'phones', mobile: 'phones',
  utas: 'phones', утас: 'phones',
  laptop: 'laptops', notebook: 'laptops', зөөврийн: 'laptops',
  monitor: 'monitors', display: 'monitors', дэлгэц: 'monitors',
  earbud: 'earbuds', earphone: 'earbuds', airpod: 'earbuds', airpods: 'earbuds',
  tws: 'earbuds', чихэвч: 'earbuds',
  headphone: 'headphones', 'том чихэвч': 'headphones',
  keyboard: 'keyboards', клавиатур: 'keyboards',
  mouse: 'mice', хулгана: 'mice',
  gpu: 'gpus', 'graphics card': 'gpus', 'видео карт': 'gpus',
  ssd: 'storage', hdd: 'storage', хадгалах: 'storage',
  smartwatch: 'smartwatches', 'ухаалаг цаг': 'smartwatches',
  ipad: 'tablets',
};

function normalizeCategory(cat: string | null): string | null {
  if (!cat) return null;
  const lower = cat.toLowerCase().trim();
  return CATEGORY_MAP[lower] || lower;
}

// ── Product query ──────────────────────────────────────────────────────────────
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
     LEFT JOIN product_specs ps ON ps.product_id = p.id
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

  const attempts: Array<[string[], unknown[]]> = [];

  // Attempt 1: All filters
  {
    const c = [...base]; const v: unknown[] = []; let i = 1;
    if (category) { c.push(`c.slug = $${i++}`); v.push(category); }
    if (filters.brand) { c.push(`b.name ILIKE $${i++}`); v.push(`%${filters.brand}%`); }
    if (filters.max_price) { c.push(`COALESCE(p.sale_price, p.price) <= $${i++}`); v.push(filters.max_price); }
    if (filters.min_price) { c.push(`COALESCE(p.sale_price, p.price) >= $${i++}`); v.push(filters.min_price); }
    attempts.push([c, v]);
  }
  // Attempt 2: No price
  {
    const c = [...base]; const v: unknown[] = []; let i = 1;
    if (category) { c.push(`c.slug = $${i++}`); v.push(category); }
    if (filters.brand) { c.push(`b.name ILIKE $${i++}`); v.push(`%${filters.brand}%`); }
    attempts.push([c, v]);
  }
  // Attempt 3: Category only
  if (category) attempts.push([[...base, `c.slug = $1`], [category]]);
  // Attempt 4: Brand only
  if (filters.brand) attempts.push([[...base, `b.name ILIKE $1`], [`%${filters.brand}%`]]);
  // Attempt 5: Use case search
  if (filters.use_case) attempts.push([[...base, `(p.name ILIKE $1 OR p.description ILIKE $1)`], [`%${filters.use_case}%`]]);
  // Fallback: newest products
  attempts.push([[...base], []]);

  for (const [conds, vals] of attempts) {
    try {
      const rows = await runProductQuery(conds, vals, limit);
      if (rows.length > 0) return rows;
    } catch {}
  }
  return [];
}

// ── DB History helpers ─────────────────────────────────────────────────────────
async function getOrCreateSession(sessionToken: string, userId?: string): Promise<string> {
  try {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM chat_sessions WHERE session_token = $1', [sessionToken]
    );
    if (existing) return existing.id;

    const { rows } = await query(
      `INSERT INTO chat_sessions (session_token, user_id, title)
       VALUES ($1, $2, 'Шинэ яриа') RETURNING id`,
      [sessionToken, userId || null]
    );
    return rows[0].id;
  } catch {
    return sessionToken; // fallback
  }
}

async function saveMessageToDB(
  sessionId: string, role: 'user' | 'assistant',
  content: string, products: unknown[] = []
): Promise<void> {
  try {
    await query(
      `INSERT INTO chat_messages (session_id, role, content, products_json)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, role, content, JSON.stringify(products)]
    );
    await query(
      `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  } catch (e) {
    console.error('saveMessageToDB error:', e);
  }
}

async function getSessionHistory(sessionToken: string): Promise<ChatMessage[]> {
  try {
    const session = await queryOne<{ id: string }>(
      'SELECT id FROM chat_sessions WHERE session_token = $1', [sessionToken]
    );
    if (!session) return memSessions.get(sessionToken) || [];

    const { rows } = await query(
      `SELECT role, content FROM chat_messages
       WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [session.id]
    );
    return rows as ChatMessage[];
  } catch {
    return memSessions.get(sessionToken) || [];
  }
}

function updateMemHistory(token: string, user: string, assistant: string) {
  const h = memSessions.get(token) || [];
  const updated = [...h, { role: 'user' as const, content: user }, { role: 'assistant' as const, content: assistant }].slice(-20);
  memSessions.set(token, updated);
}

// ── Update session title ───────────────────────────────────────────────────────
async function updateSessionTitle(sessionId: string, userMessage: string): Promise<void> {
  try {
    const title = userMessage.slice(0, 80).trim();
    await query('UPDATE chat_sessions SET title = $1 WHERE id = $2 AND title = $3', [title, sessionId, 'Шинэ яриа']);
  } catch {}
}

// ── Main chat function ─────────────────────────────────────────────────────────
export async function chat(
  userMessage: string,
  sessionToken: string,
  onChunk: (chunk: string) => void,
  userId?: string
): Promise<{ products: unknown[]; filters: FilterResult }> {

  // 1. Load history
  const history = await getSessionHistory(sessionToken);

  // 2. Extract filters (context-aware)
  const filters = await extractFilters(userMessage, history);
  const category = normalizeCategory(filters.category);

  // 3. Query products from DB
  const products = await queryProducts(filters);

  // 4. Web research if needed
  let webInfo = '';
  const needsWebSearch = filters.detect_web_search ||
    filters.intent === 'research' ||
    (filters.intent === 'question' && products.length === 0);

  if (needsWebSearch) {
    const searchQuery = filters.web_query ||
      `${filters.brand || ''} ${filters.category || ''} ${userMessage}`.trim();
    onChunk('\n'); // signal to frontend
    webInfo = await webResearch(searchQuery, filters.language);
  }

  // 5. Build prompt
  const productSummary = products.map((p: any) => ({
    name: p.name,
    name_mn: p.name_mn,
    brand: p.brand_name,
    category: p.category_name,
    price: `${Math.round(Number(p.sale_price || p.price)).toLocaleString()}₮`,
    original_price: p.sale_price ? `${Math.round(Number(p.price)).toLocaleString()}₮` : null,
    stock: p.stock_quantity,
    description: p.description?.slice(0, 150),
    specs: Array.isArray(p.specs) ? p.specs.slice(0, 5) : [],
    slug: p.slug,
  }));

  const lang = filters.language === 'mn' ? 'Монгол' : 'English';

  let contextPrompt = `Хэрэглэгчийн асуулт: "${userMessage}"
Хайлтын параметр: ангилал=${category || 'бүгд'}, брэнд=${filters.brand || 'бүгд'}, хамгийн их үнэ=${filters.max_price ? filters.max_price.toLocaleString() + '₮' : 'тодорхойгүй'}
Дэлгүүрээс олдсон бараа: ${productSummary.length} ширхэг

${productSummary.length > 0
  ? `ДЭЛГҮҮРИЙН БАРААНУУД:\n${JSON.stringify(productSummary, null, 2)}`
  : 'Дэлгүүрт тохирох бараа олдсонгүй.'}

${webInfo ? `\nИНТЕРНЕТИЙН МЭДЭЭЛЭЛ (${filters.web_query || userMessage}):\n${webInfo}` : ''}

${lang} хэлээр хариул. Товч, мэргэжлийн байх.`;

  const messages = [
    { role: 'system', content: MAIN_SYSTEM_PROMPT },
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: contextPrompt },
  ];

  // 6. Stream response
  let fullResponse = '';

  try {
    const response = await callGroq(messages, true);

    if (!response.ok || !response.body) throw new Error('Stream failed');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6)) as any;
            const text: string = data.choices?.[0]?.delta?.content || '';
            if (text) { onChunk(text); fullResponse += text; }
          } catch {}
        }
      }
    }
  } catch {
    // Fallback non-streaming
    try {
      const fallback = await callGroq(messages, false);
      const data = await fallback.json() as any;
      fullResponse = data.choices?.[0]?.message?.content || 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.';
      onChunk(fullResponse);
    } catch {
      fullResponse = 'Уучлаарай, алдаа гарлаа.';
      onChunk(fullResponse);
    }
  }

  // 7. Save to DB
  try {
    const dbSessionId = await getOrCreateSession(sessionToken, userId);
    await updateSessionTitle(dbSessionId, userMessage);
    await saveMessageToDB(dbSessionId, 'user', userMessage);
    await saveMessageToDB(dbSessionId, 'assistant', fullResponse, products);
  } catch {}

  // 8. Update in-memory fallback
  updateMemHistory(sessionToken, userMessage, fullResponse);

  return { products, filters };
}

// ── Public session functions ───────────────────────────────────────────────────
export async function getSession(sessionToken: string): Promise<ChatMessage[]> {
  return getSessionHistory(sessionToken);
}

export async function clearSession(sessionToken: string): Promise<void> {
  try {
    memSessions.delete(sessionToken);
    const session = await queryOne<{ id: string }>(
      'SELECT id FROM chat_sessions WHERE session_token = $1', [sessionToken]
    );
    if (session) {
      await query('DELETE FROM chat_messages WHERE session_id = $1', [session.id]);
      await query('DELETE FROM chat_sessions WHERE id = $1', [session.id]);
    }
  } catch {}
}

export async function getUserSessions(userId: string) {
  try {
    const { rows } = await query(
      `SELECT cs.session_token, cs.title, cs.updated_at,
              COUNT(cm.id) as message_count
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cm.session_id = cs.id
       WHERE cs.user_id = $1
       GROUP BY cs.id, cs.session_token, cs.title, cs.updated_at
       ORDER BY cs.updated_at DESC LIMIT 20`,
      [userId]
    );
    return rows;
  } catch { return []; }
}