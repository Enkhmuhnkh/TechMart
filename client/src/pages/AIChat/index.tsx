import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Trash2, User, ShoppingCart, ExternalLink,
  Sparkles, Globe, Link as LinkIcon, Zap, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiApi } from '../../api';
import { formatPrice, effectivePrice, discountPercent, imgUrl } from '../../utils';
import { useAddToCart } from '../../hooks';
import { useAuthStore } from '../../store';
import type { Product } from '../../types';
import { cn } from '../../utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Source { url: string; title: string; }

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  sources?: Source[];
  isStreaming?: boolean;
  webSearches?: string[]; // хайсан query-нууд
}

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: '🎮', text: '3 сая доторх gaming laptop санал болго' },
  { icon: '📱', text: 'iPhone 17 болон Galaxy S26 харьцуул' },
  { icon: '💻', text: 'Programming хийх laptop юу авах вэ' },
  { icon: '🎧', text: 'Noise cancelling чихэвч шилдэг нь аль вэ' },
  { icon: '🖥️', text: '144Hz gaming monitor 1.5 сая доторх' },
];

// ─── Simple markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) { result.push(<br key={i} />); i++; continue; }

    // Heading ##
    if (line.startsWith('## ')) {
      result.push(
        <p key={i} className="font-bold text-sm mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>
          {renderInline(line.slice(3))}
        </p>
      );
      i++; continue;
    }

    // Heading ###
    if (line.startsWith('### ')) {
      result.push(
        <p key={i} className="font-semibold text-sm mt-2 mb-0.5" style={{ color: 'var(--brand-primary)' }}>
          {renderInline(line.slice(4))}
        </p>
      );
      i++; continue;
    }

    // Bullet list
    if (line.match(/^[-•*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-•*]\s/)) {
        items.push(lines[i].replace(/^[-•*]\s/, ''));
        i++;
      }
      result.push(
        <ul key={i} className="space-y-1 my-1.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand-primary)' }} />
              <span style={{ color: 'var(--text-primary)' }}>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      result.push(
        <ol key={i} className="space-y-1 my-1.5 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="font-bold text-xs mt-0.5 w-4 flex-shrink-0" style={{ color: 'var(--brand-primary)' }}>
                {j + 1}.
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph
    result.push(
      <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{result}</>;
}

function renderInline(text: string): React.ReactNode {
  // **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold" style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{ background: 'var(--surface-2)', color: 'var(--brand-primary)' }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Web search indicator ─────────────────────────────────────────────────────
function WebSearchBadge({ queries }: { queries: string[] }) {
  const [expanded, setExpanded] = useState(false);
  if (queries.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-1">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium w-fit"
        style={{ background: 'rgba(0,212,170,0.1)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.25)' }}>
        <Globe className="w-3.5 h-3.5" />
        Вэб хайлт хийлээ ({queries.length})
        <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
      </button>
      {expanded && (
        <div className="pl-2 space-y-1">
          {queries.map((q, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(0,212,170,0.15)', color: '#00D4AA' }}>{i + 1}</span>
              {q}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.span key={i}
          className="block w-2 h-2 rounded-full"
          style={{ background: 'var(--brand-primary)' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
      ))}
    </div>
  );
}

// ─── Searching indicator ──────────────────────────────────────────────────────
function SearchingIndicator({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs w-fit"
      style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', color: '#00D4AA' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <Globe className="w-3.5 h-3.5" />
      </motion.div>
      <span>Хайж байна: <span className="font-semibold">"{query}"</span></span>
    </motion.div>
  );
}

// ─── Product mini card ────────────────────────────────────────────────────────
function ProductMiniCard({ product }: { product: Product }) {
  const { i18n } = useTranslation();
  const { mutate: addToCart, isPending } = useAddToCart();
  const { isAuthenticated } = useAuthStore();
  const name = i18n.language === 'mn' && product.name_mn ? product.name_mn : product.name;
  const price = effectivePrice(product.price, product.sale_price);
  const discount = discountPercent(product.price, product.sale_price);
  const outOfStock = product.stock_quantity === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border"
      style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
      <Link to={`/products/${product.slug}`}>
        <div className="relative h-32 flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
          {product.image_url
            ? <img src={imgUrl(product.image_url)} alt={name} className="w-full h-full object-contain p-3" />
            : <span className="text-4xl">📦</span>}
          {discount && (
            <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: '#EF4444' }}>-{discount}%</span>
          )}
        </div>
      </Link>
      <div className="p-3 space-y-1.5">
        {product.brand_name && (
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{product.brand_name}</p>
        )}
        <Link to={`/products/${product.slug}`}>
          <p className="text-xs font-semibold line-clamp-2 leading-snug hover:text-brand-primary transition-colors"
            style={{ color: 'var(--text-primary)' }}>{name}</p>
        </Link>
        <p className="text-sm font-bold" style={{ color: 'var(--brand-primary)' }}>{formatPrice(price)}</p>
        {product.sale_price && (
          <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
            {formatPrice(Number(product.price))}
          </p>
        )}
        <div className="flex gap-1.5 pt-1">
          <Link to={`/products/${product.slug}`}
            className="w-8 h-8 rounded-xl border flex items-center justify-center hover:border-brand-primary transition-colors flex-shrink-0"
            style={{ borderColor: 'var(--border)' }}>
            <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          </Link>
          <button
            onClick={() => isAuthenticated && !outOfStock && addToCart({ productId: product.id })}
            disabled={outOfStock || isPending || !isAuthenticated}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold rounded-xl py-1.5 text-white disabled:opacity-40 transition-all active:scale-95"
            style={{ background: outOfStock ? 'var(--surface-2)' : 'var(--brand-primary)' }}>
            <ShoppingCart className="w-3 h-3" />
            {outOfStock ? 'Дууссан' : isPending ? '...' : 'Нэмэх'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sources ──────────────────────────────────────────────────────────────────
function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
        <LinkIcon className="w-3 h-3" /> Эх сурвалж
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.slice(0, 4).map((s, i) => {
          let host = '';
          try { host = new URL(s.url).hostname.replace('www.', ''); } catch {}
          return (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              <span className="font-medium">{i + 1}</span>
              <span className="truncate max-w-[120px]">{s.title || host}</span>
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((force = false) => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    setIsLoading(true);
    setCurrentSearchQuery(null);

    const uid = Date.now().toString();
    const aid = (uid + 1).toString();

    setMessages(prev => [
      ...prev,
      { id: uid, role: 'user', content: text },
      { id: aid, role: 'assistant', content: '', isStreaming: true, webSearches: [] },
    ]);

    setTimeout(() => scrollToBottom(true), 50);

    try {
      const response = await aiApi.chat(text, sessionId);
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let products: Product[] = [];
      let sources: Source[] = [];
      const webSearches: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'text') {
              content += data.content;
              setMessages(prev => prev.map(m =>
                m.id === aid ? { ...m, content, webSearches: [...webSearches] } : m
              ));
              scrollToBottom();
            } else if (data.type === 'searching') {
              webSearches.push(data.query);
              setCurrentSearchQuery(data.query);
              setMessages(prev => prev.map(m =>
                m.id === aid ? { ...m, webSearches: [...webSearches] } : m
              ));
            } else if (data.type === 'source') {
              sources.push({ url: data.url, title: data.title });
            } else if (data.type === 'products') {
              products = data.products || [];
            } else if (data.type === 'sources') {
              sources = data.sources || [];
            } else if (data.type === 'done') {
              setCurrentSearchQuery(null);
            }
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === aid ? { ...m, content, products, sources, webSearches, isStreaming: false } : m
      ));
      setTimeout(() => scrollToBottom(true), 100);

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aid ? {
          ...m,
          content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.',
          isStreaming: false,
        } : m
      ));
    } finally {
      setIsLoading(false);
      setCurrentSearchQuery(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isLoading, sessionId, scrollToBottom]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>TechMart AI</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Вэб хайлт · TechMart бараа · МН/EN
              </span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); aiApi.clearSession(sessionId); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors hover:border-red-400 hover:text-red-500"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <Trash2 className="w-3.5 h-3.5" /> Шинэ яриа
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: 'var(--surface-1)' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(168,85,247,0.15))' }}>
                <Sparkles className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                Юу хайж байна вэ?
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Бараа харьцуулах, specs мэдэх, зөвлөгөө авах
              </p>
            </div>

            {/* Capabilities */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { icon: <Globe className="w-3.5 h-3.5" />, label: 'Вэб хайлт', color: '#00D4AA' },
                { icon: <Zap className="w-3.5 h-3.5" />, label: 'Шууд streaming', color: '#F59E0B' },
                { icon: <Bot className="w-3.5 h-3.5" />, label: 'TechMart бараа', color: '#6C63FF' },
              ].map(c => (
                <div key={c.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background: c.color + '15', color: c.color, border: `1px solid ${c.color}25` }}>
                  {c.icon} {c.label}
                </div>
              ))}
            </div>

            {/* Suggested */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTED.map(s => (
                <button key={s.text} onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:border-brand-primary hover:bg-[var(--surface-0)] active:scale-98"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
                  <span className="text-xl">{s.icon}</span>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-5 max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>

                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5',
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-[#6C63FF] to-[#a855f7]'
                    : 'bg-[var(--surface-2)]'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
                </div>

                <div className={cn(
                  'flex flex-col gap-2 min-w-0',
                  msg.role === 'user' ? 'items-end max-w-[80%]' : 'items-start flex-1'
                )}>

                  {/* User bubble */}
                  {msg.role === 'user' && (
                    <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
                      style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                      {msg.content}
                    </div>
                  )}

                  {/* Assistant — web search badges */}
                  {msg.role === 'assistant' && (
                    <>
                      {/* Active searching indicator */}
                      {msg.isStreaming && currentSearchQuery && (
                        <SearchingIndicator query={currentSearchQuery} />
                      )}

                      {/* Completed web searches */}
                      {!msg.isStreaming && msg.webSearches && msg.webSearches.length > 0 && (
                        <WebSearchBadge queries={msg.webSearches} />
                      )}

                      {/* Text bubble */}
                      {(msg.content || msg.isStreaming) && (
                        <div className="rounded-2xl rounded-tl-sm border px-4 py-3 w-full"
                          style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
                          {msg.isStreaming && !msg.content
                            ? <TypingDots />
                            : <div className="space-y-1">{renderMarkdown(msg.content)}</div>}
                        </div>
                      )}

                      {/* Sources */}
                      {!msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                        <SourceList sources={msg.sources} />
                      )}

                      {/* Products */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="w-full">
                          <p className="text-xs mb-2 flex items-center gap-1.5 font-semibold"
                            style={{ color: 'var(--text-tertiary)' }}>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            TechMart-д байгаа {msg.products.length} бараа:
                          </p>
                          <div className="flex gap-2.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                            {msg.products.map(p => <ProductMiniCard key={p.id} product={p} />)}
                          </div>
                        </div>
                      )}

                      {/* No products link */}
                      {!msg.isStreaming && msg.products?.length === 0 && msg.content && (
                        <Link to="/shop"
                          className="text-xs flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--brand-primary)' }}>
                          <ExternalLink className="w-3 h-3" /> Дэлгүүрт бүгдийг харах
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div ref={bottomRef} className="h-4" />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 border-t px-4 py-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="max-w-3xl mx-auto flex gap-2 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="3 сая доторх gaming laptop..."
            disabled={isLoading}
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-primary focus:ring-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              '--tw-ring-color': 'rgba(108,99,255,0.15)',
            } as any}
          />
          <button type="submit" disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all active:scale-90"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
            {isLoading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4 text-white" />}
          </button>
        </form>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
          Powered by Groq compound-beta · Llama 3.3 · Web Search
        </p>
      </div>
    </div>
  );
}
